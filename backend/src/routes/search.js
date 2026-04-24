const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { normalizeHandle } = require('../lib/users');

const router = express.Router();
const prisma = new PrismaClient();

const ARTICLE_SEARCH_SELECT = {
  id: true,
  title: true,
  titleEn: true,
  excerpt: true,
  cover: true,
  tags: true,
  views: true,
  readTime: true,
  createdAt: true,
  author: {
    select: {
      id: true,
      name: true,
      handle: true,
      avatar: true,
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
};

const AUTHOR_SEARCH_SELECT = {
  id: true,
  name: true,
  handle: true,
  previousHandle: true,
  bio: true,
  avatar: true,
  createdAt: true,
  _count: {
    select: {
      articles: true,
      followers: true,
    },
  },
};

const unique = (items) => Array.from(new Set(items.filter(Boolean)));

const buildSearchTerms = (rawQuery) => {
  const query = String(rawQuery || '').trim().slice(0, 80);
  if (!query) return [];

  const parts = query
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const handle = normalizeHandle(query);
  return unique([query, ...parts, handle]).slice(0, 6);
};

const makeScore = (value, terms, weights = {}) => {
  if (!value) return 0;

  const text = String(value).trim().toLowerCase();
  if (!text) return 0;

  const {
    exact = 120,
    prefix = 72,
    contains = 36,
  } = weights;

  return terms.reduce((score, term) => {
    const needle = String(term || '').trim().toLowerCase();
    if (!needle) return score;
    if (text === needle) return score + exact;
    if (text.startsWith(needle)) return score + prefix;
    if (text.includes(needle)) return score + contains;
    return score;
  }, 0);
};

const makeArrayScore = (values, terms, weights = {}) => {
  if (!Array.isArray(values) || !values.length) return 0;
  return values.reduce((score, value) => score + makeScore(value, terms, weights), 0);
};

const scoreArticle = (article, textTerms, handleTerms) => {
  const score =
    makeScore(article.title, textTerms, { exact: 220, prefix: 140, contains: 92 }) +
    makeScore(article.titleEn, textTerms, { exact: 130, prefix: 90, contains: 60 }) +
    makeScore(article.excerpt, textTerms, { exact: 56, prefix: 32, contains: 18 }) +
    makeArrayScore(article.tags, textTerms, { exact: 120, prefix: 72, contains: 40 }) +
    makeScore(article.author?.name, textTerms, { exact: 120, prefix: 88, contains: 52 }) +
    makeScore(article.author?.handle, handleTerms, { exact: 140, prefix: 96, contains: 68 });

  return score + Math.min(article._count.likes, 20) + Math.min(Math.floor(article.views / 200), 20);
};

const scoreAuthor = (author, textTerms, handleTerms) => {
  const score =
    makeScore(author.name, textTerms, { exact: 220, prefix: 144, contains: 90 }) +
    makeScore(author.handle, handleTerms, { exact: 240, prefix: 164, contains: 96 }) +
    makeScore(author.previousHandle, handleTerms, { exact: 168, prefix: 108, contains: 72 }) +
    makeScore(author.bio, textTerms, { exact: 36, prefix: 24, contains: 14 });

  return score + Math.min(author._count.articles * 8, 32) + Math.min(author._count.followers, 32);
};

router.get('/', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 80);
    const limit = Math.max(1, Math.min(8, parseInt(req.query.limit, 10) || 5));

    if (!query) {
      return res.json({
        query: '',
        articles: [],
        authors: [],
      });
    }

    const textTerms = buildSearchTerms(query);
    const handleTerms = unique(textTerms.map((term) => normalizeHandle(term))).filter(Boolean);
    const articleClauses = [];
    const authorClauses = [];

    textTerms.forEach((term) => {
      articleClauses.push(
        { title: { contains: term, mode: 'insensitive' } },
        { titleEn: { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
        {
          author: {
            is: {
              name: { contains: term, mode: 'insensitive' },
            },
          },
        },
      );

      authorClauses.push(
        { name: { contains: term, mode: 'insensitive' } },
        { bio: { contains: term, mode: 'insensitive' } },
      );
    });

    handleTerms.forEach((term) => {
      articleClauses.push({
        author: {
          is: {
            OR: [
              { handle: { contains: term } },
              { previousHandle: { contains: term } },
              { name: { contains: term, mode: 'insensitive' } },
            ],
          },
        },
      });

      authorClauses.push(
        { handle: { contains: term } },
        { previousHandle: { contains: term } },
      );
    });

    const [articleCandidates, authorCandidates] = await Promise.all([
      prisma.article.findMany({
        where: {
          OR: articleClauses,
        },
        take: Math.max(limit * 3, 12),
        orderBy: { createdAt: 'desc' },
        select: ARTICLE_SEARCH_SELECT,
      }),
      prisma.user.findMany({
        where: {
          OR: authorClauses,
        },
        take: Math.max(limit * 2, 10),
        orderBy: { createdAt: 'desc' },
        select: AUTHOR_SEARCH_SELECT,
      }),
    ]);

    const articles = articleCandidates
      .map((article) => ({
        ...article,
        likes: article._count.likes,
        comments: article._count.comments,
        score: scoreArticle(article, textTerms, handleTerms),
        _count: undefined,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, limit)
      .map(({ score, ...article }) => article);

    const authors = authorCandidates
      .map((author) => ({
        ...author,
        articles: author._count.articles,
        followers: author._count.followers,
        score: scoreAuthor(author, textTerms, handleTerms),
        _count: undefined,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.followers || 0) - (a.followers || 0);
      })
      .slice(0, limit)
      .map(({ score, previousHandle, ...author }) => author);

    res.json({
      query,
      articles,
      authors,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');
const {
  AUTH_USER_SELECT,
  PUBLIC_AUTHOR_SELECT,
  normalizeHandle,
  isValidHandle,
  isHandleReserved,
  findUserByHandle,
} = require('../lib/users');

const router = express.Router();
const prisma = new PrismaClient();

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, '笔名至少需要2个字符').max(50, '笔名不能超过50个字符').optional(),
  bio: z.string().max(280, '简介不能超过280个字符').optional(),
});

const updateHandleSchema = z.object({
  handle: z.string().trim().min(1, '请输入用户名'),
});

router.patch('/me/profile', authenticate, async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.parse(req.body);
    const data = {};

    if (parsed.name !== undefined) data.name = parsed.name;
    if (parsed.bio !== undefined) data.bio = parsed.bio.trim() || null;

    if (!Object.keys(data).length) {
      return res.status(400).json({ error: '没有可更新的内容' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: AUTH_USER_SELECT,
    });

    res.json({ user, message: '资料已更新' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '验证失败', details: error.errors });
    }
    next(error);
  }
});

router.patch('/me/handle', authenticate, async (req, res, next) => {
  try {
    const { handle: rawHandle } = updateHandleSchema.parse(req.body);
    const nextHandle = normalizeHandle(rawHandle);

    if (!isValidHandle(nextHandle)) {
      return res.status(400).json({ error: '用户名需为 3-24 位小写字母、数字、下划线或短横线' });
    }
    if (req.user.handleChangedAt) {
      return res.status(409).json({ error: '用户名只能修改一次' });
    }
    if (nextHandle === req.user.handle) {
      return res.json({ user: req.user, message: '用户名未变化' });
    }
    if (await isHandleReserved(prisma, nextHandle, req.user.id)) {
      return res.status(409).json({ error: '这个用户名已被占用或已被保留' });
    }

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        previousHandle: req.user.handle,
        handle: nextHandle,
        handleChangedAt: new Date(),
      },
      select: AUTH_USER_SELECT,
    });

    res.json({ user, message: '用户名已更新' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: '验证失败', details: error.errors });
    }
    next(error);
  }
});

router.get('/:handle', async (req, res, next) => {
  try {
    const requestedHandle = normalizeHandle(req.params.handle);
    if (!requestedHandle) {
      return res.status(404).json({ error: '作者不存在' });
    }

    const author = await findUserByHandle(prisma, requestedHandle, PUBLIC_AUTHOR_SELECT);
    if (!author) {
      return res.status(404).json({ error: '作者不存在' });
    }

    const [articles, viewsAggregate, likesCount, commentsCount, followersCount] = await Promise.all([
      prisma.article.findMany({
        where: { authorId: author.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
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
        },
      }),
      prisma.article.aggregate({
        where: { authorId: author.id },
        _sum: { views: true },
      }),
      prisma.like.count({
        where: {
          article: {
            authorId: author.id,
          },
        },
      }),
      prisma.comment.count({
        where: {
          article: {
            authorId: author.id,
          },
        },
      }),
      prisma.follow.count({
        where: { followingId: author.id },
      }),
    ]);

    res.json({
      canonicalHandle: author.handle,
      user: {
        ...author,
        articles: articles.length,
        views: viewsAggregate._sum.views ?? 0,
        likes: likesCount,
        comments: commentsCount,
        followers: followersCount,
      },
      articles: articles.map((article) => ({
        ...article,
        likes: article._count.likes,
        comments: article._count.comments,
        _count: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

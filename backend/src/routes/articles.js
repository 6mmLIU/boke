const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { normalizeHandle } = require('../lib/users');

const router = express.Router();
const prisma = new PrismaClient();

// 文章验证schema
const createArticleSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200字'),
  titleEn: z.string().max(200, '英文标题不能超过200字').optional(),
  excerpt: z.string().min(1, '摘要不能为空').max(500, '摘要不能超过500字'),
  content: z.string().min(1, '内容不能为空'),
  cover: z.enum(['warm', 'moss', 'indigo', 'cream'], '封面类型不正确'),
  tags: z.array(z.string().max(20)).max(10, '最多10个标签'),
  readTime: z.number().int().min(1, '阅读时间至少1分钟'),
});

const updateArticleSchema = createArticleSchema.partial();

// 获取文章列表
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'recent',
      tag,
      author,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // 构建查询条件
    const where = {};

    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    if (author) {
      const authorHandle = normalizeHandle(author);
      const authorUser = await prisma.user.findFirst({
        where: {
          OR: [
            { handle: authorHandle },
            { previousHandle: authorHandle },
          ],
        },
      });

      if (authorUser) {
        where.authorId = authorUser.id;
      } else {
        return res.json({
          articles: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            pages: 0,
          },
        });
      }
    }

    // 构建排序
    let orderBy = {};
    switch (sort) {
      case 'hot':
        orderBy = { views: 'desc' };
        break;
      case 'trending':
        orderBy = { likes: { _count: 'desc' } };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // 查询文章
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
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
      prisma.article.count({ where }),
    ]);

    // 检查用户是否点赞
    const articlesWithUserLikes = await Promise.all(
      articles.map(async (article) => {
        let userLiked = false;

        if (req.user) {
          const like = await prisma.like.findUnique({
            where: {
              authorId_articleId: {
                authorId: req.user.id,
                articleId: article.id,
              },
            },
          });
          userLiked = !!like;
        }

        return {
          ...article,
          likes: article._count.likes,
          comments: article._count.comments,
          userLiked,
          _count: undefined,
        };
      })
    );

    res.json({
      articles: articlesWithUserLikes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// 获取单篇文章
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            handle: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                articles: true,
                followers: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 增加阅读数
    await prisma.article.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // 检查用户是否点赞
    let userLiked = false;
    if (req.user) {
      const like = await prisma.like.findUnique({
        where: {
          authorId_articleId: {
            authorId: req.user.id,
            articleId: article.id,
          },
        },
      });
      userLiked = !!like;
    }

    // 检查是否关注作者
    let isFollowing = false;
    if (req.user) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.user.id,
            followingId: article.author.id,
          },
        },
      });
      isFollowing = !!follow;
    }

    res.json({
      ...article,
      views: article.views + 1, // 返回增加后的阅读数
      likes: article._count.likes,
      comments: article._count.comments,
      userLiked,
      isFollowing,
      author: {
        ...article.author,
        articles: article.author._count.articles,
        followers: article.author._count.followers,
        _count: undefined,
      },
      _count: undefined,
    });
  } catch (error) {
    next(error);
  }
});

// 创建文章
router.post('/', authenticate, async (req, res, next) => {
  try {
    const data = createArticleSchema.parse(req.body);

    const article = await prisma.article.create({
      data: {
        ...data,
        authorId: req.user.id,
      },
      include: {
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
    });

    res.status(201).json({
      ...article,
      likes: article._count.likes,
      comments: article._count.comments,
      _count: undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '验证失败',
        details: error.errors,
      });
    }
    next(error);
  }
});

// 更新文章
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = updateArticleSchema.parse(req.body);

    // 检查文章是否存在且属于当前用户
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (existingArticle.authorId !== req.user.id) {
      return res.status(403).json({ error: '无权修改此文章' });
    }

    const article = await prisma.article.update({
      where: { id },
      data,
      include: {
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
    });

    res.json({
      ...article,
      likes: article._count.likes,
      comments: article._count.comments,
      _count: undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: '验证失败',
        details: error.errors,
      });
    }
    next(error);
  }
});

// 删除文章
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查文章是否存在且属于当前用户
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    });

    if (!existingArticle) {
      return res.status(404).json({ error: '文章不存在' });
    }

    if (existingArticle.authorId !== req.user.id) {
      return res.status(403).json({ error: '无权删除此文章' });
    }

    await prisma.article.delete({
      where: { id },
    });

    res.json({ message: '文章已删除' });
  } catch (error) {
    next(error);
  }
});

// 点赞文章
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查文章是否存在
    const article = await prisma.article.findUnique({
      where: { id },
    });

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        authorId_articleId: {
          authorId: req.user.id,
          articleId: id,
        },
      },
    });

    if (existingLike) {
      return res.status(409).json({ error: '已经点赞过这篇文章' });
    }

    // 创建点赞
    await prisma.like.create({
      data: {
        authorId: req.user.id,
        articleId: id,
      },
    });

    res.json({ message: '点赞成功' });
  } catch (error) {
    next(error);
  }
});

// 取消点赞
router.delete('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 检查是否已经点赞
    const existingLike = await prisma.like.findUnique({
      where: {
        authorId_articleId: {
          authorId: req.user.id,
          articleId: id,
        },
      },
    });

    if (!existingLike) {
      return res.status(404).json({ error: '未点赞过这篇文章' });
    }

    // 删除点赞
    await prisma.like.delete({
      where: {
        authorId_articleId: {
          authorId: req.user.id,
          articleId: id,
        },
      },
    });

    res.json({ message: '取消点赞成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

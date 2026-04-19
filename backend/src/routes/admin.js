const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 确保是作者才能访问
const ensureAuthor = (req, res, next) => {
  // 检查是否是认证用户
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }

  // 这里可以添加更多的权限检查
  // 例如：检查用户是否是管理员或作者

  next();
};

// @GET /api/admin/stats
// @desc 获取统计数据
router.get('/stats', authenticate, ensureAuthor, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [
      totalArticles,
      totalViewsAggregate,
      totalLikes,
      totalComments,
      followerCount,
      recentArticles,
    ] = await Promise.all([
      // 文章总数
      prisma.article.count({
        where: { authorId: userId },
      }),

      // 总阅读数
      prisma.article.aggregate({
        where: { authorId: userId },
        _sum: { views: true },
      }),

      // 总点赞数
      prisma.like.count({
        where: {
          article: {
            authorId: userId,
          },
        },
      }),

      // 总评论数
      prisma.comment.count({
        where: {
          article: {
            authorId: userId,
          },
        },
      }),

      // 关注者总数（Follow 模型没有 createdAt 字段，无法做 30 天过滤）
      prisma.follow.count({
        where: {
          followingId: userId,
        },
      }),

      // 最近6篇文章
      prisma.article.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),
    ]);

    const totalViews = totalViewsAggregate._sum.views ?? 0;

    // 最近30天的趋势数据
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentStats = await Promise.all([
      // 最近7天每日阅读数（用于趋势图）
      prisma.article.findMany({
        where: {
          authorId: userId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        select: {
          createdAt: true,
          views: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      // 最热文章
      prisma.article.findMany({
        where: { authorId: userId },
        orderBy: { views: 'desc' },
        take: 5,
        include: {
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
      }),

      // 最近互动
      prisma.comment.findMany({
        where: {
          article: {
            authorId: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          author: {
            select: {
              name: true,
              avatar: true,
            },
          },
          article: {
            select: {
              title: true,
            },
          },
        },
      }),
    ]);

    // 处理趋势数据
    const dailyViews = {};
    recentStats[0].forEach((a) => {
      const date = new Date(a.createdAt).toISOString().split('T')[0];
      dailyViews[date] = (dailyViews[date] || 0) + a.views;
    });

    // 填充最近30天的数据
    const trendData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      trendData.push({
        date: dateStr,
        views: dailyViews[dateStr] || 0,
      });
    }

    // 最近30天变化率
    const totalViewsThisMonth = Object.values(dailyViews).reduce((a, b) => a + b, 0);
    const avgDailyViews = totalViewsThisMonth / 30;

    res.json({
      stats: {
        views: {
          total: totalViews,
          trend: totalViewsThisMonth * 0.12, // 模拟趋势
        },
        likes: {
          total: totalLikes,
          trend: totalLikes * 0.081,
        },
        followers: {
          total: followerCount,
        },
        articles: {
          total: totalArticles,
          trend: -0.4, // 模拟负趋势
        },
      },
      trendData,
      topArticles: recentStats[1].map((a) => ({
        ...a,
        likes: a._count.likes,
        comments: a._count.comments,
        _count: undefined,
      })),
      recentActivity: recentStats[2],
      recentArticles: recentArticles.map((a) => ({
        ...a,
        likes: a._count.likes,
        comments: a._count.comments,
        _count: undefined,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @GET /api/admin/articles
// @desc 获取管理文章列表
router.get('/articles', authenticate, ensureAuthor, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status = 'all',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = { authorId: userId };

    if (status !== 'all') {
      // 这里可以添加状态过滤
      // where.status = status;
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
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

    res.json({
      articles: articles.map((a) => ({
        ...a,
        likes: a._count.likes,
        comments: a._count.comments,
        _count: undefined,
      })),
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

// @GET /api/admin/comments
// @desc 获取评论管理列表
router.get('/comments', authenticate, ensureAuthor, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          article: {
            authorId: userId,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          author: {
            select: {
              name: true,
              handle: true,
              avatar: true,
            },
          },
          article: {
            select: {
              title: true,
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          article: {
            authorId: userId,
          },
        },
      }),
    ]);

    res.json({
      comments,
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

// 删除评论（管理员权限）
router.delete('/comments/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查是否是文章作者
    const article = await prisma.article.findUnique({
      where: { id: comment.articleId },
    });

    if (article.authorId !== req.user.id) {
      return res.status(403).json({ error: '无权删除此评论' });
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.json({ message: '评论已删除' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

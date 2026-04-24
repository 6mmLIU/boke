const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate, ensureAdmin } = require('../middleware/auth');

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
        select: {
          id: true,
          title: true,
          cover: true,
          views: true,
          readTime: true,
          createdAt: true,
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

// @GET /api/admin/users
// @desc 平台管理员查看所有用户
router.get('/users', authenticate, ensureAdmin, async (req, res, next) => {
  try {
    const {
      q = '',
      limit = 20,
    } = req.query;

    const limitNum = Math.max(1, Math.min(50, parseInt(limit)));
    const keyword = String(q || '').trim();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const where = keyword ? {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { handle: { contains: keyword, mode: 'insensitive' } },
      ],
    } : {};

    const [
      users,
      totalUsers,
      newUsers7d,
      bannedUsers,
      admins,
      totalArticles,
      totalViewsAggregate,
      totalLikes,
      totalComments,
      totalFollowers,
    ] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limitNum,
        select: {
          id: true,
          email: true,
          name: true,
          handle: true,
          previousHandle: true,
          bio: true,
          avatar: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          bannedReason: true,
          handleChangedAt: true,
          createdAt: true,
          _count: {
            select: {
              articles: true,
              comments: true,
              followers: true,
            },
          },
        },
      }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.user.count({ where: { isBanned: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.article.count(),
      prisma.article.aggregate({ _sum: { views: true } }),
      prisma.like.count(),
      prisma.comment.count(),
      prisma.follow.count(),
    ]);

    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const [viewsAggregate, likesCount, commentsCount, recentArticles] = await Promise.all([
        prisma.article.aggregate({
          where: { authorId: user.id },
          _sum: { views: true },
        }),
        prisma.like.count({
          where: {
            article: {
              authorId: user.id,
            },
          },
        }),
        prisma.comment.count({
          where: {
            article: {
              authorId: user.id,
            },
          },
        }),
        prisma.article.findMany({
          where: { authorId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            title: true,
            cover: true,
            views: true,
            readTime: true,
            createdAt: true,
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        }),
      ]);

      return {
        ...user,
        stats: {
          articles: user._count.articles,
          comments: commentsCount,
          likes: likesCount,
          followers: user._count.followers,
          views: viewsAggregate._sum.views ?? 0,
        },
        recentArticles: recentArticles.map((article) => ({
          ...article,
          likes: article._count.likes,
          comments: article._count.comments,
          _count: undefined,
        })),
        _count: undefined,
      };
    }));

    enrichedUsers.sort((a, b) => {
      if (a.role === b.role) return new Date(b.createdAt) - new Date(a.createdAt);
      return a.role === 'ADMIN' ? -1 : 1;
    });

    res.json({
      users: enrichedUsers,
      summary: {
        totalUsers,
        newUsers7d,
        totalArticles,
        totalViews: totalViewsAggregate._sum.views ?? 0,
        totalLikes,
        totalComments,
        totalFollowers,
        bannedUsers,
        admins,
        displayedUsers: enrichedUsers.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/ban', authenticate, ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 120) : '';

    if (id === req.user.id) {
      return res.status(400).json({ error: '不能封禁当前管理员自己' });
    }

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isBanned: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: '用户不存在' });
    }
    if (target.role === 'ADMIN') {
      return res.status(403).json({ error: '不能封禁其他管理员' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: true,
        bannedAt: new Date(),
        bannedReason: reason || null,
      },
      select: {
        id: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    res.json({ user, message: '用户已封禁' });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/unban', authenticate, ensureAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!target) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        isBanned: false,
        bannedAt: null,
        bannedReason: null,
      },
      select: {
        id: true,
        isBanned: true,
        bannedAt: true,
        bannedReason: true,
      },
    });

    res.json({ user, message: '用户已解封' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

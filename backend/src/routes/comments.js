const express = require('express');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 评论验证schema
const createCommentSchema = z.object({
  text: z.string().min(1, '评论不能为空').max(1000, '评论不能超过1000字'),
});

// @GET /api/comments/articles/:articleId
// @desc 获取文章评论
router.get('/articles/:articleId', async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // 检查文章是否存在
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 获取评论
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { articleId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              handle: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.comment.count({ where: { articleId } }),
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

// @POST /api/comments/articles/:articleId
// @desc 创建评论
router.post('/articles/:articleId', authenticate, async (req, res, next) => {
  try {
    const { articleId } = req.params;
    const { text } = createCommentSchema.parse(req.body);

    // 检查文章是否存在
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return res.status(404).json({ error: '文章不存在' });
    }

    // 创建评论
    const comment = await prisma.comment.create({
      data: {
        text,
        authorId: req.user.id,
        articleId,
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
      },
    });

    res.status(201).json({
      message: '评论发布成功',
      comment,
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

// @DELETE /api/comments/:id
// @desc 删除评论
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 检查是否有权限删除
    if (comment.authorId !== req.user.id) {
      // 检查是否是文章作者
      const article = await prisma.article.findUnique({
        where: { id: comment.articleId },
      });

      if (article.authorId !== req.user.id) {
        return res.status(403).json({ error: '无权删除此评论' });
      }
    }

    await prisma.comment.delete({
      where: { id },
    });

    res.json({ message: '评论已删除' });
  } catch (error) {
    next(error);
  }
});

// @POST /api/comments/:id/like
// @desc 点赞评论（预留接口，前端暂时不用）
router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;

    // 查找评论
    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({ error: '评论不存在' });
    }

    // 增加点赞数
    await prisma.comment.update({
      where: { id },
      data: {
        likes: { increment: 1 },
      },
    });

    res.json({ message: '点赞成功' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

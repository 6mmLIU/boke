const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { PrismaClient } = require('@prisma/client');
const { generateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// 注册验证schema
const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少需要8个字符'),
  name: z.string().min(2, '笔名至少需要2个字符').max(50, '笔名不能超过50个字符'),
});

// 登录验证schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(1, '密码不能为空'),
});

// @POST /api/auth/register
// @desc 用户注册
router.post('/register', async (req, res, next) => {
  try {
    // 验证输入
    const { email, password, name } = registerSchema.parse(req.body);

    // 检查用户是否已存在
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { handle: name }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(409).json({ error: '该邮箱已被注册' });
      }
      if (existingUser.handle === name) {
        return res.status(409).json({ error: '该笔名已被使用' });
      }
    }

    // 检查邮箱是否已被使用
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({ error: '邮箱已被注册' });
    }

    // 生成handle（用于URL的用户名）
    let handle = name.toLowerCase().replace(/\s+/g, '-');
    handle = handle.replace(/[^a-z0-9_-]/g, '');
    if (!handle) {
      // 名字里全是非 ASCII 字符（如纯中文），用随机后缀兜底
      handle = 'user-' + Math.random().toString(36).slice(2, 8);
    }

    // 确保handle唯一
    let uniqueHandle = handle;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { handle: uniqueHandle } })) {
      uniqueHandle = `${handle}-${counter}`;
      counter++;
    }

    // 哈希密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        handle: uniqueHandle,
      },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    // 生成token
    const token = generateToken(user.id);

    res.status(201).json({
      message: '注册成功',
      token,
      user,
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

// @POST /api/auth/login
// @desc 用户登录
router.post('/login', async (req, res, next) => {
  try {
    // 验证输入
    const { email, password } = loginSchema.parse(req.body);

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    // 生成token
    const token = generateToken(user.id);

    // 获取用户信息（不包含密码）
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    res.json({
      message: '登录成功',
      token,
      user: userInfo,
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

// @GET /api/auth/me
// @desc 获取当前登录用户信息
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请提供有效的token' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        handle: true,
        bio: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    res.json({ user });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'token无效' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token已过期' });
    }
    next(error);
  }
});

module.exports = router;

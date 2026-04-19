const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const {
  AUTH_USER_SELECT,
  ensureAdminBootstrap,
} = require('../lib/users');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// 生成token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1d' });
};

const rejectBannedUser = (res, user) => res.status(403).json({
  error: user.bannedReason ? `账户已被封禁：${user.bannedReason}` : '账户已被封禁',
  code: 'ACCOUNT_BANNED',
});

const loadUserFromToken = async (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  await ensureAdminBootstrap(prisma, decoded.userId);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: AUTH_USER_SELECT,
  });

  return user;
};

// 验证token中间件
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未授权，请提供有效的token' });
    }

    const token = authHeader.substring(7);
    const user = await loadUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    if (user.isBanned) {
      return rejectBannedUser(res, user);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'token无效' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'token已过期' });
    }
    next(error);
  }
};

// 可选认证中间件（用于获取用户信息但不是必需的）
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const user = await loadUserFromToken(token);

    if (user && !user.isBanned) req.user = user;
  } catch (error) {
    // 忽略错误，继续处理
  }
  next();
};

const ensureAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: '请先登录' });
  }
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

module.exports = {
  generateToken,
  authenticate,
  optionalAuth,
  ensureAdmin,
  rejectBannedUser,
  loadUserFromToken,
  JWT_SECRET,
};

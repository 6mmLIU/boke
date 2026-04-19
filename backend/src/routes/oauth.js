// OAuth 第三方登录 — 当前实现 GitHub
// 流程:
//   1. 前端按钮跳转到 GET /api/auth/oauth/github  → 重定向到 GitHub 授权页
//   2. 用户在 GitHub 授权后回调到 GET /api/auth/oauth/github/callback?code=...
//   3. 后端用 code 换 access_token,再用 token 拿用户信息
//   4. 创建/复用 OAuthAccount,签发 JWT,带着 token 跳回前端 /?oauth=success#token=xxx
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../middleware/auth');
const {
  AUTH_USER_SELECT,
  buildUniqueHandle,
  ensureAdminBootstrap,
} = require('../lib/users');

const router = express.Router();
const prisma = new PrismaClient();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || 'http://localhost:3001';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK = `${BACKEND_PUBLIC_URL}/api/auth/oauth/github/callback`;

// 用一个简单内存对象做 state 防 CSRF (单实例够用)
const pendingStates = new Map();
const STATE_TTL_MS = 10 * 60 * 1000;
const cleanState = () => {
  const now = Date.now();
  for (const [k, v] of pendingStates) if (v < now) pendingStates.delete(k);
};

const redirectToFrontend = (res, params) => {
  const qs = new URLSearchParams(params).toString();
  res.redirect(`${FRONTEND_URL}/?${qs}`);
};

// @GET /api/auth/oauth/github
// 跳转到 GitHub 授权页
router.get('/github', (req, res) => {
  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
    return res.status(503).json({ error: 'GitHub OAuth 未配置 (缺少 GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET)' });
  }
  cleanState();
  const state = require('crypto').randomBytes(16).toString('hex');
  pendingStates.set(state, Date.now() + STATE_TTL_MS);

  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', GITHUB_CALLBACK);
  authUrl.searchParams.set('scope', 'read:user user:email');
  authUrl.searchParams.set('state', state);
  res.redirect(authUrl.toString());
});

// @GET /api/auth/oauth/github/callback
// GitHub 授权后回调
router.get('/github/callback', async (req, res, next) => {
  try {
    const { code, state, error: ghError } = req.query;
    if (ghError) {
      return redirectToFrontend(res, { oauth: 'error', message: String(ghError) });
    }
    if (!code) {
      return redirectToFrontend(res, { oauth: 'error', message: '缺少授权码' });
    }
    if (!state || !pendingStates.has(state)) {
      return redirectToFrontend(res, { oauth: 'error', message: 'state 无效或已过期' });
    }
    pendingStates.delete(state);

    // 1. 用 code 换 access_token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return redirectToFrontend(res, { oauth: 'error', message: tokenData.error_description || '换取 token 失败' });
    }

    // 2. 拿用户信息
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Inkwell-OAuth',
      },
    });
    const ghUser = await userRes.json();
    if (!ghUser.id) {
      return redirectToFrontend(res, { oauth: 'error', message: '获取 GitHub 用户信息失败' });
    }

    // 3. 拿邮箱 (GitHub user 接口可能不返回邮箱,需要单独查 /user/emails)
    let primaryEmail = ghUser.email;
    if (!primaryEmail) {
      const emailsRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'Inkwell-OAuth',
        },
      });
      const emails = await emailsRes.json();
      if (Array.isArray(emails)) {
        const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified);
        if (primary) primaryEmail = primary.email;
      }
    }

    const provider = 'github';
    const providerAccountId = String(ghUser.id);

    // 4. 找已存在的 OAuth 绑定
    let oauth = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider, providerAccountId } },
      include: { user: true },
    });

    let userId;
    if (oauth) {
      userId = oauth.userId;
      // 更新缓存的展示信息
      await prisma.oAuthAccount.update({
        where: { id: oauth.id },
        data: { email: primaryEmail || oauth.email, name: ghUser.name || ghUser.login, avatar: ghUser.avatar_url },
      });
    } else {
      // 还没绑定 → 看看是不是已有同邮箱用户
      let user = primaryEmail
        ? await prisma.user.findUnique({ where: { email: primaryEmail } })
        : null;

      if (!user) {
        // 新建用户 (无密码)
        const uniqueHandle = await buildUniqueHandle(prisma, ghUser.login || ghUser.name || 'user');
        const existingUserCount = await prisma.user.count();
        user = await prisma.user.create({
          data: {
            email: primaryEmail || `gh-${ghUser.id}@noemail.local`,
            name: ghUser.name || ghUser.login,
            handle: uniqueHandle,
            avatar: ghUser.avatar_url,
            password: null,
            role: existingUserCount === 0 ? 'ADMIN' : 'USER',
          },
          select: AUTH_USER_SELECT,
        });
      }
      if (user.isBanned) {
        return redirectToFrontend(res, { oauth: 'error', message: '账户已被封禁，请联系管理员' });
      }

      await prisma.oAuthAccount.create({
        data: {
          provider,
          providerAccountId,
          userId: user.id,
          email: primaryEmail,
          name: ghUser.name || ghUser.login,
          avatar: ghUser.avatar_url,
        },
      });
      userId = user.id;
    }

    if (oauth && oauth.user && oauth.user.isBanned) {
      return redirectToFrontend(res, { oauth: 'error', message: '账户已被封禁，请联系管理员' });
    }

    await ensureAdminBootstrap(prisma, userId);

    // 5. 签发 JWT 并带回前端 (放在 hash 里,避免落进服务器日志)
    const jwtToken = generateToken(userId);
    res.redirect(`${FRONTEND_URL}/?oauth=success#token=${encodeURIComponent(jwtToken)}`);
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    redirectToFrontend(res, { oauth: 'error', message: '登录失败,请重试' });
  }
});

module.exports = router;

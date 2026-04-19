// 砚 Inkwell — 浏览器端 API 客户端
// 通过 <script> 直接加载，挂到 window.API / window.Auth 上。
(function (global) {
  const API_BASE =
    global.__INKWELL_API__ ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:3001'
      : location.origin);

  let authToken = null;
  let currentUser = null;
  const listeners = new Set();

  try {
    authToken = localStorage.getItem('inkwell.token') || null;
    const cached = localStorage.getItem('inkwell.user');
    if (cached) currentUser = JSON.parse(cached);
  } catch {}

  const setAuth = (token, user) => {
    authToken = token || null;
    currentUser = user || null;
    try {
      if (token) localStorage.setItem('inkwell.token', token); else localStorage.removeItem('inkwell.token');
      if (user) localStorage.setItem('inkwell.user', JSON.stringify(user)); else localStorage.removeItem('inkwell.user');
    } catch {}
    listeners.forEach((fn) => { try { fn(currentUser); } catch {} });
  };

  async function request(path, { method = 'GET', body, query } = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) headers.Authorization = `Bearer ${authToken}`;

    let url = API_BASE + path;
    if (query && Object.keys(query).length) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') qs.append(k, v);
      }
      const s = qs.toString();
      if (s) url += '?' + s;
    }

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error('网络异常，请检查后端是否在运行');
    }

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = { raw: text }; }
    }

    if (!res.ok) {
      const msg = (data && (data.error || data.message)) || `请求失败（${res.status}）`;
      const err = new Error(msg);
      err.status = res.status;
      err.details = data && data.details;
      // 401 自动登出
      if (res.status === 401 && authToken) setAuth(null, null);
      throw err;
    }
    return data;
  }

  // ────── 认证 ──────
  const Auth = {
    get user() { return currentUser; },
    get token() { return authToken; },
    isLoggedIn: () => !!authToken,
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async register({ email, password, name }) {
      const data = await request('/api/auth/register', {
        method: 'POST', body: { email, password, name },
      });
      setAuth(data.token, data.user);
      return data.user;
    },

    async login({ email, password }) {
      const data = await request('/api/auth/login', {
        method: 'POST', body: { email, password },
      });
      setAuth(data.token, data.user);
      return data.user;
    },

    async refresh() {
      if (!authToken) return null;
      try {
        const data = await request('/api/auth/me');
        setAuth(authToken, data.user);
        return data.user;
      } catch {
        return null;
      }
    },

    logout() { setAuth(null, null); },
  };

  // ────── 文章 ──────
  const Articles = {
    list: (params = {}) => request('/api/articles', { query: params }),
    get: (id) => request(`/api/articles/${id}`),
    create: (article) => request('/api/articles', { method: 'POST', body: article }),
    update: (id, article) => request(`/api/articles/${id}`, { method: 'PUT', body: article }),
    delete: (id) => request(`/api/articles/${id}`, { method: 'DELETE' }),
    like: (id) => request(`/api/articles/${id}/like`, { method: 'POST' }),
    unlike: (id) => request(`/api/articles/${id}/like`, { method: 'DELETE' }),
  };

  // ────── 评论 ──────
  const Comments = {
    list: (articleId, params = {}) =>
      request(`/api/comments/articles/${articleId}`, { query: params }),
    create: (articleId, text) =>
      request(`/api/comments/articles/${articleId}`, { method: 'POST', body: { text } }),
    delete: (id) => request(`/api/comments/${id}`, { method: 'DELETE' }),
  };

  // ────── 后台 ──────
  const Admin = {
    stats: () => request('/api/admin/stats'),
    articles: (params = {}) => request('/api/admin/articles', { query: params }),
    comments: (params = {}) => request('/api/admin/comments', { query: params }),
    deleteComment: (id) => request(`/api/admin/comments/${id}`, { method: 'DELETE' }),
  };

  global.API = { request, Articles, Comments, Admin, base: API_BASE };
  global.Auth = Auth;
})(window);

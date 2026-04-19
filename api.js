// API工具函数 - 连接前端与后端

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 存储JWT token
let authToken = localStorage.getItem('authToken');

// 设置token
export const setAuthToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// 获取token
export const getAuthToken = () => authToken;

// API请求封装
export const api = {
  // 发起请求
  async request(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 如果有token，添加到header
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '请求失败');
    }

    return data;
  },

  // GET请求
  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl);
  },

  // POST请求
  post(url, body) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // PUT请求
  put(url, body) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  // DELETE请求
  delete(url) {
    return this.request(url, {
      method: 'DELETE',
    });
  },
};

// 认证相关
export const authAPI = {
  // 注册
  async register({ email, password, name }) {
    const data = await api.post('/api/auth/register', {
      email,
      password,
      name,
    });
    setAuthToken(data.token);
    return data;
  },

  // 登录
  async login({ email, password }) {
    const data = await api.post('/api/auth/login', {
      email,
      password,
    });
    setAuthToken(data.token);
    return data;
  },

  // 获取当前用户信息
  async getCurrentUser() {
    const data = await api.get('/api/auth/me');
    return data.user;
  },

  // 登出
  logout() {
    setAuthToken(null);
  },
};

// 文章相关
export const articleAPI = {
  // 获取文章列表
  async getArticles({ page = 1, limit = 10, sort = 'recent', tag, author } = {}) {
    return api.get('/api/articles', {
      page,
      limit,
      sort,
      tag,
      author,
    });
  },

  // 获取单篇文章
  async getArticle(id) {
    return api.get(`/api/articles/${id}`);
  },

  // 创建文章
  async createArticle(article) {
    return api.post('/api/articles', article);
  },

  // 更新文章
  async updateArticle(id, article) {
    return api.put(`/api/articles/${id}`, article);
  },

  // 删除文章
  async deleteArticle(id) {
    return api.delete(`/api/articles/${id}`);
  },

  // 点赞文章
  async likeArticle(id) {
    return api.post(`/api/articles/${id}/like`);
  },

  // 取消点赞
  async unlikeArticle(id) {
    return api.delete(`/api/articles/${id}/like`);
  },
};

// 评论相关
export const commentAPI = {
  // 获取文章评论
  async getComments(articleId, { page = 1, limit = 20 } = {}) {
    return api.get(`/api/comments/articles/${articleId}`, {
      page,
      limit,
    });
  },

  // 创建评论
  async createComment(articleId, text) {
    return api.post(`/api/comments/articles/${articleId}`, { text });
  },

  // 删除评论
  async deleteComment(id) {
    return api.delete(`/api/comments/${id}`);
  },
};

// 后台管理相关
export const adminAPI = {
  // 获取统计数据
  async getStats() {
    return api.get('/api/admin/stats');
  },

  // 获取文章管理列表
  async getAdminArticles({ page = 1, limit = 20 } = {}) {
    return api.get('/api/admin/articles', {
      page,
      limit,
    });
  },

  // 获取评论管理列表
  async getAdminComments({ page = 1, limit = 20 } = {}) {
    return api.get('/api/admin/comments', {
      page,
      limit,
    });
  },
};

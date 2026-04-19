# Inkwell 后端 API

砚 - Inkwell 博客系统的后端服务，基于 Node.js + Express + PostgreSQL + Prisma。

## 技术栈

- **Node.js** - JavaScript 运行时
- **Express** - Web 框架
- **PostgreSQL** - 关系型数据库
- **Prisma** - ORM 工具
- **JWT** - 用户认证
- **Railway** - 部署平台

## API 文档

### 认证相关

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "12345678",
  "name": "笔名"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "12345678"
}
```

#### 获取当前用户信息
```http
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### 文章相关

#### 获取文章列表
```http
GET /api/articles?page=1&limit=10&sort=recent
```

排序选项：
- `recent` - 最新发布
- `hot` - 最多阅读
- `trending` - 最多点赞

#### 获取单篇文章
```http
GET /api/articles/:id
```

#### 创建文章（需登录）
```http
POST /api/articles
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "文章标题",
  "titleEn": "English Title",
  "excerpt": "文章摘要",
  "content": "文章内容（Markdown/HTML）",
  "cover": "warm",
  "tags": ["写作", "生活"],
  "readTime": 5
}
```

封面类型：`warm`, `moss`, `indigo`, `cream`

#### 更新文章（需登录，且是作者）
```http
PUT /api/articles/:id
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "新标题",
  "content": "新内容"
}
```

#### 删除文章（需登录，且是作者）
```http
DELETE /api/articles/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 点赞文章（需登录）
```http
POST /api/articles/:id/like
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 取消点赞（需登录）
```http
DELETE /api/articles/:id/like
Authorization: Bearer YOUR_JWT_TOKEN
```

### 评论相关

#### 获取文章评论
```http
GET /api/comments/articles/:articleId?page=1&limit=20
```

#### 创建评论（需登录）
```http
POST /api/comments/articles/:articleId
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "text": "评论内容"
}
```

#### 删除评论（需登录，且是作者或文章作者）
```http
DELETE /api/comments/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

### 后台管理（需登录）

#### 获取统计数据
```http
GET /api/admin/stats
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 获取文章管理列表
```http
GET /api/admin/articles?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 获取评论管理列表
```http
GET /api/admin/comments?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 删除评论（管理员权限）
```http
DELETE /api/admin/comments/:id
Authorization: Bearer YOUR_JWT_TOKEN
```

## 开发环境搭建

### 前置要求

- Node.js 18+
- PostgreSQL 14+

### 安装步骤

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，填写数据库连接信息
```env
DATABASE_URL="postgresql://username:password@localhost:5432/inkwell?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

4. 创建数据库并运行迁移
```bash
# 方式1：使用 Prisma Migrate（推荐）
npx prisma migrate dev --name init

# 方式2：直接推送Schema
npx prisma db push
```

5. 启动开发服务器
```bash
npm run dev
```

服务器将在 `http://localhost:3001` 运行

## 数据库管理

### 打开 Prisma Studio（可视化数据库管理）
```bash
npm run prisma:studio
```

### 生成 Prisma Client
```bash
npm run prisma:generate
```

## 部署

### 部署到 Railway

1. 安装 Railway CLI
```bash
npm i -g railway
```

2. 登录 Railway
```bash
railway login
```

3. 初始化项目
```bash
railway init
```

4. 添加 PostgreSQL 数据库
```bash
railway add
# 选择 PostgreSQL
```

5. 部署
```bash
railway up
```

Railway 会自动设置 `DATABASE_URL` 环境变量

### 环境变量配置

部署前请确保设置以下环境变量：

- `DATABASE_URL` - PostgreSQL 连接字符串
- `JWT_SECRET` - JWT 密钥（至少32位随机字符串）
- `FRONTEND_URL` - 前端地址（如 https://your-frontend.vercel.app）
- `NODE_ENV` - production

## 前端配置

在 `.env` 文件中配置后端 API 地址：
```env
REACT_APP_API_URL=https://your-backend.railway.app
```

## 错误处理

API 返回的错误格式：
```json
{
  "error": "错误信息",
  "details": [ // 可选
    { "field": "email", "message": "邮箱格式不正确" }
  ]
}
```

常见 HTTP 状态码：
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权
- `403` - 禁止访问
- `404` - 资源不存在
- `409` - 资源冲突
- `500` - 服务器错误

## 数据模型

### User (用户)
- `id` - UUID
- `email` - 邮箱
- `name` - 笔名
- `handle` - @用户名
- `password` - 哈希密码
- `bio` - 个人简介
- `avatar` - 头像URL

### Article (文章)
- `id` - UUID
- `title` - 标题
- `titleEn` - 英文标题
- `excerpt` - 摘要
- `content` - 内容
- `cover` - 封面类型
- `tags` - 标签数组
- `views` - 阅读数
- `readTime` - 阅读时间

### Comment (评论)
- `id` - UUID
- `text` - 评论内容
- `likes` - 点赞数

### Like (点赞)
- 复合索引确保每个用户只能点赞一次

### Follow (关注)
- 粉丝关系

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

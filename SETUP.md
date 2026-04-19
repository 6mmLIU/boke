# 快速启用指南 🚀

这个项目提供了完整的博客系统，包括前端和后端。按照以下步骤即可快速启用：

## 📋 准备工作

### 选项A：本地测试（推荐第一次使用）

1. **安装 Node.js**
   - 访问 https://nodejs.org/ 下载 LTS 版本
   - 安装后验证：`node --version` 应该显示 v18+

2. **安装 PostgreSQL**
   - Windows：下载 https://www.postgresql.org/download/
   - Mac：`brew install postgresql`
   - 启动服务，创建数据库

3. **安装 Git**
   - 访问 https://git-scm.com/downloads

### 选项B：直接部署（推荐最终部署）

1. **注册 Railway** (https://railway.app)
2. **注册 Vercel** (https://vercel.com)

---

## 🏃 零配置启动（本地）

### 1. 配置后端

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env
```

编辑 `.env` 文件，填写数据库信息：
```env
DATABASE_URL="postgresql://username:password@localhost:5432/inkwell?schema=public"
JWT_SECRET="用随机字符串生成器生成一个32位的密钥"
FRONTEND_URL="http://localhost:3000"
```

创建数据库并初始化：
```bash
# 方式1：使用 Prisma Migrate（推荐）
npx prisma migrate dev --name init

# 方式2：直接推送schema
npx prisma db push
```

启动后端服务器：
```bash
npm run dev
```

后端将在 http://localhost:3001 运行 ✅

### 2. 配置前端

前端是纯静态文件，已经配置好了！直接使用浏览器打开 `index.html` 即可。

### 3. 创建测试数据

用 Prisma Studio 创建一些测试数据：
```bash
npx prisma studio
```

---

## 🚀 部署到 Railway（后端+数据库）

### 方式1：使用 Railway CLI（推荐）

```bash
# 安装 Railway CLI
npm i -g railway

# 登录
railway login

# 初始化项目
cd backend
railway init
# 按照提示操作

# 添加 PostgreSQL
railway add
# 选择 PostgreSQL

# 部署
railway up
```

### 方式2：使用 GitHub 集成

1. 将代码推送到 GitHub
2. 在 Railway 导入 GitHub 仓库
3. 添加 PostgreSQL 数据库
4. 配置环境变量
5. 部署

---

## 🎨 部署到 Vercel（前端）

1. 在 Vercel 导入 GitHub 仓库
2. 框架预设：选择 "Other"
3. 构建命令：留空（或 `echo "No build needed"`）
4. 输出目录：`./`
5. 部署！

前端将在 Vercel 提供的 URL 上访问 ✅

---

## 🔧 配置 API 地址

如果前后端域名不一样，需要配置跨域。

后端 `.env`：
```env
FRONTEND_URL="https://你的前端网址.vercel.app"
```

前端（如需要），在 index.html 添加：
```javascript
<script>
  // 如果后端部署到 Railway，这里填写 Railway 提供的 URL
  window.API_BASE = "https://你的后端网址.railway.app";
</script>
```

---

## 🎯 使用流程

1. **注册账号**
   - 打开前端页面
   - 点击注册
   - 填写邮箱、密码、笔名

2. **创建文章**
   - 登录后进入写作页面
   - 填写标题、摘要、内容
   - 选择封面类型和标签
   - 发布文章

3. **阅读文章**
   - 首页浏览文章列表
   - 点击文章查看详情
   - 滚动阅读时显示进度条
   - 可以点赞、评论、收藏

4. **管理后台**
   - 查看统计数据
   - 管理文章（编辑、删除）
   - 管理评论（删除）

---

## 📱 功能演示

### 访客功能
- 浏览文章
- 按热度/时间排序
- 查看排行榜
- 阅读文章详情

### 用户功能
- 注册登录
- 关注作者
- 点赞/评论
- 个人书房展示
- 自定义主题

### 作者功能
- 创建文章
- 编辑文章
- 删除文章
- 查看统计
- 后台管理

---

## ⚠️ 重要提醒

### 安全设置

1. **JWT 密钥**：生产环境务必设置强密钥
```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **数据库密码**：使用强密码

3. **HTTPS**：生产环境务必使用 HTTPS

### 数据备份

如果使用 Railway 的 PostgreSQL，会自动备份，但仍建议定期手动备份：

```bash
# 导出数据
pg_dump DATABASE_URL > backup.sql

# 导入数据
psql DATABASE_URL < backup.sql
```

---

## 🆘 常见问题

### 1. 数据库连接失败
- 检查 PostgreSQL 是否运行
- 检查连接字符串是否正确
- 检查用户名密码

### 2. 前端无法调用 API
- 检查后端是否运行
- 检查 CORS 配置
- 检查 API_BASE 地址

### 3. 登录后提示未授权
- 检查 JWT 密钥是否正确
- 检查 token 是否过期（默认1天）

### 4. 部署后无法访问
- Railway：检查环境变量
- Vercel：检查自定义域名配置

---

## 📈 扩展建议

### 添加功能
- 图片上传（集成 Cloudinary 或 AWS S3）
- 邮件通知（集成 Resend 或 SendGrid）
- 全文搜索（集成 MeiliSearch）
- 分享功能（微信、微博）

### 性能优化
- 添加 CDN
- 图片懒加载
- 启用 Gzip 压缩
- 数据库查询优化

### SEO 优化
- 添加 Meta 标签
- 生成 Sitemap
- Google Analytics

---

## 🎉 大功告成！

你现在拥有了一个完整的博客系统！

- ✅ 前后端分离
- ✅ 用户认证系统
- ✅ 文章管理
- ✅ 评论系统
- ✅ 后台管理
- ✅ 响应式设计
- ✅ 主题切换

欢迎分享你的创作！ ✨


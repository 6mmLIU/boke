# 砚 - Inkwell | 博客系统

一个优雅、简洁的博客系统，前后端分离架构，基于 Node.js + React + PostgreSQL。

<div align="center">

  砚

  给想法一方砚台。
  <br>
  A quiet place for slow writing.
</div>

---

## ✨ 特性

### 📝 写作体验
- **Markdown 编辑器** - 专注于写作
- **阅读时长统计** - 自动估算阅读时间
- **标签系统** - 为文章添加标签
- **封面选择** - 4种精美的封面配色

### 👥 社交功能
- **点赞系统** - 为喜欢的文章点赞
- **评论系统** - 与读者互动讨论
- **关注系统** - 关注喜欢的作者
- **个人书房** - 展示个人作品

### 🎨 视觉设计
- **响应式设计** - 完美适配移动端
- **主题切换** - 白昼/夜读模式
- **字体切换** - 衬线/无衬线字体
- **自定义主题** - 赤陶/墨绿/藏青三色主题
- **纸质纹理** - 模拟真实纸张质感

### 🔧 技术栈

**前端**
- React 18 - 组件化开发
- HTML/CSS/JS - 原生实现，无额外依赖
- Google Fonts - 精美字体

**后端**
- Node.js - JavaScript 运行时
- Express - Web 框架
- JWT - 用户认证
- PostgreSQL - 关系型数据库
- Prisma - 现代化ORM

**部署**
- Railway - 后端 + 数据库托管
- Vercel - 前端静态托管

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+（或使用 Railway 免费数据库）
- Git

### 安装步骤

1. **克隆项目**（推送到GitHub后提供链接）
```bash
git clone https://github.com/yourusername/boke.git
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env，填写数据库连接信息
```

4. **创建数据库并运行迁移**
```bash
# 方式1：使用 Prisma Migrate（推荐）
npx prisma migrate dev --name init

# 方式2：直接推送Schema
npx prisma db push
```

5. **启动后端服务器**
```bash
npm run dev
```

后端将在 `http://localhost:3001` 运行

6. **运行前端**

直接用浏览器打开 `index.html` 即可！

---

## 🗄️ 数据库模型

```
User (用户)
├── id
├── email
├── name (笔名)
├── handle (@用户名)
├── password (哈希)
├── bio
└── avatar

Article (文章)
├── id
├── title
├── titleEn (英文标题)
├── excerpt (摘要)
├── content (正文)
├── cover (封面类型)
├── tags[] (标签数组)
├── authorId
├── views (阅读数)
└── readTime (阅读时间)

Comment (评论)
├── id
├── text
├── authorId
├── articleId
└── likes

Like (点赞)
├── authorId
└── articleId

Follow (关注)
├── followerId (粉丝)
└── followingId (关注对象)
```

---

## 📡 API 接口列表

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 文章接口
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取单篇文章
- `POST /api/articles` - 创建文章（需登录）
- `PUT /api/articles/:id` - 更新文章（需登录）
- `DELETE /api/articles/:id` - 删除文章（需登录）
- `POST /api/articles/:id/like` - 点赞文章（需登录）
- `DELETE /api/articles/:id/like` - 取消点赞（需登录）

### 评论接口
- `GET /api/comments/articles/:articleId` - 获取文章评论
- `POST /api/comments/articles/:articleId` - 创建评论（需登录）
- `DELETE /api/comments/:id` - 删除评论（需登录）

### 后台管理接口
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/articles` - 获取文章管理列表
- `GET /api/admin/comments` - 获取评论管理列表
- `DELETE /api/admin/comments/:id` - 删除评论（管理员）

---

## 🎯 使用场景

### 个人博客
搭建属于自己的博客空间，记录生活、分享想法。

### 写作平台
创建一个慢写作社区，吸引志同道合的作者和读者。

### 技术分享
分享技术文章，建立个人品牌。

### 团队协作
团队成员协作写作，共同成长。

---

## 🎨 自定义配置

### 主题切换
支持的配色主题：
- **赤陶** (`#C5704A`) - 默认主题
- **墨绿** (`#6F8560`) - 护眼绿色
- **藏青** (`#4A6A8A`) - 深蓝主题

### 密度切换
- **疏朗** - 宽松布局，舒适阅读
- **紧凑** - 紧凑布局，信息密集

### 字体切换
- **衬线** - Fraunces 衬线字体，正式优雅
- **无衬线** - Inter 无衬线字体，现代简洁

### 纹理切换
- **纯色** - 纯色背景
- **纸质** - 纸张纹理，真实质感

---

## 📦 项目结构

```
├── backend/              # 后端代码
│   ├── src/
│   │   ├── controllers/  # 控制器
│   │   ├── routes/       # 路由
│   │   ├── middleware/   # 中间件
│   │   └── app.js        # 应用入口
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   ├── package.json
│   └── README.md
├── components/           # 前端组件
│   ├── page-auth.jsx     # 登录/注册页
│   ├── page-home.jsx     # 首页
│   ├── page-article.jsx  # 文章详情页
│   ├── page-profile.jsx  # 个人主页
│   ├── page-admin-*.jsx  # 后台管理页
│   └── shared.jsx        # 共享组件
├── styles/
│   └── tokens.css        # CSS变量
├── index.html            # 主页
├── canvas.html           # 画布页
├── api.js                # 前端API工具
├── design-canvas.jsx     # 设计画布
└── README.md
```

---

## 🚀 部署指南

### Railway 部署（后端 + 数据库）

1. 注册 Railway（`railway.app`）
2. 连接 GitHub 仓库
3. 创建 PostgreSQL 数据库
4. 设置环境变量（`DATABASE_URL` 自动生成）
5. 部署！

### Vercel 部署（前端）

1. 注册 Vercel（`vercel.com`）
2. 导入 GitHub 仓库
3. 设置框架预设为 `Static`
4. 设置构建命令为 `echo "No build needed"`
5. 设置输出目录为 `./`
6. 部署！

---

## 🔒 安全建议

### 生产环境注意事项

1. **JWT 密钥**：务必设置为强随机字符串
```bash
# 生成32位随机字符串
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **HTTPS**：生产环境务必使用 HTTPS

3. **限流**：已配置 API 限流
- 普通接口：15分钟100次
- 登录接口：15分钟5次

4. **密码安全**：使用强密码策略
- 至少8位字符
- 包含大小写字母和数字

5. **SQL注入防护**：使用 Prisma ORM，天然免疫 SQL 注入

6. **XSS防护**：前端不渲染原始 HTML，可防范 XSS

---

## 🐛 调试

### 后端调试
```bash
# 查看日志
npm run dev

# 打开 Prisma Studio 查看数据库
npx prisma studio
```

### 前端调试
- 打开浏览器开发者工具
- 查看 Network 标签，检查 API 请求
- 查看 Console 标签，检查 JavaScript 错误

---

## 📈 性能优化

### 数据库优化
- 添加必要索引
- 使用查询缓存
- 优化复杂查询

### 前端优化
- 图片懒加载
- 代码分割
- 静态资源 CDN

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 仓库
2. 创建特性分支
3. 提交更改
4. 推送到 GitHub
5. 创建 Pull Request

---

## 📄 许可证

MIT License

---

## 🙏 致谢

- 设计灵感来自 Medium、Notion 等优秀写作平台
- 感谢 Node.js 社区提供优秀的开源工具
- 感谢所有贡献者

---

## 📞 联系方式

如有问题或建议，欢迎提交 Issue！

---

<div align="center">
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  慢下来，<br>
  想得更远。
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
</div>

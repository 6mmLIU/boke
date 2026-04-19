# GitHub 推送指南

因为 GitHub CLI 未安装，请手动创建仓库并推送代码。

## 方法1：使用批处理脚本（推荐 - Windows）

1. 双击运行 `PUSH_NOW.bat`
2. 按照提示操作：
   - 手动在 GitHub 创建仓库
   - 输入仓库的 HTTPS 地址
   - 会自动完成推送

## 方法2：手动操作

### 步骤1：在 GitHub 创建仓库

1. 打开浏览器：https://github.com/new
2. 填写信息：
   - Repository name: `BOKE`
   - Description: `砚 - Inkwell 博客系统`
   - 选择 **Public**（公开）或 **Private**（私有）
   - **不要勾选** "Initialize this repository with a README"
3. 点击 "Create repository"

### 步骤2：获取仓库地址

创建成功后，会看到类似这样的页面：

```
... or create a new repository on the command line
git remote add origin https://github.com/你的用户名/BOKE.git
git branch -M main
git push -u origin main
```

**复制** `https://github.com/你的用户名/BOKE.git` 这行。

### 步骤3：执行 Git 命令

在 Git Bash 或命令行中执行：

```bash
cd "E:\Desktop\boke"

# 如果不是 Windows，可能需要
# cd /mnt/e/Desktop/boke

# 添加远程仓库（将 YOUR_URL 替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/BOKE.git

# 推送代码
git branch -M main
git push -u origin main
```

### 步骤4：输入凭据

推送时会提示输入：
- Username: 输入 GitHub 用户名
- Password: 输入 Personal Access Token（不是密码！）

#### 如何创建 Personal Access Token

1. 登录 GitHub
2. 点击头像 -> Settings
3. 左侧 -> Developer settings
4. 点击 - Personal access tokens -> Tokens (classic)
5. 点击 - Generate new token (classic)
6. 设置：
   - Note: "BOKE Blog"
   - Expiration: 建议选择 No expiration 或 30 days
   - Select scopes: 勾选 **repo**（全部）
7. 点击 Generate token
8. **复制生成的 token**（只显示一次，不要关闭页面！）

### 步骤5：验证推送成功

访问 `https://github.com/你的用户名/BOKE` 查看代码是否上传。

---

## 推送后的操作

推送成功后，你可以在 GitHub 仓库页面上：

### 设置项目信息
1. 点击 "Settings"
2. 设置 Social preview（可选）
3. 配置 GitHub Pages（前端静态部署）

### 部署到 Railway

1. 登录 Railway (https://railway.app)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择 BOKE 仓库
5. 添加 PostgreSQL 数据库
6. 设置环境变量（Variables）
   ```
   DATABASE_URL = [自动生成的]
   JWT_SECRET = [自己生成的随机字符串]
   FRONTEND_URL = [你的域名]
   NODE_ENV = production
   ```
7. 点击查看部署的 API 地址

### 部署到 Vercel

1. 登录 Vercel (https://vercel.com)
2. 点击 "Add New" -> "Project"
3. 从 GitHub 导入 BOKE 仓库
4. 框架预设选择 "Other"
5. Build Command: 留空或 `echo "No build"`
6. Output Directory: `./`
7. Deploy

---

## 疑难解答

### 问题：推送时提示 "remote: Permission to username/repo.git denied"

**原因**：凭据错误或权限不足

**解决**：
1. 检查 GitHub 用户名是否正确
2. 确认使用了 Personal Access Token 而不是密码
3. Token 需要勾选 `repo` 权限
4. 重新生成新的 Token

### 问题：推送时提示 "Repository not found"

**原因**：仓库地址错误或仓库未创建

**解决**：
1. 确认已在 GitHub 创建仓库
2. 核对仓库地址是否完全匹配
3. 尝试使用 SSH 地址（如果配置了 SSH 密钥）

### 问题：推送时提示 "Updates were rejected"

**原因**：远程仓库已存在文件

**解决**：
```bash
# 强制推送（覆盖远程内容）
git push -u origin main -f

# 或先拉取再推送（如果远程有重要内容）
git pull origin main --allow-unrelated-histories
git push -u origin main
```

---

## 其他方式

如果以上方法都失败，可以尝试使用 GitHub Desktop：

1. 下载安装 GitHub Desktop
2. 登录 GitHub 账号
3. 将项目文件夹拖拽到 GitHub Desktop
4. 创建仓库并推送

---

需要帮助？随时询问！

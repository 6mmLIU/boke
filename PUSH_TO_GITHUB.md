# 推送到 GitHub 指南

## 方法1：使用 GitHub CLI（推荐）

1. **安装 GitHub CLI**
   - Windows: 从 https://cli.github.com/ 下载
   - Mac: `brew install gh`
   - Linux: `sudo apt install gh`

2. **登录 GitHub CLI**
```bash
gh auth login
```
选择 HTTPS 方式，按照提示完成登录。

3. **创建仓库并推送**
```bash
# 进入项目目录
cd E:\Desktop\boke

# 创建私有仓库并推送
github repo create BOKE --private --source=. --remote=origin --push

# 或创建公开仓库
github repo create BOKE --public --source=. --remote=origin --push
```

## 方法2：手动创建仓库并推送

如果你无法安装 GitHub CLI，可以按照以下步骤操作：

### 步骤1：在 GitHub 网站创建仓库

1. 登录 GitHub
2. 点击右上角的 "+" -> "New repository"
3. 填写信息：
   - Repository name: `BOKE`
   - Description: `砚 - Inkwell 博客系统`
   - 选择 Public 或 Private
   - 不要勾选 "Initialize this repository with a README"
4. 点击 "Create repository"

### 步骤2：获取仓库地址

创建仓库后，你会看到类似这样的页面：

```
git remote add origin https://github.com/你的用户名/BOKE.git
git branch -M main
git push -u origin main
```

### 步骤3：推送代码

在 Git Bash 或终端中执行：

```bash
# 进入项目目录
cd "E:\Desktop\boke"

# 初始化（如果还没有初始化）
git init

# 添加远程仓库地址
git remote add origin https://github.com/你的用户名/BOKE.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤4：输入 GitHub 凭据

推送时会提示输入：
- Username: 你的 GitHub 用户名
- Password: 你的 GitHub Personal Access Token（不是密码！）

#### 创建 Personal Access Token

1. 进入 GitHub Settings
2. 点击 "Developer settings"
3. 点击 "Personal access tokens"
4. 点击 "Generate new token (classic)"
5. 设置：
   - Note: "BOKE Repository"
   - Expiration: 根据需求选择
   - Select scopes: 勾选 `repo`（全部）
6. 点击 "Generate token"
7. 复制生成的 token（只显示一次！）

使用这个 token 作为密码。

---

## 验证推送成功

推送完成后，访问 https://github.com/你的用户名/BOKE 查看代码是否已上传。

---


## 配置本地开发

推送完成后，克隆到本地其他地方测试：

```bash
git clone https://github.com/你的用户名/BOKE.git
cd BOKE

# 进入后端
cd backend
npm install
npm run dev

# 前端直接用浏览器打开 index.html
```


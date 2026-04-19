@echo off
chcp 65001 >nul
echo 正在推送 Inkwell 博客系统到 GitHub...
echo.

echo 步骤1: 请在浏览器中打开 https://github.com/new
echo 步骤2: 创建名为 "BOKE" 的仓库（不要勾选 README）
echo 步骤3: 复制仓库的 HTTPS 地址（类似 https://github.com/你的用户名/BOKE.git）
echo.
pause

echo.
set /p REPO_URL="请输入你的仓库 HTTPS 地址: "

echo.
echo 正在配置远程仓库...
git remote add origin %REPO_URL%

: if remote already exists, remove it and add again
git remote remove origin 2>nul
git remote add origin %REPO_URL%

echo.
echo 正在推送到 GitHub...
git branch -M main
git push -u origin main

if %errorlevel% == 0 (
    echo.
    echo ✅ 推送成功！
    echo 访问 https://github.com/你的用户名/BOKE 查看代码
) else (
    echo.
    echo ❌ 推送失败，请检查错误信息并确保:
    echo 1. 已在 GitHub 创建仓库
    echo 2. 仓库地址正确
    echo 3. 已配置 GitHub 凭据 (使用 Personal Access Token)
)

echo.
pause

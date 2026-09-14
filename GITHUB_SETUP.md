# GitHub 发布指南

> 上手 10 分钟,把汉兜助手变成可在线体验的项目仓库

## 🎯 目标

发布后效果:
- 仓库地址:`https://github.com/<你的用户名>/handou-solver`
- 在线体验:`https://<你的用户名>.github.io/handou-solver/`(自动部署)
- README + 截图 + AGPL-3.0 协议 + 完整源码
- ⭐ Star 起来

## 步骤 1: 在 GitHub 创建仓库

1. 打开 https://github.com/new
2. **Repository name**: `handou-solver`(或你喜欢的名字)
3. **Description**: `A turn-based hint solver for the Chinese Hanzi Wordle (汉兜) · 回合制累加筛选`
4. **Public**(让 GitHub Pages 可用)
5. **不要**勾选 Add README / .gitignore / license(我们已经有了)
6. 点击 **Create repository**

## 步骤 2: 本地 git 初始化并推送

打开 PowerShell:

```powershell
cd D:\AI\Handou

# 初始化 git
git init
git add .
git commit -m "feat: initial release of handou-solver

回合制累加筛选工具,基于 antfu/handle 词库
- 29,760 个成语预计算
- antfu/handle testAnswer 算法
- 核心算法 javascript-obfuscator 混淆
- AGPL-3.0 协议
"

# 添加远程(替换 <你的用户名> 为你的 GitHub 用户名)
git remote add origin https://github.com/<你的用户名>/handou-solver.git
git branch -M main
git push -u origin main
```

第一次推送会要求你登录 GitHub(用 Personal Access Token 或 GitHub Desktop)。

## 步骤 3: 启用 GitHub Pages

1. 打开 `https://github.com/<你的用户名>/handou-solver/settings/pages`
2. **Source**: Deploy from a branch
3. **Branch**: `main` / `(root)`
4. 点击 **Save**
5. 等 1-2 分钟,GitHub 会给一个 URL:`https://<你的用户名>.github.io/handou-solver/`

## 步骤 4: 更新 README 里的链接

打开 `README.md`,把示例链接替换成你的:

```markdown
## ✨ 在线体验

**GitHub Pages**: `https://<你的用户名>.github.io/handou-solver/`
```

提交推送:

```powershell
git add README.md
git commit -m "docs: update GitHub Pages URL"
git push
```

## 步骤 5: 加几个徽章让 README 更专业

到 https://shields.io 生成:
- License 徽章:`https://img.shields.io/github/license/<你的用户名>/handou-solver`
- Stars 徽章:`https://img.shields.io/github/stars/<你的用户名>/handou-solver?style=social`
- Forks 徽章:`https://img.shields.io/github/forks/<你的用户名>/handou-solver?style=social`

在 README.md 顶部加:

```markdown
<p align="center">
  <img src="https://img.shields.io/github/license/<你的用户名>/handou-solver" alt="License" />
  <img src="https://img.shields.io/github/stars/<你的用户名>/handou-solver?style=social" alt="Stars" />
  <img src="https://img.shields.io/github/forks/<你的用户名>/handou-solver?style=social" alt="Forks" />
</p>
```

## 🎨 推广建议

1. **README 顶部要放截图**(用 PR 截图或者直接 README 嵌入)
2. **commit history 写清楚**:`git commit` 信息要规范
3. **Issues / Discussions** 启用:让用户能提问
4. **写博客/发推**:"我做了个汉兜助手 → https://github.com/..."

## ⚠️ 注意事项

- **dist/ 是发布版**(混淆 + 词库内嵌),不要 commit dist/ 之外的源数据(我们已经在 .gitignore 里忽略了 scripts/serve.log 和 _upstream 系列)
- **如果想用 GitHub Actions 自动部署 Pages**,可以在 `.github/workflows/pages.yml` 配,但我们这里用最简方式(直接 push 到 main 即可)
- **AGPL-3.0 的影响**:任何 fork + 修改 + 部署成网络服务,都必须公开修改后的源码
- **不要把 secrets 提交到仓库**(本项目没有,但要养成习惯)

## 🔄 后续迭代流程

```powershell
# 1. 改 src/app.js 或 src/solver-core.js
# 2. 跑构建
node scripts\build.mjs

# 3. 提交
git add .
git commit -m "feat: 描述你的改动"
git push

# 4. GitHub Pages 1-2 分钟后自动更新
```

# Todo Management

一个基于 React 和 Rsbuild 的现代化待办事项管理应用。

## Setup

Install the dependencies:

```bash
pnpm install
```

## Get started

Start the dev server, and the app will be available at [http://localhost:3000](http://localhost:3000).

```bash
pnpm run dev
```

Build the app for production:

```bash
pnpm run build
```

Preview the production build locally:

```bash
pnpm run preview
```

## 部署到 GitHub Pages

本项目已配置自动部署到 GitHub Pages。当您将代码推送到 `main` 分支时，会自动触发构建和部署流程。

### 手动部署

如果需要手动部署，可以使用以下命令：

```bash
# 首先安装 gh-pages 依赖
pnpm add -D gh-pages

# 执行部署
pnpm run deploy
```

### GitHub Pages 配置

1. 在 GitHub 仓库设置中启用 GitHub Pages
2. 选择 `gh-pages` 分支作为源
3. 确保仓库设置中的 Actions 权限已启用

### 自动部署流程

项目包含 GitHub Actions 工作流文件 `.github/workflows/deploy.yml`，配置了以下步骤：

- 当代码推送到 `main` 分支时自动触发
- 使用 Ubuntu 环境构建项目
- 自动安装依赖并构建生产版本
- 部署到 GitHub Pages

## Learn more

To learn more about Rsbuild, check out the following resources:

- [Rsbuild documentation](https://rsbuild.rs) - explore Rsbuild features and APIs.
- [Rsbuild GitHub repository](https://github.com/web-infra-dev/rsbuild) - your feedback and contributions are welcome!

# RedGifs 下载器

一个基于 [Next.js](https://nextjs.org) 构建的免费 RedGifs 视频下载工具，使用 [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) 创建。

## 项目简介

RedGifs 下载器是一个快速、免费、安全的在线工具，用于下载 RedGifs 平台的高清视频和封面图片。支持批量下载，无需注册，完全免费使用。

### 主要功能

- 🎥 **高清视频下载** - 支持原画质视频下载
- 📦 **批量下载** - 一次性下载多个视频
- 🖼️ **封面图片** - 同时下载视频封面图
- ⚡ **快速处理** - 秒级生成下载链接
- 🔒 **安全可靠** - 无需注册，保护隐私
- 📱 **响应式设计** - 支持手机和桌面端

## 开始使用

### 安装依赖

```bash
npm install
# 或者
yarn install
# 或者
pnpm install
```

### 启动开发服务器

```bash
npm run dev
# 或者
yarn dev
# 或者
pnpm dev
# 或者
bun dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

你可以通过修改 `app/page.tsx` 开始编辑页面。文件保存后页面会自动更新。

### 项目结构

```
src/
├── app/                 # Next.js App Router 页面
│   ├── blog/           # 博客页面
│   ├── faq/            # 常见问题
│   ├── privacy/        # 隐私政策
│   └── terms/          # 服务条款
├── components/         # React 组件
│   ├── ui/            # UI 基础组件
│   ├── downloader.tsx # 下载器核心组件
│   └── ...
├── data/              # 静态数据
│   └── blog/         # 博客文章
└── lib/              # 工具函数
```

### 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: Tailwind CSS
- **UI组件**: Radix UI + Shadcn/ui
- **动画**: Framer Motion
- **字体**: Geist (Vercel 字体)
- **语言**: TypeScript

## 部署

### Vercel 部署（推荐）

最简单的部署方式是使用 [Vercel 平台](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme)：

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 自动部署完成

### Cloudflare Pages 部署

使用 [Cloudflare Pages](https://pages.cloudflare.com/) 部署，享受全球 CDN 加速：

1. 将代码推送到 GitHub/GitLab
2. 在 Cloudflare Pages 中连接仓库
3. 设置构建配置：
   - **构建命令**: `npm run build`
   - **输出目录**: `out`
   - **Node.js 版本**: `18.17.0`
4. 添加环境变量（如需要）
5. 自动部署完成

### 其他部署方式

项目支持部署到任何支持 Node.js 的平台：

- **Netlify**: 静态导出模式
- **Railway**: 容器部署
- **Digital Ocean**: App Platform
- **自托管**: Docker 容器

查看 [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying) 了解更多详情。

## 开发指南

### 环境要求

- Node.js 18.17 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

### 本地开发

1. 克隆仓库
2. 安装依赖
3. 启动开发服务器
4. 开始开发

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 代码规范
- 使用 Prettier 格式化代码
- 组件采用函数式写法

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 相关链接

- [Next.js 文档](https://nextjs.org/docs) - 学习 Next.js 功能和 API
- [Next.js 教程](https://nextjs.org/learn) - 交互式 Next.js 教程
- [Tailwind CSS](https://tailwindcss.com) - 实用优先的 CSS 框架
- [Shadcn/ui](https://ui.shadcn.com) - 可复制粘贴的组件库

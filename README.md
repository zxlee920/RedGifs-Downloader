# RedGifs 视频下载器

基于 [Next.js](https://nextjs.org) 构建并部署在 Cloudflare 上的免费 RedGifs 视频下载工具。

## 项目概述

RedGifs 视频下载器是一个快速、免费、安全的在线工具，用于从 RedGifs 平台下载高清视频和封面图片。支持批量下载，无需注册，完全免费使用。

### 主要功能

- 🎥 **高清视频下载** - 下载原始质量视频
- 📦 **批量下载** - 一次下载多个视频
- 🖼️ **封面图片** - 下载视频缩略图
- ⚡ **快速处理** - 秒级生成下载链接
- 🔒 **安全私密** - 无需注册
- 📱 **响应式设计** - 支持移动端和桌面端

## 部署方案

本项目完全部署在 Cloudflare Workers 上：

### 全栈 Cloudflare Workers 部署
- 前端和后端都部署为 Cloudflare Workers
- 利用 Workers 的全球边缘计算能力
- 统一的部署和管理方式

## 部署说明

安装 Wrangler CLI：
```bash
npm install -g wrangler
```

登录 Cloudflare：
```bash
wrangler login
```

部署到 Workers：
```bash
wrangler deploy
```

## 开发

### 本地开发

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看结果。

⚠️ **重要提示：**
- 本地开发环境只能预览前端界面
- **下载功能在本地无法使用**，因为 API 需要部署到 Cloudflare Workers
- 要测试完整功能，必须先部署 Worker：`wrangler deploy`

## 项目结构

```
├── src/
│   ├── app/                 # Next.js App Router 页面
│   ├── components/          # React 组件
│   └── config/              # 配置文件
├── public/                  # 静态资源
├── worker.js               # Cloudflare Worker 入口文件
├── wrangler.toml           # Cloudflare Worker 配置
├── next.config.ts          # Next.js 配置
└── package.json
```

## 技术栈

- **前端**: Next.js 15.5.2 (App Router)
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI + Shadcn/ui
- **后端**: Cloudflare Workers
- **部署**: Cloudflare Workers
- **语言**: TypeScript

## 配置说明

### 分析与追踪

所有分析和追踪脚本集中管理在：
```
src/components/analytics.tsx
```

此文件包含：
- **Google Analytics**: `G-YM0P7YDGWF`
- **Microsoft Clarity**: `t4znm2y5db`
- **Microsoft Webmaster Tools**: `69D16751CFC6C5AE084CDA799DD24432`

**如何修改统计分析ID：**
1. 打开 `src/components/analytics.tsx` 文件
2. 直接修改对应的ID值：
   - Google Analytics: 修改 `G-YM0P7YDGWF`
   - Microsoft Clarity: 修改 `t4znm2y5db`
   - Webmaster验证码: 修改 `69D16751CFC6C5AE084CDA799DD24432`
3. 保存文件后重新部署即可生效

### 站点配置

通用站点设置配置在：
```
src/config/site.ts
```

包括：
- 站点标题、描述和元数据
- 基础 URL 和域名设置
- 作者信息
- 社交媒体链接

### 环境配置

应用自动检测环境：
- **开发环境**: 使用本地 Next.js 开发服务器（仅前端预览，API功能不可用）
- **生产环境**: 部署为 Cloudflare Worker，包含完整的前后端功能

**功能限制说明：**
- 本地开发：只能查看界面，无法下载视频
- 生产环境：完整功能，包括视频下载和批量处理

## 许可证

本项目采用 MIT 许可证。

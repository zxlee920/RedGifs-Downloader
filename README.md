# RedGifs Downloader

A free RedGifs video downloader built with [Next.js](https://nextjs.org) and deployed on Cloudflare.

## Project Overview

RedGifs Downloader is a fast, free, and secure online tool for downloading HD videos and cover images from RedGifs platform. Supports batch downloads, no registration required, completely free to use.

### Key Features

- 🎥 **HD Video Download** - Download original quality videos
- 📦 **Batch Download** - Download multiple videos at once
- 🖼️ **Cover Images** - Download video thumbnails
- ⚡ **Fast Processing** - Generate download links in seconds
- 🔒 **Secure & Private** - No registration required
- 📱 **Responsive Design** - Works on mobile and desktop

## Deployment

This project uses a hybrid deployment approach:

### Frontend - Cloudflare Pages
- Static Next.js site deployed to Cloudflare Pages
- Optimized for global CDN delivery

### Backend API - Cloudflare Workers
- API endpoints deployed as Cloudflare Workers
- Handles RedGifs API integration and video processing

## Setup Instructions

### 1. Deploy Cloudflare Worker

Install Wrangler CLI:
```bash
npm install -g wrangler
```

Login to Cloudflare:
```bash
wrangler login
```

Deploy the Worker:
```bash
wrangler deploy
```

### 2. Deploy Frontend to Cloudflare Pages

Build the static site:
```bash
npm run build
```

Deploy the `out/` directory to Cloudflare Pages.

## Development

For local development:

```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   └── lib/                 # Utility functions
├── worker.js               # Cloudflare Worker API
├── wrangler.toml          # Worker configuration
└── package.json
```

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Shadcn/ui
- **Backend**: Cloudflare Workers
- **Deployment**: Cloudflare Pages + Workers
- **Language**: TypeScript

## Environment Configuration

The app automatically detects the environment:
- **Development**: Uses local Next.js API routes
- **Production**: Uses Cloudflare Worker API

## License

This project is licensed under the MIT License.

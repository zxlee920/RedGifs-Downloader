// 网站统一配置
export const siteConfig = {
  // 主域名配置 - 只需要修改这里就能更新所有页面的域名
  baseUrl: 'https://redgifsdownloader.top',
  
  // 网站基本信息
  name: 'RedGifs Downloader',
  title: 'RedGifs Downloader – Bulk download HD videos in seconds',
  description: 'Stop wasting time &mdash; download RedGifs HD videos and cover images in seconds with our free online tool.',
  
  // 社交媒体图片
  ogImage: '/og.jpg',
  
  // 作者信息
  author: 'RedGifs Downloader',
  
  // 生成完整URL的辅助函数
  getUrl: (path: string = '') => {
    return `${siteConfig.baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  },
  
  // 常用页面路径
  pages: {
    home: '/',
    blog: '/blog',
    faq: '/faq',
    privacy: '/privacy',
    terms: '/terms',
    sitemap: '/sitemap.xml',
  }
}

// 导出类型定义
export type SiteConfig = typeof siteConfig

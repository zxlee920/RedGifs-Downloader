import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  updatedAt: string
  tags: string[]
  featured: boolean
  readTime: number
}

export interface PaginatedPosts {
  posts: BlogPost[]
  totalPosts: number
  totalPages: number
  currentPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// 安全的日期解析函数
function parseDate(dateString: string | Date): string {
  if (!dateString) {
    return new Date().toISOString()
  }
  
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date: ${dateString}, using current date`)
    return new Date().toISOString()
  }
  
  return date.toISOString()
}

// 计算阅读时间（基于内容长度）
function calculateReadTime(content: string): number {
  // 移除Markdown语法和HTML标签
  const plainText = content
    .replace(/^---[\s\S]*?---/, '') // 移除Front Matter
    .replace(/#{1,6}\s+/g, '') // 移除标题标记
    .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
    .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
    .replace(/`(.*?)`/g, '$1') // 移除行内代码标记
    .replace(/```[\s\S]*?```/g, '') // 移除代码块
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 移除图片
    .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
    .replace(/^\s*\d+\.\s+/gm, '') // 移除有序列表标记
    .replace(/^\s*>\s+/gm, '') // 移除引用标记
    .replace(/\n+/g, ' ') // 将换行替换为空格
    .trim()

  // 计算单词数（中英文混合）
  const words = plainText.split(/\s+/).filter(word => word.length > 0)
  const chineseChars = (plainText.match(/[\u4e00-\u9fff]/g) || []).length
  
  // 估算总字数：英文单词 + 中文字符
  const totalWords = words.length + chineseChars * 0.5 // 中文字符按0.5个单词计算
  
  // 平均阅读速度：200-250字/分钟，取中间值225
  const wordsPerMinute = 225
  const readTime = Math.ceil(totalWords / wordsPerMinute)
  
  // 最少1分钟，最多60分钟
  return Math.max(1, Math.min(60, readTime))
}

// 处理博客内容中的图片路径
function processImagePaths(content: string): string {
  // 将相对路径的图片转换为绝对路径
  return content.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/)([^)]+)\)/g,
    (match, alt, src) => {
      // 如果是相对路径，添加博客图片路径前缀
      if (!src.startsWith('/')) {
        return `![${alt}](/blog/images/${src})`
      }
      return match
    }
  )
}

// 读取并解析单篇文章
function parsePost(filename: string): BlogPost | null {
  try {
    const filePath = path.join(process.cwd(), 'src/data/blog', filename)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)
    
    // 验证必需字段
    if (!data.id || !data.title || !data.excerpt) {
      console.error(`Missing required fields in ${filename}:`, {
        id: !!data.id,
        title: !!data.title,
        excerpt: !!data.excerpt,
        data: data
      })
      return null
    }
    
    return {
      id: data.id,
      title: data.title,
      excerpt: data.excerpt,
      content: processImagePaths(content),
      author: data.author || 'Unknown Author',
      publishedAt: parseDate(data.publishedAt),
      updatedAt: parseDate(data.updatedAt),
      tags: Array.isArray(data.tags) ? data.tags : [],
      featured: Boolean(data.featured),
      readTime: data.readTime ? Number(data.readTime) : calculateReadTime(content)
    }
  } catch (error) {
    console.error(`Failed to parse post ${filename}:`, error)
    return null
  }
}

// 获取所有博客文章
export function getAllPosts(): BlogPost[] {
  try {
    const postsDir = path.join(process.cwd(), 'src/data/blog')
    const filenames = fs.readdirSync(postsDir).filter(name => name.endsWith('.md'))
    
    const posts = filenames
      .map(filename => parsePost(filename))
      .filter((post): post is BlogPost => post !== null)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    
    return posts
  } catch (error) {
    console.error('Failed to read posts directory:', error)
    return []
  }
}

// 根据ID获取单篇文章
export function getPostById(id: string): BlogPost | null {
  const posts = getAllPosts()
  return posts.find(post => post.id === id) || null
}

// 获取分页文章
export function getPaginatedPosts(page: number = 1, postsPerPage: number = 6): PaginatedPosts {
  const allPosts = getAllPosts()
  const totalPosts = allPosts.length
  const totalPages = Math.ceil(totalPosts / postsPerPage)
  const startIndex = (page - 1) * postsPerPage
  const endIndex = startIndex + postsPerPage
  const posts = allPosts.slice(startIndex, endIndex)

  return {
    posts,
    totalPosts,
    totalPages,
    currentPage: page,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

// 获取相关文章
export function getRelatedPosts(currentPostId: string, limit: number = 3): BlogPost[] {
  const currentPost = getPostById(currentPostId)
  if (!currentPost) return []

  const allPosts = getAllPosts().filter(post => post.id !== currentPostId)
  
  // 根据标签相似度排序
  const relatedPosts = allPosts
    .map(post => {
      const commonTags = post.tags.filter(tag => currentPost.tags.includes(tag))
      return {
        ...post,
        similarity: commonTags.length
      }
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)

  return relatedPosts.map(({ similarity, ...post }) => post)
}

// 根据标签筛选文章
export function getPostsByTag(tag: string): BlogPost[] {
  return getAllPosts().filter(post => 
    post.tags.some(postTag => postTag.toLowerCase() === tag.toLowerCase())
  )
}

// 搜索文章
export function searchPosts(query: string): BlogPost[] {
  const searchTerm = query.toLowerCase()
  return getAllPosts().filter(post =>
    post.title.toLowerCase().includes(searchTerm) ||
    post.excerpt.toLowerCase().includes(searchTerm) ||
    post.content.toLowerCase().includes(searchTerm) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

// 获取所有标签
export function getAllTags(): string[] {
  const allTags = getAllPosts().flatMap(post => post.tags)
  return Array.from(new Set(allTags)).sort()
}

// 格式化日期
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取精选文章
export function getFeaturedPosts(): BlogPost[] {
  return getAllPosts().filter(post => post.featured)
}

// 获取最新文章
export function getLatestPosts(limit: number = 5): BlogPost[] {
  return getAllPosts().slice(0, limit)
}

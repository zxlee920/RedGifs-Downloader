import fs from 'fs'
import path from 'path'

// 定义博客文章索引条目类型
interface BlogPostIndex {
  id: string
  title: string
  excerpt: string
  author: string
  publishedAt: string
  updatedAt: string
  tags: string[]
  featured: boolean
  readTime: number
}

// 添加新文章的工具函数
export async function addNewPost(postData: {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  tags: string[]
  featured?: boolean
  readTime: number
}) {
  const indexPath = path.join(process.cwd(), 'src/data/blog/index.json')
  const postPath = path.join(process.cwd(), 'src/data/blog/posts', `${postData.id}.md`)
  
  // 读取现有索引
  const currentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  
  // 创建新的索引条目
  const newIndexEntry = {
    id: postData.id,
    title: postData.title,
    excerpt: postData.excerpt,
    author: postData.author,
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: postData.tags,
    featured: postData.featured || false,
    readTime: postData.readTime
  }
  
  // 添加到索引并按日期排序
  currentIndex.unshift(newIndexEntry)
  currentIndex.sort((a: BlogPostIndex, b: BlogPostIndex) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  
  // 写入更新的索引
  fs.writeFileSync(indexPath, JSON.stringify(currentIndex, null, 2))
  
  // 写入文章内容
  fs.writeFileSync(postPath, postData.content)
  
  console.log(`✅ 新文章已添加: ${postData.title}`)
}

// 更新文章的工具函数
export async function updatePost(id: string, updates: Partial<{
  title: string
  excerpt: string
  content: string
  author: string
  tags: string[]
  featured: boolean
  readTime: number
}>) {
  const indexPath = path.join(process.cwd(), 'src/data/blog/index.json')
  const postPath = path.join(process.cwd(), 'src/data/blog/posts', `${id}.md`)
  
  // 更新索引
  const currentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  const postIndex = currentIndex.findIndex((post: BlogPostIndex) => post.id === id)
  
  if (postIndex === -1) {
    throw new Error(`文章 ${id} 不存在`)
  }
  
  // 更新索引条目
  currentIndex[postIndex] = {
    ...currentIndex[postIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  }
  
  fs.writeFileSync(indexPath, JSON.stringify(currentIndex, null, 2))
  
  // 如果有内容更新，更新文件
  if (updates.content) {
    fs.writeFileSync(postPath, updates.content)
  }
  
  console.log(`✅ 文章已更新: ${id}`)
}

// 删除文章的工具函数
export async function deletePost(id: string) {
  const indexPath = path.join(process.cwd(), 'src/data/blog/index.json')
  const postPath = path.join(process.cwd(), 'src/data/blog/posts', `${id}.md`)
  
  // 从索引中移除
  const currentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  const filteredIndex = currentIndex.filter((post: BlogPostIndex) => post.id !== id)
  
  fs.writeFileSync(indexPath, JSON.stringify(filteredIndex, null, 2))
  
  // 删除文章文件
  if (fs.existsSync(postPath)) {
    fs.unlinkSync(postPath)
  }
  
  console.log(`✅ 文章已删除: ${id}`)
}

// 批量导入文章的工具函数
export async function batchImportPosts(posts: Array<{
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt?: string
  tags: string[]
  featured?: boolean
  readTime: number
}>) {
  const indexPath = path.join(process.cwd(), 'src/data/blog/index.json')
  
  // 确保posts目录存在
  const postsDir = path.join(process.cwd(), 'src/data/blog/posts')
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true })
  }
  
  // 读取现有索引
  let currentIndex = []
  if (fs.existsSync(indexPath)) {
    currentIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  }
  
  // 处理每篇文章
  for (const post of posts) {
    const indexEntry = {
      id: post.id,
      title: post.title,
      excerpt: post.excerpt,
      author: post.author,
      publishedAt: post.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: post.tags,
      featured: post.featured || false,
      readTime: post.readTime
    }
    
    // 检查是否已存在
    const existingIndex = currentIndex.findIndex((p: BlogPostIndex) => p.id === post.id)
    if (existingIndex === -1) {
      currentIndex.push(indexEntry)
    } else {
      currentIndex[existingIndex] = indexEntry
    }
    
    // 写入文章内容
    const postPath = path.join(postsDir, `${post.id}.md`)
    fs.writeFileSync(postPath, post.content)
  }
  
  // 按日期排序并写入索引
  currentIndex.sort((a: BlogPostIndex, b: BlogPostIndex) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  
  fs.writeFileSync(indexPath, JSON.stringify(currentIndex, null, 2))
  
  console.log(`✅ 批量导入完成，共处理 ${posts.length} 篇文章`)
}

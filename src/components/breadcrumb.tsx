'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
}

export default function Breadcrumb() {
  const pathname = usePathname()
  
  // 生成面包屑路径
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', href: '/' }
    ]
    
    let currentPath = ''
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      
      // 根据路径段生成标签
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)
      if (segment === 'faq') {
        label = 'FAQ'
      } else if (segment === 'blog') {
        label = 'Blog'
      }
      
      breadcrumbs.push({
        label,
        href: currentPath
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs()
  
  // 如果只有首页，不显示面包屑
  if (breadcrumbs.length <= 1) {
    return null
  }
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground py-4">
      {breadcrumbs.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index === 0 && <Home className="h-4 w-4 mr-1" />}
          
          {index < breadcrumbs.length - 1 ? (
            <Link 
              href={item.href}
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium">
              {item.label}
            </span>
          )}
          
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="h-4 w-4 mx-2" />
          )}
        </div>
      ))}
    </nav>
  )
}

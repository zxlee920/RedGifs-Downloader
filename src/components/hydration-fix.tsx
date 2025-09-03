'use client'

import { useEffect } from 'react'

export default function HydrationFix() {
  useEffect(() => {
    // 添加hydrated类来显示页面，防止FOUC
    document.documentElement.classList.add('hydrated')
  }, [])

  return null
}

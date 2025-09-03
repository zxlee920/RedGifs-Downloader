'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Download, Loader2, CheckCircle, AlertCircle, Video, FileImage, List } from 'lucide-react'
import Image from 'next/image'

interface DownloadResult {
  type: 'video' | 'cover'
  url: string
  filename: string
  size?: string
}

interface ApiDownloadResult {
  type: 'video' | 'cover'
  url: string
  filename: string
  size?: string
}

interface BatchResult {
  url: string
  status: 'pending' | 'processing' | 'success' | 'error'
  results?: DownloadResult[]
  error?: string
}

export default function Downloader() {
  const [url, setUrl] = useState('')
  const [batchUrls, setBatchUrls] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isBatchLoading, setIsBatchLoading] = useState(false)
  const [results, setResults] = useState<DownloadResult[]>([])
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [error, setError] = useState('')
  const [batchError, setBatchError] = useState('')

  const handleDownload = async () => {
    if (!url.trim()) {
      setError('Please enter a valid RedGifs URL')
      return
    }

    if (!url.includes('redgifs.com')) {
      setError('Please enter a valid RedGifs URL')
      return
    }

    setIsLoading(true)
    setError('')
    setResults([])

    try {
      const apiUrl = '/api/download'
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process the URL')
      }

      if (data.success && data.downloads) {
        const formattedResults: DownloadResult[] = data.downloads.map((download: ApiDownloadResult) => ({
          type: download.type,
          url: download.url,
          filename: download.filename,
          size: download.size || undefined
        }))
        
        setResults(formattedResults)
      } else {
        throw new Error('No download links found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process the URL. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBatchDownload = async () => {
    if (!batchUrls.trim()) {
      setBatchError('Please enter at least one RedGifs URL')
      return
    }

    const urls = batchUrls.split('\n').filter(url => url.trim())
    const invalidUrls = urls.filter(url => !url.includes('redgifs.com'))
    
    if (invalidUrls.length > 0) {
      setBatchError(`Invalid URLs found: ${invalidUrls.length} URLs are not RedGifs links`)
      return
    }

    setIsBatchLoading(true)
    setBatchError('')
    
    // 初始化批量结果
    const initialResults: BatchResult[] = urls.map(url => ({
      url,
      status: 'pending'
    }))
    setBatchResults(initialResults)

    // 并行处理所有URL（限制并发数）
    const concurrencyLimit = 3
    const results = [...initialResults]
    
    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      const batch = urls.slice(i, i + concurrencyLimit)
      const promises = batch.map(async (url, batchIndex) => {
        const resultIndex = i + batchIndex
        
        // 更新状态为处理中
        results[resultIndex] = { ...results[resultIndex], status: 'processing' }
        setBatchResults([...results])

        try {
          const apiUrl = '/api/download'
          
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            results[resultIndex] = {
              ...results[resultIndex],
              status: 'success',
              results: data.downloads
            }
          } else {
            results[resultIndex] = {
              ...results[resultIndex],
              status: 'error',
              error: data.error || 'Failed to process URL'
            }
          }
        } catch {
          results[resultIndex] = {
            ...results[resultIndex],
            status: 'error',
            error: 'Network error'
          }
        }

        setBatchResults([...results])
      })

      await Promise.all(promises)
    }

    setIsBatchLoading(false)
  }

  const handleFileDownload = async (fileUrl: string, filename: string) => {
    try {
      // 使用代理下载API来实现真正的文件下载
      const downloadUrl = `https://redgifs-downloader.kasonleegm.workers.dev/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`
      
      // 创建一个隐藏的链接来触发下载
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download failed:', err)
      // 如果代理下载失败，回退到直接链接
      window.open(fileUrl, '_blank')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'cover':
        return <FileImage className="h-4 w-4" />
      default:
        return <Download className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'cover':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          RedGifs Downloader
        </CardTitle>
        <CardDescription>
          Choose between single URL download or bulk download multiple URLs at once
        </CardDescription>
      </CardHeader>
      <CardContent>
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="single" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Single Download
                </TabsTrigger>
                <TabsTrigger value="batch" className="flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Batch Download
                  <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 ml-1 rounded-full">
                    NEW
                  </Badge>
                </TabsTrigger>
              </TabsList>

          <TabsContent value="single" className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="url">RedGifs URL</Label>
              <div className="text-sm text-muted-foreground mb-2">
                1. Copy the RedGifs URL: Tap the three dots (More) → Share → Copy link<br />
                2. Paste the RedGifs URL below to download the video and cover image
              </div>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  placeholder="https://redgifs.com/watch/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1 h-12 text-base"
                />
                <Button 
                  onClick={handleDownload} 
                  disabled={isLoading}
                  className="min-w-[120px] h-12 text-base cursor-pointer disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing
                    </>
                  ) : (
                    <>
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{error}</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Download links ready!</span>
                </div>
                <div className="flex gap-6 items-start">
                  {/* 左侧封面图预览 */}
                  <div className="flex-shrink-0">
                    {results.find(r => r.type === 'cover') && (
                      <div className="w-20 border rounded-lg overflow-hidden bg-muted" style={{aspectRatio: '9/16'}}>
                        <Image
                          src={`https://redgifs-downloader.kasonleegm.workers.dev/proxy-image?url=${encodeURIComponent(results.find(r => r.type === 'cover')?.url || '')}`}
                          alt="Cover Preview"
                          className="w-full h-full object-cover"
                          width={320}
                          height={180}
                          unoptimized
                        />
                        <div className="w-full h-full flex-col items-center justify-center text-muted-foreground text-xs" style={{display: 'none'}}>
                          <FileImage className="h-6 w-6 mb-1" />
                          <span>Cover</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 右侧下载列表 */}
                  <div className="flex-1 space-y-3">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg min-h-[3.5rem]">
                        <div className="flex items-center gap-3">
                          {getIcon(result.type)}
                          <div className="hidden sm:block">
                            <div className="font-medium text-sm">{result.filename}</div>
                            {result.size && (
                              <div className="text-xs text-muted-foreground">{result.size}</div>
                            )}
                          </div>
                          <Badge className={`${getTypeColor(result.type)} hidden sm:inline-flex`}>
                            {result.type}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => handleFileDownload(result.url, result.filename)}
                          className="cursor-pointer"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="batch" className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="batch-urls">RedGifs URLs (one per line)</Label>
              <div className="text-sm text-muted-foreground mb-2">
                Enter multiple RedGifs URLs, one per line. All URLs will be processed simultaneously.
              </div>
              <Textarea
                id="batch-urls"
                placeholder={`https://redgifs.com/watch/example1...
https://redgifs.com/watch/example2...
https://redgifs.com/watch/example3...`}
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                className="min-h-[120px] text-base"
              />
              <Button 
                onClick={handleBatchDownload} 
                disabled={isBatchLoading}
                className="w-full h-12 text-base cursor-pointer disabled:cursor-not-allowed"
              >
                {isBatchLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Batch...
                  </>
                ) : (
                  <>
                    <List className="mr-2 h-4 w-4" />
                    Search All
                  </>
                )}
              </Button>
            </div>

            {batchError && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">{batchError}</span>
              </div>
            )}

            {batchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Batch Progress: {batchResults.filter(r => r.status === 'success').length} / {batchResults.length} completed
                  </span>
                </div>
                
                <div className="space-y-4">
                  {batchResults.map((batchResult, batchIndex) => (
                    <div key={batchIndex} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm font-medium truncate flex-1">{batchResult.url}</div>
                        <Badge variant={
                          batchResult.status === 'success' ? 'default' :
                          batchResult.status === 'error' ? 'destructive' :
                          batchResult.status === 'processing' ? 'secondary' : 'outline'
                        }>
                          {batchResult.status === 'processing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {batchResult.status}
                        </Badge>
                      </div>
                      
                      {batchResult.error && (
                        <div className="text-sm text-destructive mb-2">{batchResult.error}</div>
                      )}
                      
                      {batchResult.results && (
                        <div className="flex gap-4 items-start">
                          {/* 左侧封面图预览 */}
                          <div className="flex-shrink-0">
                            {batchResult.results.find(r => r.type === 'cover') && (
                              <div className="w-14 border rounded-lg overflow-hidden bg-muted" style={{aspectRatio: '9/16'}}>
                                <Image
                                  src={`https://redgifs-downloader.kasonleegm.workers.dev/proxy-image?url=${encodeURIComponent(batchResult.results.find(r => r.type === 'cover')?.url || '')}`}
                                  alt="Cover Preview"
                                  className="w-full h-full object-cover"
                                  width={320}
                                  height={180}
                                  unoptimized
                                />
                                <div className="w-full h-full flex-col items-center justify-center text-muted-foreground text-xs" style={{display: 'none'}}>
                                  <FileImage className="h-3 w-3 mb-1" />
                                  <span>Cover</span>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* 右侧下载列表 */}
                          <div className="flex-1 space-y-2">
                            {batchResult.results.map((result, resultIndex) => (
                              <div key={resultIndex} className="flex items-center justify-between p-2 bg-muted/50 rounded min-h-[2.5rem]">
                                <div className="flex items-center gap-2">
                                  {getIcon(result.type)}
                                  <span className="text-sm hidden sm:inline">{result.filename}</span>
                                  <Badge className={`${getTypeColor(result.type)} hidden sm:inline-flex`} variant="outline">
                                    {result.type}
                                  </Badge>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleFileDownload(result.url, result.filename)}
                                  className="cursor-pointer"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
        </CardContent>
    </Card>
  )
}

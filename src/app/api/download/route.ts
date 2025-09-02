import { NextRequest, NextResponse } from 'next/server'

interface RedGifsResponse {
  gif: {
    id: string
    createDate: number
    hasAudio: boolean
    width: number
    height: number
    likes: number
    tags: string[]
    verified: boolean
    views: number
    duration: number
    published: boolean
    urls: {
      sd: string
      hd: string
      poster: string
      thumbnail: string
      vthumbnail: string
    }
    userName: string
    type: number
    avgColor: string
  }
}

async function getAuthToken() {
  try {
    const response = await fetch('https://api.redgifs.com/v2/auth/temporary', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      return data.token
    }
  } catch (error) {
    console.log('Failed to get auth token:', error)
  }
  return null
}

async function scrapeRedGifsPage(url: string, videoId: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    })

    if (!response.ok) {
      return null
    }

    const html = await response.text()
    
    // 尝试从HTML中提取视频URL
    const videoUrlMatch = html.match(/"(https:\/\/[^"]*\.mp4[^"]*)"/)
    const posterMatch = html.match(/"(https:\/\/[^"]*poster[^"]*\.jpg[^"]*)"/)

    if (videoUrlMatch) {
      return {
        videoUrl: videoUrlMatch[1],
        posterUrl: posterMatch ? posterMatch[1] : null
      }
    }

    return null
  } catch (error) {
    console.log('Failed to scrape page:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url || !url.includes('redgifs.com')) {
      return NextResponse.json(
        { error: 'Invalid RedGifs URL' },
        { status: 400 }
      )
    }

    // Extract ID from URL - support multiple URL formats
    const urlPatterns = [
      /redgifs\.com\/watch\/([a-zA-Z0-9]+)/,
      /redgifs\.com\/gifs\/detail\/([a-zA-Z0-9]+)/,
      /redgifs\.com\/(?:watch\/)?([a-zA-Z0-9]+)$/
    ]
    
    let videoId = null
    for (const pattern of urlPatterns) {
      const match = url.match(pattern)
      if (match) {
        videoId = match[1]
        break
      }
    }
    
    if (!videoId) {
      return NextResponse.json(
        { error: 'Could not extract video ID from URL. Please check the URL format.' },
        { status: 400 }
      )
    }

    // 首先尝试网页抓取获取真实数据
    console.log(`Attempting to scrape RedGifs page for video ID: ${videoId}`)
    const scrapedData = await scrapeRedGifsPage(url, videoId)
    
    if (scrapedData && scrapedData.videoUrl) {
      console.log('Successfully scraped RedGifs data')
      const downloads = [
        {
          type: 'video',
          url: scrapedData.videoUrl,
          filename: `${videoId}_video.mp4`,
          quality: 'HD',
          size: null
        }
      ]
      
      if (scrapedData.posterUrl) {
        downloads.push({
          type: 'cover',
          url: scrapedData.posterUrl,
          filename: `${videoId}_cover.jpg`,
          quality: 'Standard',
          size: null
        })
      }

      return NextResponse.json({
        success: true,
        videoId: videoId,
        title: `RedGifs Video ${videoId}`,
        duration: 30,
        views: 0,
        likes: 0,
        hasAudio: true,
        downloads: downloads,
        note: 'Real RedGifs content extracted from webpage'
      })
    }

    // 如果网页抓取失败，尝试API调用
    console.log('Webpage scraping failed, trying API...')
    const token = await getAuthToken()
    
    const apiUrls = [
      `https://api.redgifs.com/v2/gifs/${videoId}`,
      `https://api.redgifs.com/v1/gifs/${videoId}`
    ]
    
    let response = null
    let data = null
    
    for (const apiUrl of apiUrls) {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com'
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
        
        response = await fetch(apiUrl, { headers })
        
        if (response.ok) {
          data = await response.json()
          break
        }
      } catch (error) {
        console.log(`Failed to fetch from ${apiUrl}:`, error)
        continue
      }
    }

    // Check if we have valid API data
    if (!response?.ok || !data || !data.gif || !data.gif.urls) {
      return NextResponse.json(
        { error: 'Unable to fetch video information from RedGifs. The video may be private, deleted, or the URL is incorrect.' },
        { status: 404 }
      )
    }

    const gif = data.gif

    // Prepare download links with safety checks
    const downloads = []
    
    // Add video download if available
    if (gif.urls && (gif.urls.hd || gif.urls.sd)) {
      downloads.push({
        type: 'video',
        url: gif.urls.hd || gif.urls.sd,
        filename: `${gif.id}_video.mp4`,
        quality: gif.urls.hd ? 'HD' : 'SD',
        size: null
      })
    }
    
    // Add cover download if available
    if (gif.urls && gif.urls.poster) {
      downloads.push({
        type: 'cover',
        url: gif.urls.poster,
        filename: `${gif.id}_cover.jpg`,
        quality: 'Standard',
        size: null
      })
    }

    // If no downloads are available, return error
    if (downloads.length === 0) {
      return NextResponse.json(
        { error: 'No downloadable content found. The video URLs may be invalid or inaccessible.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      videoId: gif.id,
      title: `RedGifs Video ${gif.id}`,
      duration: gif.duration || 30,
      views: gif.views || 0,
      likes: gif.likes || 0,
      hasAudio: gif.hasAudio || false,
      downloads: downloads
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  )
}

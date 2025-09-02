import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')
    const filename = searchParams.get('filename')

    if (!fileUrl || !filename) {
      return NextResponse.json(
        { error: 'Missing url or filename parameter' },
        { status: 400 }
      )
    }

    // 获取文件
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://redgifs.com/',
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch file' },
        { status: 404 }
      )
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const contentLength = response.headers.get('content-length')

    // 创建下载响应
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-cache',
    })

    if (contentLength) {
      headers.set('Content-Length', contentLength)
    }

    // 流式传输文件内容
    const body = response.body

    return new NextResponse(body, {
      status: 200,
      headers: headers
    })

  } catch (error) {
    console.error('Proxy download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 添加请求日志
    console.log('Request received:', {
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      headers: Object.fromEntries(request.headers.entries())
    });
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle CORS preflight requests FIRST
    if (request.method === 'OPTIONS') {
      return new Response('OPTIONS OK', {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Handle POST requests for download API - HIGHEST PRIORITY
    if (request.method === 'POST') {
      console.log('POST request detected, path:', url.pathname);
      
      if (url.pathname === '/' || url.pathname === '/api/download' || url.pathname.startsWith('/api/download')) {
        console.log('POST request matched, processing download API');
        try {
          const requestBody = await request.text();
          console.log('Request body:', requestBody);
          
          const { url: videoUrl } = JSON.parse(requestBody);

          if (!videoUrl || !videoUrl.includes('redgifs.com')) {
            return new Response(JSON.stringify({ error: 'Invalid RedGifs URL' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          // Extract video ID from URL
          const urlPatterns = [
            /redgifs\.com\/watch\/([a-zA-Z0-9]+)/,
            /redgifs\.com\/gifs\/detail\/([a-zA-Z0-9]+)/,
            /redgifs\.com\/(?:watch\/)?([a-zA-Z0-9]+)$/
          ];
          
          let videoId = null;
          for (const pattern of urlPatterns) {
            const match = videoUrl.match(pattern);
            if (match) {
              videoId = match[1];
              break;
            }
          }
          
          if (!videoId) {
            return new Response(JSON.stringify({ 
              error: 'Could not extract video ID from URL. Please check the URL format.' 
            }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          // 使用专业化的RedGifs API客户端
          const gifData = await redgifsAPI.getGif(videoId);
          
          if (gifData && gifData.success) {
            return new Response(JSON.stringify(gifData), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          // 如果API失败，尝试网页抓取作为备用方案
          console.log('API failed, trying web scraping for:', videoUrl);
          const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);
          console.log('Scraping result:', scrapedData);
          
          if (scrapedData && (scrapedData.hlsUrl || scrapedData.videoUrl)) {
            const downloads = [];
            
            // 优先添加HLS链接（有音频，无水印）
            if (scrapedData.hlsUrl) {
              downloads.push({
                type: 'video',
                url: scrapedData.hlsUrl,
                filename: `${videoId}.m3u8`,
                quality: 'HLS (Audio + No Watermark)',
                size: null,
                preferred: true
              });
            }
            
            // 添加MP4链接作为备用
            if (scrapedData.videoUrl) {
              downloads.push({
                type: 'video',
                url: scrapedData.videoUrl,
                filename: `${videoId}_video.mp4`,
                quality: 'HD (May have watermark)',
                size: null
              });
            }
            
            if (scrapedData.posterUrl) {
              downloads.push({
                type: 'cover',
                url: scrapedData.posterUrl,
                filename: `${videoId}_cover.jpg`,
                quality: 'Standard',
                size: null
              });
            }

            return new Response(JSON.stringify({
              success: true,
              videoId: videoId,
              title: `RedGifs Video ${videoId}`,
              duration: 30,
              views: 0,
              likes: 0,
              hasAudio: scrapedData.hlsUrl ? true : false,
              downloads: downloads,
              note: 'Fallback: content extracted from webpage'
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
          }

          // 如果都失败了，返回错误
          return new Response(JSON.stringify({ 
            error: 'Unable to fetch video information from RedGifs. The video may be private, deleted, or the URL is incorrect.' 
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });

        } catch (error) {
          console.error('POST request error:', error);
          return new Response(JSON.stringify({ 
            error: 'Internal server error. Please try again later.' 
          }), {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      } else {
        console.log('POST request path not matched:', url.pathname);
        return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }
    
    // Simple test endpoint
    if (request.method === 'GET' && url.pathname === '/test') {
      return new Response(JSON.stringify({ 
        message: 'Worker is working!',
        method: request.method,
        path: url.pathname 
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
    
    // Handle POST requests for download API
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/api/download' || url.pathname.startsWith('/api/download'))) {
      console.log('POST request matched, processing download API');
      try {
        const requestBody = await request.text();
        console.log('Request body:', requestBody);
        
        const { url: videoUrl } = JSON.parse(requestBody);

        if (!videoUrl || !videoUrl.includes('redgifs.com')) {
          return new Response(JSON.stringify({ error: 'Invalid RedGifs URL' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // Extract video ID from URL
        const urlPatterns = [
          /redgifs\.com\/watch\/([a-zA-Z0-9]+)/,
          /redgifs\.com\/gifs\/detail\/([a-zA-Z0-9]+)/,
          /redgifs\.com\/(?:watch\/)?([a-zA-Z0-9]+)$/
        ];
        
        let videoId = null;
        for (const pattern of urlPatterns) {
          const match = videoUrl.match(pattern);
          if (match) {
            videoId = match[1];
            break;
          }
        }
        
        if (!videoId) {
          return new Response(JSON.stringify({ 
            error: 'Could not extract video ID from URL. Please check the URL format.' 
          }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // 使用专业化的RedGifs API客户端
        const gifData = await redgifsAPI.getGif(videoId);
        
        if (gifData && gifData.success) {
          return new Response(JSON.stringify(gifData), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // 如果API失败，尝试网页抓取作为备用方案
        console.log('API failed, trying web scraping for:', videoUrl);
        const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);
        console.log('Scraping result:', scrapedData);
        
        if (scrapedData && (scrapedData.hlsUrl || scrapedData.videoUrl)) {
          const downloads = [];
          
          // 优先添加HLS链接（有音频，无水印）
          if (scrapedData.hlsUrl) {
            downloads.push({
              type: 'video',
              url: scrapedData.hlsUrl,
              filename: `${videoId}.m3u8`,
              quality: 'HLS (Audio + No Watermark)',
              size: null,
              preferred: true
            });
          }
          
          // 添加MP4链接作为备用
          if (scrapedData.videoUrl) {
            downloads.push({
              type: 'video',
              url: scrapedData.videoUrl,
              filename: `${videoId}_video.mp4`,
              quality: 'HD (May have watermark)',
              size: null
            });
          }
          
          if (scrapedData.posterUrl) {
            downloads.push({
              type: 'cover',
              url: scrapedData.posterUrl,
              filename: `${videoId}_cover.jpg`,
              quality: 'Standard',
              size: null
            });
          }

          return new Response(JSON.stringify({
            success: true,
            videoId: videoId,
            title: `RedGifs Video ${videoId}`,
            duration: 30,
            views: 0,
            likes: 0,
            hasAudio: scrapedData.hlsUrl ? true : false,
            downloads: downloads,
            note: 'Fallback: content extracted from webpage'
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // 如果都失败了，返回错误
        return new Response(JSON.stringify({ 
          error: 'Unable to fetch video information from RedGifs. The video may be private, deleted, or the URL is incorrect.' 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });

      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Internal server error. Please try again later.' 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Handle image proxy requests
    if (url.pathname === '/proxy-image' && request.method === 'GET') {
      const imageUrl = url.searchParams.get('url');
      
      if (!imageUrl) {
        return new Response(JSON.stringify({ error: 'Missing image URL' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        });
      }

      try {
        const response = await fetch(imageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://redgifs.com/',
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        return new Response(response.body, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=3600',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to load image' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        });
      }
    }

    // Handle proxy download requests - 使用专业化RedGifs下载方法
    if (url.pathname === '/proxy-download' && request.method === 'GET') {
      const fileUrl = url.searchParams.get('url');
      const filename = url.searchParams.get('filename');
      
      if (!fileUrl || !filename) {
        return new Response(JSON.stringify({ error: 'Missing url or filename parameter' }), {
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        });
      }

      try {
        let response;
        
        // 检查是否为RedGifs URL，使用专用下载方法
        if (fileUrl.includes('redgifs.com') || fileUrl.includes('redgifs')) {
          response = await redgifsAPI.download(fileUrl, filename);
        } else {
          // 非RedGifs URL使用普通方法
          response = await fetch(fileUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': 'https://redgifs.com/',
            }
          });
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }

        const responseHeaders = {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...corsHeaders,
        };

        // 支持Range请求
        const range = request.headers.get('Range');
        if (range && response.headers.get('Accept-Ranges')) {
          responseHeaders['Accept-Ranges'] = response.headers.get('Accept-Ranges');
          if (response.headers.get('Content-Range')) {
            responseHeaders['Content-Range'] = response.headers.get('Content-Range');
          }
        }
        
        if (response.headers.get('Content-Length')) {
          responseHeaders['Content-Length'] = response.headers.get('Content-Length');
        }

        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders,
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to download file' }), {
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders,
          }
        });
      }
    }

    // Handle GET requests for static files
    if (request.method === 'GET') {
      try {
        // Try to serve static files from the built Next.js app
        const staticResponse = await env.ASSETS.fetch(request);
        if (staticResponse.status !== 404) {
          // Add CORS headers to static responses
          const response = new Response(staticResponse.body, {
            status: staticResponse.status,
            statusText: staticResponse.statusText,
            headers: {
              ...staticResponse.headers,
              ...corsHeaders,
            },
          });
          return response;
        }
      } catch (error) {
        // If ASSETS binding is not available, return API info for root
        if (url.pathname === '/' || url.pathname === '/api/download') {
          return new Response(JSON.stringify({ 
            message: 'RedGifs Downloader API',
            version: '1.0.0',
            method: request.method,
            path: url.pathname,
            endpoints: {
              'POST /': 'Download RedGifs video - send JSON with {url: "redgifs_url"}',
              'POST /api/download': 'Download RedGifs video - send JSON with {url: "redgifs_url"}',
              'GET /proxy-download': 'Proxy download file - query params: url, filename'
            }
          }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
      }
      
      // If no static file found, return 404
      return new Response('Not Found', { status: 404 });
    }

    // Handle unsupported methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
};

// RedGifs API Client - 基于官方Python库设计
class RedGifsAPI {
  constructor() {
    this.token = null;
    this.baseURL = 'https://api.redgifs.com';
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  }

  // 获取临时认证token
  async login() {
    try {
      const response = await fetch(`${this.baseURL}/v2/auth/temporary`, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com'
        }
      });
      
      console.log('Auth response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        console.log('Token obtained:', this.token ? 'Yes' : 'No');
        return this.token;
      } else {
        console.log('Auth failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Auth token error:', error);
    }
    return null;
  }

  // 获取GIF详细信息
  async getGif(id) {
    if (!this.token) {
      await this.login();
    }

    const apiUrls = [
      `${this.baseURL}/v2/gifs/${id}`,
      `${this.baseURL}/v1/gifs/${id}`
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const headers = {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com'
        };
        
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(apiUrl, { headers });
        
        console.log(`API ${apiUrl} response:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('API data received:', data);
          return this.processGifData(data.gif);
        } else {
          console.log(`API ${apiUrl} failed:`, response.status, await response.text());
        }
      } catch (error) {
        console.error(`API ${apiUrl} error:`, error);
        continue;
      }
    }
    
    return null;
  }

  // 处理GIF数据，转换为标准格式
  processGifData(gif) {
    if (!gif || !gif.urls) return null;

    const downloads = [];
    const urls = gif.urls;

    // 优先使用HLS流（有音频，无水印）
    if (urls.hls) {
      downloads.push({
        type: 'video',
        url: urls.hls,
        filename: `${gif.id}.m3u8`,
        quality: 'HLS (Audio + No Watermark)',
        size: null,
        preferred: true
      });
    }

    // 其次使用embed_url（避免IP泄露）
    if (urls.embed_url) {
      downloads.push({
        type: 'video',
        url: urls.embed_url,
        filename: `${gif.id}_embed.mp4`,
        quality: 'Embed (No IP leak)',
        size: null,
        preferred: !urls.hls // 只有没有HLS时才标记为推荐
      });
    }

    // HD视频（可能有水印）
    if (urls.hd) {
      downloads.push({
        type: 'video',
        url: urls.hd,
        filename: `${gif.id}_hd.mp4`,
        quality: 'HD (May have watermark)',
        size: null
      });
    }

    // SD视频（可能有水印）
    if (urls.sd) {
      downloads.push({
        type: 'video',
        url: urls.sd,
        filename: `${gif.id}_sd.mp4`,
        quality: 'SD (May have watermark)',
        size: null
      });
    }

    // 封面图片
    if (urls.poster) {
      downloads.push({
        type: 'cover',
        url: urls.poster,
        filename: `${gif.id}_poster.jpg`,
        quality: 'Poster',
        size: null
      });
    }

    // 缩略图
    if (urls.thumbnail) {
      downloads.push({
        type: 'thumb',
        url: urls.thumbnail,
        filename: `${gif.id}_thumb.jpg`,
        quality: 'Thumbnail',
        size: null
      });
    }

    return {
      success: true,
      videoId: gif.id,
      title: gif.title || `RedGifs ${gif.id}`,
      duration: gif.duration || 0,
      views: gif.views || 0,
      likes: gif.likes || 0,
      hasAudio: gif.hasAudio || false,
      width: gif.width || 0,
      height: gif.height || 0,
      tags: gif.tags || [],
      username: gif.username || 'Unknown',
      verified: gif.verified || false,
      published: gif.published || true,
      createDate: gif.createDate || null,
      downloads: downloads
    };
  }

  // 专用下载方法，处理RedGifs的验证
  async download(url, filename) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// 全局API实例
const redgifsAPI = new RedGifsAPI();

async function scrapeRedGifsPage(url, videoId) {
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
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // 优先提取HLS链接（有音频，无水印）
    const hlsMatch = html.match(/"hls":"(https:[^"]+\.m3u8)"/);
    const hdSrcMatch = html.match(/"hdSrc":"(https:[^"]+\.mp4)"/);
    const posterMatch = html.match(/"poster":"(https:[^"]+\.jpg)"/);

    if (hlsMatch || hdSrcMatch) {
      return {
        hlsUrl: hlsMatch ? hlsMatch[1] : null,
        videoUrl: hdSrcMatch ? hdSrcMatch[1] : null,
        posterUrl: posterMatch ? posterMatch[1] : null
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}
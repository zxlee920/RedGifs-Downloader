export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
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
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/api/download')) {
      try {
        const { url: videoUrl } = await request.json();

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

        // 使用优化的RedGifs API客户端
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
        const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);
        
        if (scrapedData && scrapedData.videoUrl) {
          const downloads = [
            {
              type: 'video',
              url: scrapedData.videoUrl,
              filename: `${videoId}_video.mp4`,
              quality: 'HD',
              size: null
            }
          ];
          
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
            hasAudio: true,
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
        if (fileUrl.includes('redgifs.com') || fileUrl.includes('redgifs') || fileUrl.includes('thumbs.redgifs.com') || fileUrl.includes('files.redgifs.com')) {
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
        if (url.pathname === '/') {
          return new Response(JSON.stringify({ 
            message: 'RedGifs Downloader API',
            version: '1.0.0',
            endpoints: {
              'POST /': 'Download RedGifs video - send JSON with {url: "redgifs_url"}',
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

// RedGifs API Client - 优化版本，支持无水印高质量下载
class RedGifsAPI {
  constructor() {
    this.token = null;
    this.baseURL = 'https://api.redgifs.com';
    this.userAgent = 'RedGifs/3.4.33 (android; gzip)'; // 使用官方移动端 User-Agent
    this.tokenExpiry = null;
  }

  // 获取临时认证token - 优化版本
  async login() {
    try {
      // 如果token还有效，直接返回
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }

      const response = await fetch(`${this.baseURL}/v2/auth/temporary`, {
        method: 'GET',
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        // Token通常1小时有效，设置45分钟过期时间
        this.tokenExpiry = Date.now() + (45 * 60 * 1000);
        return this.token;
      } else {
        console.error('Auth failed:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Auth token error:', error);
    }
    return null;
  }

  // 获取GIF详细信息 - 优化版本
  async getGif(id) {
    await this.login();
    
    // 尝试多个API端点
    const apiUrls = [
      `${this.baseURL}/v2/gifs/${id}?views=yes`,
      `${this.baseURL}/v2/gifs/${id}`,
      `${this.baseURL}/v1/gifs/${id}`
    ];
    
    for (const apiUrl of apiUrls) {
      try {
        const headers = {
          'User-Agent': this.userAgent,
          'Accept': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site'
        };
        
        if (this.token) {
          headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(apiUrl, { headers });
        
        if (response.ok) {
          const data = await response.json();
          const gifData = data.gif || data;
          if (gifData && gifData.urls) {
            return this.processGifData(gifData);
          }
        } else if (response.status === 401) {
          // Token过期，重新获取
          this.token = null;
          this.tokenExpiry = null;
          await this.login();
          continue;
        }
      } catch (error) {
        console.error(`API error for ${apiUrl}:`, error);
        continue;
      }
    }
    
    return null;
  }

  // 处理GIF数据，优化优先级，优先获取无水印高质量版本
  processGifData(gif) {
    if (!gif || !gif.urls) return null;

    const downloads = [];
    const urls = gif.urls;

    // 优先级：hd > sd > mobile > embed
    // 避免使用embed_url，因为它通常有水印

    // HD视频（最高优先级，通常无水印有声音）
    if (urls.hd) {
      downloads.push({
        type: 'video',
        url: urls.hd,
        filename: `${gif.id}_hd.mp4`,
        quality: 'HD (1080p)',
        size: null,
        preferred: true,
        watermark: false,
        hasAudio: true
      });
    }

    // SD视频（第二优先级）
    if (urls.sd) {
      downloads.push({
        type: 'video',
        url: urls.sd,
        filename: `${gif.id}_sd.mp4`,
        quality: 'SD (720p)',
        size: null,
        watermark: false,
        hasAudio: true
      });
    }

    // Mobile版本（移动端优化）
    if (urls.mobile) {
      downloads.push({
        type: 'video',
        url: urls.mobile,
        filename: `${gif.id}_mobile.mp4`,
        quality: 'Mobile (480p)',
        size: null,
        watermark: false,
        hasAudio: true
      });
    }

    // VThumbnail（视频缩略图，通常较小但无水印）
    if (urls.vthumbnail) {
      downloads.push({
        type: 'video',
        url: urls.vthumbnail,
        filename: `${gif.id}_vthumbnail.mp4`,
        quality: 'Thumbnail Video',
        size: null,
        watermark: false,
        hasAudio: false
      });
    }

    // 只有在没有其他选项时才使用embed（通常有水印）
    if (downloads.length === 0 && urls.embed_url) {
      downloads.push({
        type: 'video',
        url: urls.embed_url,
        filename: `${gif.id}_embed.mp4`,
        quality: 'Embed (May have watermark)',
        size: null,
        watermark: true,
        hasAudio: gif.hasAudio
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
      hasAudio: gif.hasAudio !== false, // 默认假设有音频
      width: gif.width || 0,
      height: gif.height || 0,
      tags: gif.tags || [],
      username: gif.userName || gif.username || 'Unknown',
      verified: gif.verified || false,
      published: gif.published !== false,
      createDate: gif.createDate || gif.published || null,
      downloads: downloads,
      note: downloads.length > 0 && !downloads[0].watermark ? 'High quality, no watermark version' : undefined
    };
  }

  // 专用下载方法，优化RedGifs下载
  async download(url, filename) {
    try {
      // 确保有有效token
      await this.login();
      
      const headers = {
        'User-Agent': this.userAgent,
        'Referer': 'https://redgifs.com/',
        'Origin': 'https://redgifs.com',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'video',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'same-site',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };

      // 对于API域名，添加Authorization头
      if (this.token && (url.includes('api.redgifs.com') || url.includes('thumbs.redgifs.com') || url.includes('files.redgifs.com'))) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        // 如果401，尝试刷新token重试
        if (response.status === 401) {
          this.token = null;
          this.tokenExpiry = null;
          await this.login();
          if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
            const retryResponse = await fetch(url, { headers });
            if (retryResponse.ok) {
              return retryResponse;
            }
          }
        }
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  }
}

// 全局API实例
const redgifsAPI = new RedGifsAPI();

// 优化的网页抓取函数，寻找无水印版本
async function scrapeRedGifsPage(url, videoId) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0'
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // 寻找各种可能的视频URL，优先高质量版本
    const patterns = [
      // HD版本
      /"(https:\/\/[^"]*files\.redgifs\.com[^"]*\/[^"]*-hd[^"]*\.mp4[^"]*)"/gi,
      /"(https:\/\/[^"]*thumbs\.redgifs\.com[^"]*\/[^"]*-hd[^"]*\.mp4[^"]*)"/gi,
      // SD版本
      /"(https:\/\/[^"]*files\.redgifs\.com[^"]*\/[^"]*-sd[^"]*\.mp4[^"]*)"/gi,
      /"(https:\/\/[^"]*thumbs\.redgifs\.com[^"]*\/[^"]*-sd[^"]*\.mp4[^"]*)"/gi,
      // Mobile版本
      /"(https:\/\/[^"]*files\.redgifs\.com[^"]*\/[^"]*-mobile[^"]*\.mp4[^"]*)"/gi,
      // 通用mp4
      /"(https:\/\/[^"]*files\.redgifs\.com[^"]*\.mp4[^"]*)"/gi,
      /"(https:\/\/[^"]*thumbs\.redgifs\.com[^"]*\.mp4[^"]*)"/gi
    ];
    
    let videoUrl = null;
    
    for (const pattern of patterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        // 取第一个匹配，去掉引号
        videoUrl = matches[0].replace(/"/g, '');
        break;
      }
    }

    // 寻找封面图片
    const posterPatterns = [
      /"(https:\/\/[^"]*thumbs\.redgifs\.com[^"]*-poster[^"]*\.jpg[^"]*)"/gi,
      /"(https:\/\/[^"]*files\.redgifs\.com[^"]*-poster[^"]*\.jpg[^"]*)"/gi
    ];
    
    let posterUrl = null;
    for (const pattern of posterPatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        posterUrl = matches[0].replace(/"/g, '');
        break;
      }
    }

    if (videoUrl) {
      return {
        videoUrl: videoUrl,
        posterUrl: posterUrl
      };
    }

    return null;
  } catch (error) {
    console.error('Scraping error:', error);
    console.log('Method:', request.method);
    console.log('Pathname:', url.pathname);
    console.log('Full URL:', request.url);
    return null;
  }
}
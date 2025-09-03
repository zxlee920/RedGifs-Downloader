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
    
    // Handle HLS conversion API
    if (request.method === 'POST' && url.pathname === '/api/convert-hls') {
      try {
        const { m3u8Url, outputFilename } = await request.json();
        
        // 获取m3u8播放列表
        const m3u8Response = await fetch(m3u8Url);
        if (!m3u8Response.ok) {
          throw new Error('Failed to fetch m3u8 playlist');
        }
        
        const m3u8Content = await m3u8Response.text();
        
        // 解析ts文件URLs
        const tsUrls = [];
        const lines = m3u8Content.split('\n');
        const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);
        
        for (const line of lines) {
          if (line.trim() && !line.startsWith('#')) {
            const tsUrl = line.startsWith('http') ? line : baseUrl + line;
            tsUrls.push(tsUrl.trim());
          }
        }
        
        // 下载所有ts分片
        const tsSegments = [];
        for (const tsUrl of tsUrls) {
          const tsResponse = await fetch(tsUrl);
          if (tsResponse.ok) {
            const tsData = await tsResponse.arrayBuffer();
            tsSegments.push(new Uint8Array(tsData));
          }
        }
        
        // 合并ts分片
        const totalLength = tsSegments.reduce((sum, segment) => sum + segment.length, 0);
        const mergedData = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const segment of tsSegments) {
          mergedData.set(segment, offset);
          offset += segment.length;
        }
        
        return new Response(mergedData, {
          headers: {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment; filename="${outputFilename}"`,
            ...corsHeaders,
          },
        });
        
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'HLS conversion failed: ' + error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
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

        // Try to scrape RedGifs page first
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
            note: 'Real RedGifs content extracted from webpage'
          }), {
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        // If scraping fails, try API approach
        const token = await getAuthToken();
        
        const apiUrls = [
          `https://api.redgifs.com/v2/gifs/${videoId}`,
          `https://api.redgifs.com/v1/gifs/${videoId}`
        ];
        
        let response = null;
        let data = null;
        
        for (const apiUrl of apiUrls) {
          try {
            const headers = {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Referer': 'https://redgifs.com/',
              'Origin': 'https://redgifs.com'
            };
            
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            response = await fetch(apiUrl, { headers });
            
            if (response.ok) {
              data = await response.json();
              break;
            }
          } catch (error) {
            continue;
          }
        }

        // Check if we have valid API data
        if (!response?.ok || !data || !data.gif || !data.gif.urls) {
          return new Response(JSON.stringify({ 
            error: 'Unable to fetch video information from RedGifs. The video may be private, deleted, or the URL is incorrect.' 
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const gif = data.gif;

        // Prepare download links
        const downloads = [];
        
        if (gif.urls) {
          // ✅ 优先返回 HLS（有声、无水印）
          if (gif.urls.hls) {
            downloads.push({
              type: 'video',
              url: gif.urls.hls,
              filename: `${gif.id}.m3u8`,
              quality: 'HLS (with audio, no watermark)',
              size: null
            });
          }

          // 备用：mp4 (无声，可能带水印)
          if (gif.urls.hd || gif.urls.sd) {
            downloads.push({
              type: 'video',
              url: gif.urls.hd || gif.urls.sd,
              filename: `${gif.id}_preview.mp4`,
              quality: gif.urls.hd ? 'HD mp4 (no audio)' : 'SD mp4 (no audio)',
              size: null
            });
          }

          // 视频封面
          if (gif.urls.poster) {
            downloads.push({
              type: 'cover',
              url: gif.urls.poster,
              filename: `${gif.id}_cover.jpg`,
              quality: 'Poster',
              size: null
            });
          }
        }

        if (downloads.length === 0) {
          return new Response(JSON.stringify({
            error: 'No downloadable content found. The video may be private or unavailable.'
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          videoId: gif.id,
          title: gif.title,
          duration: gif.duration || 30,
          views: gif.views || 0,
          likes: gif.likes || 0,
          hasAudio: gif.hasAudio || false,
          downloads: downloads
        }), {
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

    // Handle proxy download requests
    if (url.pathname === '/proxy-download' && request.method === 'GET') {
      const fileUrl = url.searchParams.get('url');
      const filename = url.searchParams.get('filename');
      
      if (!fileUrl || !filename) {
        return new Response(JSON.stringify({ error: 'Missing url or filename parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      try {
        const response = await fetch(fileUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status}`);
        }

        return new Response(response.body, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${filename}"`,
            ...corsHeaders,
          },
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

async function getAuthToken() {
  try {
    const response = await fetch('https://api.redgifs.com/v2/auth/temporary', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.token;
    }
  } catch (error) {
    // Ignore auth token errors
  }
  return null;
}

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
    
    // Extract video URL from HTML
    const videoUrlMatch = html.match(/"(https:\/\/[^"]*\.mp4[^"]*)"/);
    const posterMatch = html.match(/"(https:\/\/[^"]*poster[^"]*\.jpg[^"]*)"/);

    if (videoUrlMatch) {
      return {
        videoUrl: videoUrlMatch[1],
        posterUrl: posterMatch ? posterMatch[1] : null
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}
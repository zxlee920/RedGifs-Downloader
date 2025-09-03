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

        // Try to scrape RedGifs page first (fallback if API fails)
        // const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);

        // API approach
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
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Referer': 'https://www.redgifs.com/',
              'Origin': 'https://www.redgifs.com',
              'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
              'Sec-Ch-Ua-Mobile': '?0',
              'Sec-Ch-Ua-Platform': '"Windows"',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'same-site'
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
        
        // If API fails, try scraping as fallback
        if (!response?.ok || !data || !data.gif || !data.gif.urls) {
          const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);
          
          if (scrapedData && scrapedData.videoUrl) {
            const downloads = [
              {
                type: 'video',
                url: scrapedData.videoUrl,
                filename: `${videoId}_video.mp4`,
                quality: 'HD-Scraped',
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
              debug: {
                version: '2.7.0',
                method: 'webpage-scraping',
                note: 'API failed, used webpage scraping'
              }
            }), {
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders,
              },
            });
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
        
        // 优先使用无水印有声音的视频源
        let primaryVideoUrl = null;
        let primaryVideoQuality = 'SD';
        
        // 优先使用无水印的web_url和embed_url
        if (gif.urls) {
          // 优先级1: web_url (无水印，有音频)
          if (gif.urls.web_url) {
            downloads.push({
              type: 'video',
              url: gif.urls.web_url,
              filename: `${gif.id}_web.mp4`,
              quality: 'WEB-NoWatermark',
              priority: 5,
              size: null
            });
          }
          
          // 优先级2: embed_url (无水印，有音频)
          if (gif.urls.embed_url) {
            downloads.push({
              type: 'video',
              url: gif.urls.embed_url,
              filename: `${gif.id}_embed.mp4`,
              quality: 'EMBED-NoWatermark',
              priority: 4,
              size: null
            });
          }
          
          // 优先级3: file_url (原始文件)
          if (gif.urls.file_url) {
            downloads.push({
              type: 'video',
              url: gif.urls.file_url,
              filename: `${gif.id}_file.mp4`,
              quality: 'FILE-Original',
              priority: 3,
              size: null
            });
          }
          
          // 备选: HD和SD (可能有水印)
          if (gif.urls.hd) {
            downloads.push({
              type: 'video',
              url: gif.urls.hd,
              filename: `${gif.id}_hd.mp4`,
              quality: 'HD',
              priority: 2,
              size: null
            });
          }
          
          if (gif.urls.sd) {
            downloads.push({
              type: 'video',
              url: gif.urls.sd,
              filename: `${gif.id}_sd.mp4`,
              quality: 'SD',
              priority: 1,
              size: null
            });
          }
        }
        
        if (gif.urls && (gif.urls.poster || gif.urls.thumb)) {
          downloads.push({
            type: 'cover',
            url: gif.urls.poster || gif.urls.thumb,
            filename: `${gif.id}_cover.jpg`,
            quality: 'Standard',
            size: null
          });
        }
        
        // Add thumb for preview if available
        if (gif.urls && gif.urls.thumb) {
          downloads.push({
            type: 'thumb',
            url: gif.urls.thumb,
            filename: `${gif.id}_thumb.jpg`,
            quality: 'Thumbnail',
            size: null
          });
        }

        if (downloads.length === 0) {
          return new Response(JSON.stringify({ 
            error: 'No downloadable content found. The video URLs may be invalid or inaccessible.' 
          }), {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }

        const debugInfo = {
          version: '2.7.0',
          timestamp: Date.now(),
          logicType: 'api-with-scraping-fallback',
          hasAudio: gif.hasAudio || false,
          audioStatus: gif.hasAudio ? 'HAS_AUDIO' : 'NO_AUDIO',
          availableUrlTypes: Object.keys(gif.urls || {}),
          tokenStatus: token ? 'AVAILABLE' : 'MISSING',
          rawApiResponse: {
            id: gif.id,
            hasAudio: gif.hasAudio,
            duration: gif.duration,
            width: gif.width,
            height: gif.height,
            urls: Object.keys(gif.urls || {})
          },
          urlProcessing: downloads.map(d => ({
            type: d.type,
            quality: d.quality,
            priority: d.priority || 0,
            isM4s: d.url && d.url.includes('.m4s'),
            hasSignature: d.url && d.url.includes('?'),
            urlPattern: d.url ? d.url.substring(0, 50) + '...' : 'N/A'
          }))
        };

        return new Response(JSON.stringify({
          success: true,
          videoId: gif.id,
          title: gif.title,
          duration: gif.duration || 30,
          views: gif.views || 0,
          likes: gif.likes || 0,
          hasAudio: gif.hasAudio || false,
          downloads: downloads,
          debug: debugInfo
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
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
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // 使用成功项目的正则表达式 - 直接提取真实的API文件URL
    const CONTENT_RE = /https:\/\/api\.redgifs\.com\/v2\/gifs\/[\w-]+\/files\/[\w-]+\.mp4/g;
    const match = html.match(CONTENT_RE);
    
    if (match && match[0]) {
      const videoUrl = match[0];
      
      // 尝试提取封面图
      const posterPatterns = [
        /https:\/\/[\w.-]+\.redgifs\.com\/[\w\/-]+-poster\.jpg/g,
        /https:\/\/[\w.-]+\.redgifs\.com\/[\w\/-]+\.jpg/g
      ];
      
      let posterUrl = null;
      for (const pattern of posterPatterns) {
        const posterMatch = html.match(pattern);
        if (posterMatch && posterMatch[0]) {
          posterUrl = posterMatch[0];
          break;
        }
      }
      
      return {
        videoUrl: videoUrl,
        posterUrl: posterUrl
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

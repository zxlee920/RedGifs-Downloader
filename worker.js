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
        
        // 优先使用无水印有声音的视频源
        let primaryVideoUrl = null;
        let primaryVideoQuality = 'SD';
        
        // 根据RedGifs官方文档选择最佳视频源
        if (gif.urls) {
          // 1. 优先使用embed_url - 官方推荐的无限制加载方式
          if (gif.urls.embed_url) {
            primaryVideoUrl = gif.urls.embed_url;
            primaryVideoQuality = 'Embed';
          }
          // 2. 使用file_url - 直接文件链接
          else if (gif.urls.file_url) {
            primaryVideoUrl = gif.urls.file_url;
            primaryVideoQuality = 'File';
          }
          // 3. web_url - 网站URL（无水印）
          else if (gif.urls.web_url) {
            primaryVideoUrl = gif.urls.web_url;
            primaryVideoQuality = 'Web';
          }
          // 4. HD质量（可能有水印但质量好）
          else if (gif.urls.hd) {
            primaryVideoUrl = gif.urls.hd;
            primaryVideoQuality = 'HD';
          }
          // 5. SD质量作为备选
          else if (gif.urls.sd) {
            primaryVideoUrl = gif.urls.sd;
            primaryVideoQuality = 'SD';
          }
        }
        
        if (primaryVideoUrl) {
          downloads.push({
            type: 'video',
            url: primaryVideoUrl,
            filename: `${gif.id}_video.mp4`,
            quality: primaryVideoQuality,
            size: null
          });
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
        'Referer': 'https://redgifs.com/',
      }
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Try multiple patterns to extract video URLs
    const videoPatterns = [
      // HD video URLs
      /"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      // Alternative video patterns
      /'(https:\/\/[^']*\.mp4[^']*)'/g,
      // JSON embedded video URLs
      /"videoUrl"\s*:\s*"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      /"hd"\s*:\s*"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      /"sd"\s*:\s*"(https:\/\/[^"]*\.mp4[^"]*)"/g,
      // Direct file URLs
      /https:\/\/[\w.-]+\.redgifs\.com\/[\w\/-]+\.mp4/g
    ];
    
    const posterPatterns = [
      /"(https:\/\/[^"]*poster[^"]*\.(jpg|jpeg|png)[^"]*)"/g,
      /"(https:\/\/[^"]*thumb[^"]*\.(jpg|jpeg|png)[^"]*)"/g,
      /"posterUrl"\s*:\s*"(https:\/\/[^"]*\.(jpg|jpeg|png)[^"]*)"/g
    ];

    let videoUrl = null;
    let posterUrl = null;

    // Try to find video URL
    for (const pattern of videoPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url && url.includes('.mp4') && !url.includes('poster') && !url.includes('thumb')) {
          videoUrl = url;
          break;
        }
      }
      if (videoUrl) break;
    }

    // Try to find poster URL
    for (const pattern of posterPatterns) {
      const matches = html.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        if (url && (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png'))) {
          posterUrl = url;
          break;
        }
      }
      if (posterUrl) break;
    }

    if (videoUrl) {
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

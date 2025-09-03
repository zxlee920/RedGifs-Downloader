export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
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
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to download file' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle static file requests
    if (request.method === 'GET') {
      try {
        // Try to serve static files from the built Next.js app
        const staticResponse = await env.ASSETS.fetch(request);
        if (staticResponse.status !== 404) {
          return staticResponse;
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
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
    }

    // Only handle POST requests for download
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    try {
      const { url } = await request.json();

      if (!url || !url.includes('redgifs.com')) {
        return new Response(JSON.stringify({ error: 'Invalid RedGifs URL' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
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
        const match = url.match(pattern);
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
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Try to scrape RedGifs page first
      const scrapedData = await scrapeRedGifsPage(url, videoId);
      
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
            'Access-Control-Allow-Origin': '*',
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
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      const gif = data.gif;

      // Prepare download links
      const downloads = [];
      
      if (gif.urls && (gif.urls.hd || gif.urls.sd)) {
        downloads.push({
          type: 'video',
          url: gif.urls.hd || gif.urls.sd,
          filename: `${gif.id}_video.mp4`,
          quality: gif.urls.hd ? 'HD' : 'SD',
          size: null
        });
      }
      
      if (gif.urls && gif.urls.poster) {
        downloads.push({
          type: 'cover',
          url: gif.urls.poster,
          filename: `${gif.id}_cover.jpg`,
          quality: 'Standard',
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
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        videoId: gif.id,
        title: `RedGifs Video ${gif.id}`,
        duration: gif.duration || 30,
        views: gif.views || 0,
        likes: gif.likes || 0,
        hasAudio: gif.hasAudio || false,
        downloads: downloads
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error. Please try again later.' 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
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

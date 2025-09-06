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

    // Debug endpoint for checking URL types
    if (request.method === 'GET' && url.pathname === '/debug-urls') {
      const videoId = url.searchParams.get('id');
      if (!videoId) {
        return new Response(JSON.stringify({ error: 'Missing video ID' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      try {
        const token = await getAuthToken();
        const apiUrl = `https://api.redgifs.com/v2/gifs/${videoId}`;
        
        const headers = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://redgifs.com/',
          'Origin': 'https://redgifs.com'
        };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(apiUrl, { headers });
        
        if (response.ok) {
          const data = await response.json();
          const gif = data.gif;
          
          return new Response(JSON.stringify({
            videoId: gif.id,
            hasAudio: gif.hasAudio,
            availableUrls: Object.keys(gif.urls || {}),
            urlDetails: gif.urls,
            recommendations: {
              bestForAudio: gif.urls.web_url || gif.urls.file_url || (gif.hasAudio ? gif.urls.hd : null),
              noWatermark: gif.urls.web_url || gif.urls.file_url || gif.urls.embed_url,
              currentChoice: gif.urls.web_url || gif.urls.file_url || gif.urls.hd || gif.urls.sd
            }
          }, null, 2), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } else {
          return new Response(JSON.stringify({ 
            error: 'API request failed', 
            status: response.status 
          }), {
            status: response.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Debug request failed', 
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Handle POST requests for download API - PRIORITY HANDLING
    if (request.method === 'POST' && (url.pathname === '/api' || url.pathname === '/')) {
      console.log('POST request received at:', url.pathname);
      try {
        const body = await request.text();
        console.log('Request body:', body);
        
        if (!body) {
          return new Response(JSON.stringify({ error: 'Empty request body' }), {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          });
        }
        
        const data = JSON.parse(body);
        const { url: videoUrl } = data;
        
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

        // Try to scrape RedGifs page first for optimal URLs
        const scrapedData = await scrapeRedGifsPage(videoUrl, videoId);
        
        if (scrapedData && scrapedData.videoUrl) {
          const downloads = [];
          
          // Add the primary scraped video (optimized for audio + no watermark)
          downloads.push({
            type: 'video',
            url: scrapedData.videoUrl,
            filename: `${videoId}_optimized.mp4`,
            quality: 'Optimized HD',
            hasAudio: scrapedData.hasAudio,
            watermark: false,
            preferred: true,
            size: null
          });

          // Add additional URL variants for backup
          if (scrapedData.alternativeUrls && scrapedData.alternativeUrls.length > 0) {
            scrapedData.alternativeUrls.forEach((altUrl, index) => {
              downloads.push({
                type: 'video',
                url: altUrl.url,
                filename: `${videoId}_alt_${index + 1}.mp4`,
                quality: altUrl.quality || `Alt ${index + 1}`,
                hasAudio: altUrl.hasAudio,
                watermark: altUrl.watermark || false,
                size: null
              });
            });
          }
          
          if (scrapedData.posterUrl) {
            downloads.push({
              type: 'cover',
              url: scrapedData.posterUrl,
              filename: `${videoId}_cover.jpg`,
              quality: 'Poster',
              size: null
            });
          }

          console.log('Enhanced scraped data result:', { 
            hasAudio: scrapedData.hasAudio, 
            primaryUrl: scrapedData.videoUrl.substring(0, 50) + '...',
            alternatives: scrapedData.alternativeUrls?.length || 0
          });

          return new Response(JSON.stringify({
            success: true,
            videoId: videoId,
            title: `RedGifs Video ${videoId}`,
            duration: 30,
            views: 0,
            likes: 0,
            hasAudio: scrapedData.hasAudio,
            downloads: downloads,
            note: `Enhanced extraction with ${downloads.length} download options - Audio: ${scrapedData.hasAudio ? 'Yes' : 'No'}, Watermark: No`
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
        
        let apiResponse = null;
        let apiData = null;
        
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
            
            apiResponse = await fetch(apiUrl, { headers });
            
            if (apiResponse.ok) {
              apiData = await apiResponse.json();
              break;
            }
          } catch (error) {
            continue;
          }
        }

        // Check if we have valid API data
        if (!apiResponse?.ok || !apiData || !apiData.gif) {
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

        const gif = apiData.gif;
        console.log('Complete GIF data:', JSON.stringify(gif, null, 2));

        // Enhanced multi-strategy audio URL acquisition
        const downloads = [];
        
        // Strategy 1: Prioritize embed_url and web_url (no watermark, with audio)
        const priorityUrls = [];
        if (gif.urls) {
          console.log('Available URLs:', Object.keys(gif.urls));
          
          // Highest priority: embed_url (unrestricted access, no watermark)
          if (gif.urls.embed_url) {
            priorityUrls.push({
              url: gif.urls.embed_url,
              quality: 'Embed (No Watermark)',
              hasAudio: gif.hasAudio !== false,
              watermark: false,
              preferred: true
            });
          }
          
          // Second priority: web_url (website quality)
          if (gif.urls.web_url) {
            priorityUrls.push({
              url: gif.urls.web_url,
              quality: 'Web (Original)',
              hasAudio: gif.hasAudio !== false,
              watermark: false,
              preferred: !gif.urls.embed_url
            });
          }
          
          // Third priority: file_url (direct file access)
          if (gif.urls.file_url) {
            priorityUrls.push({
              url: gif.urls.file_url,
              quality: 'Direct File',
              hasAudio: gif.hasAudio !== false,
              watermark: false,
              preferred: !gif.urls.embed_url && !gif.urls.web_url
            });
          }
        }
        
        priorityUrls.forEach((urlObj, index) => {
          downloads.push({
            type: 'video',
            url: urlObj.url,
            filename: `${gif.id}_priority_${index + 1}.mp4`,
            quality: urlObj.quality,
            hasAudio: urlObj.hasAudio,
            watermark: urlObj.watermark,
            preferred: urlObj.preferred,
            size: null
          });
        });
        
        // Strategy 2: Direct files.redgifs.com URLs (original files, no watermark)
        const directUrls = [
          `https://files.redgifs.com/${gif.id}.mp4`,
          `https://files.redgifs.com/${gif.id}-original.mp4`,
          `https://files.redgifs.com/${gif.id}-hd.mp4`,
          `https://files.redgifs.com/${gif.id}-source.mp4`
        ];
        
        directUrls.forEach((url, index) => {
          downloads.push({
            type: 'video',
            url: url,
            filename: `${gif.id}_direct_${index + 1}.mp4`,
            quality: `Direct ${['Original', 'Original Alt', 'HD', 'Source'][index]}`,
            hasAudio: true,
            watermark: false,
            preferred: priorityUrls.length === 0 && index === 0,
            size: null
          });
        });
        
        // Strategy 3: API provided URLs (with watermark assessment)
        if (gif.urls) {
          Object.entries(gif.urls).forEach(([key, url]) => {
            if (url && typeof url === 'string' && url.includes('.mp4') && 
                !['embed_url', 'web_url', 'file_url'].includes(key)) {
              const hasWatermark = key.includes('hd') || key.includes('sd') || key.includes('mobile');
              downloads.push({
                type: 'video',
                url: url,
                filename: `${gif.id}_api_${key}.mp4`,
                quality: `API ${key.toUpperCase()}`,
                hasAudio: gif.hasAudio !== false,
                watermark: hasWatermark,
                preferred: false,
                size: null
              });
            }
          });
        }
        
        // Strategy 4: Alternative domain URLs (backup)
        const altDomainUrls = [
          `https://thumbs4.redgifs.com/${gif.id.charAt(0).toUpperCase()}${gif.id.slice(1)}-source.mp4`,
          `https://thumbs3.redgifs.com/${gif.id.charAt(0).toUpperCase()}${gif.id.slice(1)}-original.mp4`,
          `https://thumbs2.redgifs.com/${gif.id.charAt(0).toUpperCase()}${gif.id.slice(1)}-large.mp4`
        ];
        
        altDomainUrls.forEach((url, index) => {
          downloads.push({
            type: 'video',
            url: url,
            filename: `${gif.id}_alt_domain_${index + 1}.mp4`,
            quality: `Alt ${['Source', 'Original', 'Large'][index]}`,
            hasAudio: true,
            watermark: false,
            preferred: false,
            size: null
          });
        });
        
        // Add poster/thumbnail
        if (gif.urls && gif.urls.poster) {
          downloads.push({
            type: 'cover',
            url: gif.urls.poster,
            filename: `${gif.id}_poster.jpg`,
            quality: 'Poster',
            size: null
          });
        } else if (gif.urls && gif.urls.thumbnail) {
          downloads.push({
            type: 'cover',
            url: gif.urls.thumbnail,
            filename: `${gif.id}_thumbnail.jpg`,
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

        // Strategy 5: Separate audio files (if video and audio are split)
        if (gif.hasAudio) {
          const audioUrls = [
            `https://files.redgifs.com/${gif.id}.m4a`,
            `https://files.redgifs.com/${gif.id}-audio.m4a`,
            `https://files.redgifs.com/${gif.id}.aac`,
            `https://files.redgifs.com/${gif.id}-audio.aac`
          ];
          
          audioUrls.forEach((url, index) => {
            downloads.push({
              type: 'audio',
              url: url,
              filename: `${gif.id}_audio_${index + 1}.${url.endsWith('.aac') ? 'aac' : 'm4a'}`,
              quality: `Audio ${['Original', 'Alt', 'AAC Original', 'AAC Alt'][index]}`,
              hasAudio: true,
              watermark: false,
              preferred: false,
              size: null
            });
          });
        }

        // Sort downloads by preference (preferred first, no watermark prioritized)
        downloads.sort((a, b) => {
          if (a.preferred && !b.preferred) return -1;
          if (!a.preferred && b.preferred) return 1;
          if (!a.watermark && b.watermark) return -1;
          if (a.watermark && !b.watermark) return 1;
          return 0;
        });

        return new Response(JSON.stringify({
          success: true,
          videoId: gif.id,
          title: gif.title || `RedGifs ${gif.id}`,
          duration: gif.duration || 30,
          views: gif.views || 0,
          likes: gif.likes || 0,
          hasAudio: gif.hasAudio !== false,
          downloads: downloads,
          note: `🎵 Enhanced extraction providing ${downloads.length} optimized download options. Priority: No watermark + Audio support. ${downloads.filter(d => d.preferred).length} preferred option(s) available.`
        }), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });

      } catch (error) {
        console.error('POST request error:', error);
        return new Response(JSON.stringify({ 
          error: 'Internal server error. Please try again later.',
          details: error.message 
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
    console.log('Scraping HTML for video:', videoId);
    
    // Look for JSON data in script tags (more reliable)
    const jsonMatch = html.match(/<script[^>]*>.*?window\.__INITIAL_STATE__\s*=\s*({.*?});/s);
    if (jsonMatch) {
      try {
        const jsonData = JSON.parse(jsonMatch[1]);
        const gif = jsonData?.gif?.gif;
        if (gif && gif.urls) {
          console.log('Found JSON data:', { 
            hasAudio: gif.hasAudio, 
            availableUrls: Object.keys(gif.urls),
            urls: gif.urls 
          });
          
          // Enhanced priority order for optimal video URLs (no watermark + audio):
          // 1. embed_url (unrestricted, no watermark)
          // 2. web_url (website quality, no watermark)
          // 3. file_url (direct file access)
          // 4. Custom constructed URLs from files.redgifs.com
          // 5. hd/sd as last resort
          
          let videoUrl = null;
          let hasAudio = gif.hasAudio !== false; // Default to true unless explicitly false
          const alternativeUrls = [];
          
          // Primary URL selection
          if (gif.urls.embed_url) {
            videoUrl = gif.urls.embed_url;
            console.log('Using embed_url (unrestricted, no watermark)');
          } else if (gif.urls.web_url) {
            videoUrl = gif.urls.web_url;
            console.log('Using web_url (website quality, no watermark)');
          } else if (gif.urls.file_url) {
            videoUrl = gif.urls.file_url;
            console.log('Using file_url (direct access)');
          } else {
            // Construct optimal URL from files.redgifs.com domain
            const fileId = gif.id || videoId;
            const constructedUrls = [
              `https://files.redgifs.com/${fileId}.mp4`,
              `https://files.redgifs.com/${fileId}-original.mp4`,
              `https://files.redgifs.com/${fileId}-source.mp4`,
              `https://files.redgifs.com/${fileId}-hd.mp4`
            ];
            videoUrl = constructedUrls[0];
            console.log('Using constructed files.redgifs.com URL (original)');
            
            // Add other constructed URLs as alternatives
            constructedUrls.slice(1).forEach((url, index) => {
              alternativeUrls.push({
                url: url,
                quality: ['Original Alt', 'Source', 'HD'][index],
                hasAudio: true,
                watermark: false
              });
            });
          }
          
          // Add API URLs as alternatives
          ['web_url', 'file_url', 'embed_url'].forEach(urlType => {
            if (gif.urls[urlType] && gif.urls[urlType] !== videoUrl) {
              alternativeUrls.push({
                url: gif.urls[urlType],
                quality: urlType.replace('_url', '').toUpperCase(),
                hasAudio: hasAudio,
                watermark: false
              });
            }
          });
          
          // Add hd/sd as last resort alternatives
          if (gif.urls.hd && gif.urls.hd !== videoUrl) {
            alternativeUrls.push({
              url: gif.urls.hd,
              quality: 'HD (may have watermark)',
              hasAudio: hasAudio,
              watermark: true
            });
          }
          
          if (gif.urls.sd && gif.urls.sd !== videoUrl) {
            alternativeUrls.push({
              url: gif.urls.sd,
              quality: 'SD (may have watermark)',
              hasAudio: hasAudio,
              watermark: true
            });
          }
          
          return {
            videoUrl: videoUrl,
            posterUrl: gif.urls.poster || gif.urls.thumbnail,
            hasAudio: hasAudio,
            alternativeUrls: alternativeUrls
          };
        }
      } catch (e) {
        console.log('Failed to parse JSON data:', e.message);
      }
    }
    
    // Fallback: Extract video URL from HTML using regex
    // Look for HD URLs first (more likely to have audio)
    const hdUrlMatch = html.match(/"(https:\/\/[^"]*-hd\.mp4[^"]*)"/);
    const sdUrlMatch = html.match(/"(https:\/\/[^"]*-sd\.mp4[^"]*)"/);
    const videoUrlMatch = html.match(/"(https:\/\/[^"]*\.mp4[^"]*)"/);
    const posterMatch = html.match(/"(https:\/\/[^"]*(?:poster|thumbnail)[^"]*\.jpg[^"]*)"/);

    // Check for hasAudio indicator in HTML
    const hasAudioMatch = html.match(/hasAudio["\s]*:\s*(true|false)/i);
    const hasAudio = hasAudioMatch ? hasAudioMatch[1].toLowerCase() === 'true' : true; // Default to true

    const finalVideoUrl = hdUrlMatch?.[1] || sdUrlMatch?.[1] || videoUrlMatch?.[1];
    
    if (finalVideoUrl) {
      console.log('Scraped video URL:', finalVideoUrl, 'hasAudio:', hasAudio);
      return {
        videoUrl: finalVideoUrl,
        posterUrl: posterMatch ? posterMatch[1] : null,
        hasAudio: hasAudio
      };
    }

    return null;
  } catch (error) {
    console.log('Scraping error:', error.message);
    return null;
  }
}
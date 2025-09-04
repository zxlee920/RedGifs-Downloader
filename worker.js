export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };
    
    // Handle OPTIONS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Debug endpoint - 增强版
    if (url.pathname === '/debug') {
      const headers = {};
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      return new Response(JSON.stringify({
        method: request.method,
        url: request.url,
        headers: headers,
        cf: request.cf,
        timestamp: new Date().toISOString(),
        api_status: {
          token: redgifsAPI.token ? 'exists' : 'none',
          token_expiry: redgifsAPI.tokenExpiry ? new Date(redgifsAPI.tokenExpiry).toISOString() : 'none'
        }
      }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Main download endpoint
    if (request.method === 'POST' && (url.pathname === '/' || url.pathname === '/api/download')) {
      try {
        const { url: videoUrl } = await request.json();
        
        if (!videoUrl || !videoUrl.includes('redgifs.com')) {
          return new Response(JSON.stringify({ error: 'Invalid RedGifs URL' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // Extract video ID
        const videoId = extractVideoId(videoUrl);
        if (!videoId) {
          return new Response(JSON.stringify({ 
            error: 'Could not extract video ID from URL' 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        console.log('Processing video:', videoId);
        
        // 尝试新API方法
        const result = await redgifsAPI.getVideoInfo(videoId);
        
        if (result && result.success) {
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // 备用方案：直接构建URL
        const fallbackResult = buildDirectUrls(videoId);
        return new Response(JSON.stringify(fallbackResult), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
        
      } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to process video',
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Proxy download - 增强错误处理
    if (url.pathname === '/proxy-download') {
      const fileUrl = url.searchParams.get('url');
      const filename = url.searchParams.get('filename') || 'video.mp4';
      
      console.log('Proxy download request:', { fileUrl, filename });
      
      if (!fileUrl) {
        return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      try {
        // 验证URL格式
        let targetUrl;
        try {
          targetUrl = new URL(fileUrl);
        } catch (urlError) {
          console.error('Invalid URL format:', fileUrl);
          return new Response(JSON.stringify({ 
            error: 'Invalid URL format',
            details: urlError.message 
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // 基础请求头
        const baseHeaders = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache'
        };
        
        // 根据域名设置不同的请求头
        if (targetUrl.hostname.includes('redgifs.com')) {
          baseHeaders['Referer'] = 'https://redgifs.com/';
          baseHeaders['Origin'] = 'https://redgifs.com';
          
          // 如果是API域名且有token，添加认证
          if (redgifsAPI.token && targetUrl.hostname.includes('api.redgifs.com')) {
            baseHeaders['Authorization'] = `Bearer ${redgifsAPI.token}`;
          }
        }
        
        // 支持Range请求
        const rangeHeader = request.headers.get('Range');
        if (rangeHeader) {
          baseHeaders['Range'] = rangeHeader;
        }
        
        console.log('Fetching URL:', fileUrl, 'with headers:', Object.keys(baseHeaders));
        
        const response = await fetch(fileUrl, { 
          headers: baseHeaders,
          cf: {
            // Cloudflare特定选项
            cacheTtl: 300,
            cacheEverything: false
          }
        });
        
        console.log('Response status:', response.status, 'headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          // 尝试简化的请求头重试
          console.log('First attempt failed, retrying with minimal headers...');
          const retryResponse = await fetch(fileUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': '*/*'
            }
          });
          
          if (retryResponse.ok) {
            console.log('Retry successful');
            const responseHeaders = {
              'Content-Type': retryResponse.headers.get('Content-Type') || 'video/mp4',
              'Content-Disposition': `attachment; filename="${filename}"`,
              ...corsHeaders
            };
            
            // 复制重要的响应头
            ['Content-Length', 'Content-Range', 'Accept-Ranges'].forEach(header => {
              const value = retryResponse.headers.get(header);
              if (value) responseHeaders[header] = value;
            });
            
            return new Response(retryResponse.body, {
              status: retryResponse.status,
              headers: responseHeaders
            });
          }
          
          console.error('Both attempts failed:', response.status, retryResponse.status);
          return new Response(JSON.stringify({ 
            error: 'File not accessible',
            details: `HTTP ${response.status}: ${response.statusText}`,
            url: fileUrl
          }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        
        // 成功响应
        const responseHeaders = {
          'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
          'Content-Disposition': `attachment; filename="${filename}"`,
          ...corsHeaders
        };
        
        // 复制重要的响应头
        ['Content-Length', 'Content-Range', 'Accept-Ranges', 'Last-Modified', 'ETag'].forEach(header => {
          const value = response.headers.get(header);
          if (value) responseHeaders[header] = value;
        });
        
        console.log('Proxy download successful');
        return new Response(response.body, {
          status: response.status,
          headers: responseHeaders
        });
        
      } catch (error) {
        console.error('Proxy download error:', error);
        return new Response(JSON.stringify({ 
          error: 'Proxy download failed',
          details: error.message,
          stack: error.stack,
          url: fileUrl
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }
    
    // Default response
    return new Response(JSON.stringify({ 
      message: 'RedGifs Downloader API',
      endpoints: {
        'POST /': 'Download video - {url: "redgifs_url"}',
        'GET /proxy-download': 'Proxy download - ?url=...&filename=...',
        'GET /debug': 'Debug info'
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};

// 提取视频ID
function extractVideoId(url) {
  const patterns = [
    /redgifs\.com\/watch\/([a-zA-Z0-9]+)/i,
    /redgifs\.com\/ifr\/([a-zA-Z0-9]+)/i,
    /i\.redgifs\.com\/i\/([a-zA-Z0-9]+)/i,
    /redgifs\.com\/([a-zA-Z0-9]+)$/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

// 直接构建URLs（备用方案）
function buildDirectUrls(videoId) {
  const id = videoId.toLowerCase();
  
  const downloads = [];
  
  // 尝试多种URL格式
  const urlFormats = [
    // 新格式 - 通常更可靠
    `https://files.redgifs.com/${id}-hd.mp4`,
    `https://files.redgifs.com/${id}-sd.mp4`,
    `https://files.redgifs.com/${id}-mobile.mp4`,
    // 旧格式 - 备用
    `https://thumbs4.redgifs.com/${id.charAt(0).toUpperCase()}${id.slice(1)}-large.mp4`,
    `https://thumbs3.redgifs.com/${id.charAt(0).toUpperCase()}${id.slice(1)}-large.mp4`,
    // 更多备用格式
    `https://redgifs.com/ifr/${id}`,
    `https://api.redgifs.com/v2/gifs/${id}/files/hd.mp4`
  ];
  
  // HD版本
  downloads.push({
    type: 'video',
    url: `https://files.redgifs.com/${id}-hd.mp4`,
    filename: `${id}_hd.mp4`,
    quality: 'HD 1080p',
    hasAudio: true,
    preferred: true
  });
  
  // SD版本
  downloads.push({
    type: 'video',
    url: `https://files.redgifs.com/${id}-sd.mp4`,
    filename: `${id}_sd.mp4`,
    quality: 'SD 720p',
    hasAudio: true
  });
  
  // Mobile版本
  downloads.push({
    type: 'video',
    url: `https://files.redgifs.com/${id}-mobile.mp4`,
    filename: `${id}_mobile.mp4`,
    quality: 'Mobile 480p',
    hasAudio: true
  });
  
  // 备用URL格式
  downloads.push({
    type: 'video',
    url: `https://thumbs4.redgifs.com/${id.charAt(0).toUpperCase()}${id.slice(1)}-large.mp4`,
    filename: `${id}_backup_hd.mp4`,
    quality: 'HD (Backup)',
    hasAudio: true
  });
  
  // 封面图
  downloads.push({
    type: 'cover',
    url: `https://files.redgifs.com/${id}-poster.jpg`,
    filename: `${id}_poster.jpg`,
    quality: 'Poster'
  });
  
  return {
    success: true,
    videoId: id,
    title: `RedGifs Video ${id}`,
    duration: 0,
    views: 0,
    likes: 0,
    hasAudio: true,
    downloads: downloads,
    note: 'Multiple URL formats - Try different options if one fails'
  };
}

// 优化的RedGifs API类
class RedGifsAPI {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.baseURL = 'https://api.redgifs.com';
  }
  
  async getToken() {
    try {
      // 检查现有token
      if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.token;
      }
      
      // 获取新token - 使用v2 API
      const response = await fetch(`${this.baseURL}/v2/auth/temporary`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://redgifs.com',
          'Referer': 'https://redgifs.com/'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.tokenExpiry = Date.now() + (30 * 60 * 1000); // 30分钟
        console.log('Got new token');
        return this.token;
      }
      
      console.error('Failed to get token:', response.status);
      return null;
    } catch (error) {
      console.error('Token error:', error);
      return null;
    }
  }
  
  async getVideoInfo(videoId) {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log('No token, using fallback');
        return null;
      }
      
      // 使用v2 API获取视频信息
      const response = await fetch(`${this.baseURL}/v2/gifs/${videoId.toLowerCase()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Origin': 'https://redgifs.com',
          'Referer': 'https://redgifs.com/'
        }
      });
      
      if (!response.ok) {
        console.error('API request failed:', response.status);
        return null;
      }
      
      const data = await response.json();
      const gif = data.gif || data;
      
      if (!gif || !gif.urls) {
        console.error('Invalid API response');
        return null;
      }
      
      // 处理URLs - 优先无水印版本
      const downloads = [];
      const urls = gif.urls;
      
      // HD版本 - 最高质量，无水印，有声音
      if (urls.hd) {
        downloads.push({
          type: 'video',
          url: urls.hd,
          filename: `${gif.id}_hd.mp4`,
          quality: 'HD 1080p (No Watermark)',
          hasAudio: true,
          watermark: false,
          preferred: true
        });
      }
      
      // SD版本
      if (urls.sd) {
        downloads.push({
          type: 'video', 
          url: urls.sd,
          filename: `${gif.id}_sd.mp4`,
          quality: 'SD 720p',
          hasAudio: true,
          watermark: false
        });
      }
      
      // Mobile版本
      if (urls.mobile) {
        downloads.push({
          type: 'video',
          url: urls.mobile,
          filename: `${gif.id}_mobile.mp4`,
          quality: 'Mobile 480p',
          hasAudio: true,
          watermark: false
        });
      }
      
      // 避免使用poster_url和vthumbnail（通常无声音）
      // 避免使用embed（有水印）
      
      // 添加封面
      if (urls.poster) {
        downloads.push({
          type: 'cover',
          url: urls.poster,
          filename: `${gif.id}_poster.jpg`,
          quality: 'Poster'
        });
      }
      
      return {
        success: true,
        videoId: gif.id,
        title: gif.title || `RedGifs ${gif.id}`,
        duration: gif.duration || 0,
        views: gif.views || 0,
        likes: gif.likes || 0,
        hasAudio: gif.hasAudio !== false,
        width: gif.width,
        height: gif.height,
        downloads: downloads,
        note: downloads.length > 0 ? 'High quality version with audio' : 'Limited quality available'
      };
      
    } catch (error) {
      console.error('API error:', error);
      return null;
    }
  }
}

// 创建全局实例
const redgifsAPI = new RedGifsAPI();
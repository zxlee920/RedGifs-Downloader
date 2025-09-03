// 分析工具统一配置
export const analyticsConfig = {
  // Google Analytics配置
  googleAnalytics: {
    id: 'G-YM0P7YDGWF',
    enabled: true,
  },
  
  // Microsoft Clarity配置
  microsoftClarity: {
    id: 't4znm2y5db',
    enabled: true,
  },
  
  // Microsoft Webmaster Tool验证
  microsoftWebmaster: {
    verificationCode: '69D16751CFC6C5AE084CDA799DD24432',
    enabled: true,
  },
  
  // 生产环境检查函数
  isProduction: () => {
    return process.env.NODE_ENV === 'production'
  },
  
  // 是否启用分析工具（只在生产环境启用）
  shouldLoadAnalytics: () => {
    return analyticsConfig.isProduction()
  }
}

// Google Analytics脚本
export const getGoogleAnalyticsScript = () => {
  if (!analyticsConfig.googleAnalytics.enabled || !analyticsConfig.shouldLoadAnalytics()) {
    return null
  }
  
  return {
    src: `https://www.googletagmanager.com/gtag/js?id=${analyticsConfig.googleAnalytics.id}`,
    innerHTML: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${analyticsConfig.googleAnalytics.id}');
    `
  }
}

// Microsoft Clarity脚本
export const getMicrosoftClarityScript = () => {
  if (!analyticsConfig.microsoftClarity.enabled || !analyticsConfig.shouldLoadAnalytics()) {
    return null
  }
  
  return `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "${analyticsConfig.microsoftClarity.id}");
  `
}

// Microsoft Webmaster Tool元标签
export const getMicrosoftWebmasterMeta = () => {
  if (!analyticsConfig.microsoftWebmaster.enabled) {
    return null
  }
  
  return {
    name: 'msvalidate.01',
    content: analyticsConfig.microsoftWebmaster.verificationCode
  }
}

// 导出类型定义
export type AnalyticsConfig = typeof analyticsConfig

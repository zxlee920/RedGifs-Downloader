'use client'

import { useEffect } from 'react'

export default function Analytics() {
  useEffect(() => {
    // Google Analytics
    const gaScript = document.createElement('script')
    gaScript.async = true
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=G-MXQBHQHXRK'
    document.head.appendChild(gaScript)

    const gaConfigScript = document.createElement('script')
    gaConfigScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-MXQBHQHXRK');
    `
    document.head.appendChild(gaConfigScript)

    // Microsoft Clarity
    const clarityScript = document.createElement('script')
    clarityScript.innerHTML = `
      (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "t4znm2y5db");
    `
    document.head.appendChild(clarityScript)
  }, [])

  return null
}

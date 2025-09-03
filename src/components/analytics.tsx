'use client'

import Script from 'next/script'

export default function Analytics() {
  return (
    <>
      {/* Microsoft Webmaster Tool */}
      <meta name="msvalidate.01" content="69D16751CFC6C5AE084CDA799DD24432" />
      
      {/* Google Analytics */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-YM0P7YDGWF"
        strategy="beforeInteractive"
      />
      <Script id="google-analytics" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YM0P7YDGWF');
        `}
      </Script>
      
      {/* Microsoft Clarity */}
      <Script id="microsoft-clarity" strategy="beforeInteractive">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "t4znm2y5db");
        `}
      </Script>
    </>
  )
}

import Script from 'next/script';

const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();

/** Microsoft Clarity – הקלטות ומפת חום; נטען רק כשמוגדר NEXT_PUBLIC_CLARITY_PROJECT_ID */
export default function ClarityAnalytics() {
  if (!projectId) return null;

  return (
    <Script id="clarity-analytics" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}

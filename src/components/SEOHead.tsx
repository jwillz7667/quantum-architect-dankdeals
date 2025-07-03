import { Helmet } from 'react-helmet-async';
import { generateMetaTags, SEOProps } from '@/lib/seo';

interface SEOHeadProps extends SEOProps {
  structuredData?: object | object[];
}

export function SEOHead({ structuredData, ...seoProps }: SEOHeadProps) {
  const metaTags = generateMetaTags(seoProps);
  const canonicalUrl = seoProps.url || window.location.href;
  
  return (
    <Helmet>
      <title>{metaTags.title}</title>
      <meta name="description" content={metaTags.description} />
      <meta name="keywords" content={metaTags.keywords} />
      
      <link rel="canonical" href={canonicalUrl} />
      
      <meta property="og:title" content={metaTags['og:title']} />
      <meta property="og:description" content={metaTags['og:description']} />
      <meta property="og:image" content={metaTags['og:image']} />
      <meta property="og:url" content={metaTags['og:url']} />
      <meta property="og:type" content={metaTags['og:type']} />
      
      <meta name="twitter:title" content={metaTags['twitter:title']} />
      <meta name="twitter:description" content={metaTags['twitter:description']} />
      <meta name="twitter:image" content={metaTags['twitter:image']} />
      
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script
              key={index}
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
            />
          ))
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )
      )}
    </Helmet>
  );
} 
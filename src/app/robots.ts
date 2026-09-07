import type { MetadataRoute } from 'next';

import { getAppUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const appUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Signed-in surfaces and the REST proxy carry nothing worth indexing.
        disallow: ['/dashboard', '/setup', '/api'],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}

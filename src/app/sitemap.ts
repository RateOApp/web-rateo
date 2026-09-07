import type { MetadataRoute } from 'next';

import { getAppUrl } from '@/lib/env';
import { companiesServer } from '@/services/companies.server';
import { jobsServer } from '@/services/jobs.server';
import { isImportedJob } from '@/types/api';

/** How many pages of each listing to walk. Page size is 10 server-side. */
const MAX_PAGES = 5;

export const revalidate = 3600;

/**
 * `auth: false` keeps `serverFetch` out of the cookie store, so the sitemap can
 * be generated at build time, and stops the backend personalising the job feed.
 * The matching `next.revalidate` lets the whole route be prerendered with ISR
 * instead of falling back to per-request rendering.
 */
const PUBLIC = { auth: false, next: { revalidate } } as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = getAppUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${appUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${appUrl}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${appUrl}/companies`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${appUrl}/search`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${appUrl}/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${appUrl}/register`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  const [jobEntries, companyEntries] = await Promise.all([
    jobUrls(appUrl),
    companyUrls(appUrl),
  ]);

  return [...staticEntries, ...jobEntries, ...companyEntries];
}

async function jobUrls(appUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  try {
    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      const data = await jobsServer.list({ pageNumber, categories: 'all' }, PUBLIC);

      for (const job of data.jobs ?? []) {
        // Imported jobs are scraped listings with no canonical detail page.
        if (isImportedJob(job)) continue;
        entries.push({
          url: `${appUrl}/jobs/${job._id}`,
          lastModified: job.updatedAt ? new Date(job.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      }

      if (!data.pages || pageNumber >= data.pages) break;
    }
  } catch {
    // A backend outage must not fail the build - ship the static entries.
  }

  return entries;
}

async function companyUrls(appUrl: string): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  try {
    for (let pageNumber = 1; pageNumber <= MAX_PAGES; pageNumber += 1) {
      const data = await companiesServer.list({ pageNumber }, PUBLIC);

      for (const company of data.users ?? []) {
        entries.push({
          url: `${appUrl}/companies/${company._id}`,
          lastModified: company.updatedAt ? new Date(company.updatedAt) : undefined,
          changeFrequency: 'weekly',
          priority: 0.6,
        });
      }

      if (!data.pages || pageNumber >= data.pages) break;
    }
  } catch {
    // Same as above.
  }

  return entries;
}

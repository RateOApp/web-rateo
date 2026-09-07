import type { NextRequest } from 'next/server';

import { proxyRequest } from '@/lib/api/proxy';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, ctx: RouteContext): Promise<Response> {
  const { path } = await ctx.params;
  return proxyRequest(req, path);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as OPTIONS,
};

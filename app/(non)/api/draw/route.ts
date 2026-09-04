import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { JSDOM } from 'jsdom';
import { fetchPublicHtml } from '@/lib/safe-url';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get('q') ?? '';

  let title = '';
  let description = '';
  let image = '';

  try {
    if (!q) {
      return NextResponse.json({ error: 'A URL is required.' }, { status: 400 });
    }

    const { html, url: fetchedUrl } = await fetchPublicHtml(q);
    const dom = new JSDOM(html);
    const doc = dom?.window?.document;

    title = doc?.querySelector('title')?.textContent ?? '';
    description = doc?.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '';
    image = doc?.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';

    const u = fetchedUrl;
    if (['www.youtube.com', 'youtu.be'].includes(u?.host ?? '') && (!title || !description || !image)) {
      let v = '';
      switch (u?.host) {
        case 'www.youtube.com':
          v = u?.searchParams?.get('v') ?? '';
          break;
        case 'youtu.be':
          v = u?.pathname?.split('/')?.[1] ?? '';
          break;
      }

      if (v && session && process.env.GOOGLE_TOKEN) {
        const tube = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${v}&key=${process.env.GOOGLE_TOKEN}`);
        const json = await tube.json();
        const snippet = json?.items?.[0]?.snippet;

        title = snippet?.title ?? title;
        description = snippet?.description ?? description;
        image = snippet?.thumbnails?.maxres?.url 
          ?? snippet?.thumbnails?.standard?.url 
          ?? snippet?.thumbnails?.high?.url 
          ?? snippet?.thumbnails?.medium?.url 
          ?? snippet?.thumbnails?.default?.url 
          ?? image;
      }
    }
    return NextResponse.json({ title, description, image }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch bookmark metadata:', error);
    return NextResponse.json({ error: 'Unable to fetch metadata for that URL.' }, { status: 400 });
  }
}

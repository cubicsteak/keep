import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/auth";
import { JSDOM } from 'jsdom';
import { fetchPublicHtml } from '@/lib/safe-url';
import { fetchYouTubeMetadata, getYouTubeVideoId } from '@/lib/youtube';

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

    const youtubeVideoId = getYouTubeVideoId(q);
    if (youtubeVideoId && process.env.GOOGLE_TOKEN) {
      const metadata = await fetchYouTubeMetadata(youtubeVideoId, process.env.GOOGLE_TOKEN);
      return NextResponse.json(metadata, { status: 200 });
    }

    const { html } = await fetchPublicHtml(q);
    const dom = new JSDOM(html);
    const doc = dom?.window?.document;

    title = doc?.querySelector('title')?.textContent ?? '';
    description = doc?.querySelector('meta[property="og:description"]')?.getAttribute('content') ?? '';
    image = doc?.querySelector('meta[property="og:image"]')?.getAttribute('content') ?? '';

    return NextResponse.json({ title, description, image }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch bookmark metadata:', error);
    return NextResponse.json({ error: 'Unable to fetch metadata for that URL.' }, { status: 400 });
  }
}

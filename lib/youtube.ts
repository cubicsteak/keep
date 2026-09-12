const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
]);

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeVideoId(value: string) {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    return null;
  }

  let videoId: string | null = null;

  if (url.hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    if (url.pathname === '/watch') {
      videoId = url.searchParams.get('v');
    } else {
      const [route, id] = url.pathname.split('/').filter(Boolean);
      if (['shorts', 'embed', 'live'].includes(route)) videoId = id ?? null;
    }
  }

  return videoId && VIDEO_ID_PATTERN.test(videoId) ? videoId : null;
}

type YouTubeThumbnail = { url?: string };
type YouTubeSnippet = {
  title?: string;
  description?: string;
  thumbnails?: Record<string, YouTubeThumbnail>;
};

export async function fetchYouTubeMetadata(videoId: string, apiKey: string) {
  const endpoint = new URL('https://www.googleapis.com/youtube/v3/videos');
  endpoint.searchParams.set('part', 'snippet');
  endpoint.searchParams.set('id', videoId);
  endpoint.searchParams.set('key', apiKey);

  const response = await fetch(endpoint, {
    cache: 'no-store',
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}.`);
  }

  const data = await response.json() as { items?: Array<{ snippet?: YouTubeSnippet }> };
  const snippet = data.items?.[0]?.snippet;
  if (!snippet) throw new Error('YouTube video metadata was not found.');

  const thumbnails = snippet.thumbnails ?? {};
  const image = ['maxres', 'standard', 'high', 'medium', 'default']
    .map((name) => thumbnails[name]?.url)
    .find(Boolean) ?? '';

  return {
    title: snippet.title ?? '',
    description: snippet.description ?? '',
    image,
  };
}

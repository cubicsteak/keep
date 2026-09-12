import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchYouTubeMetadata, getYouTubeVideoId } from './youtube';

describe('getYouTubeVideoId', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=dQw4w9WgXcQ&t=10',
    'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',
    'https://www.youtube.com/embed/dQw4w9WgXcQ',
    'https://www.youtube.com/live/dQw4w9WgXcQ',
  ])('extracts an ID from %s', (url) => {
    expect(getYouTubeVideoId(url)).toBe('dQw4w9WgXcQ');
  });

  it.each([
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'javascript:alert(1)',
    'https://user:password@youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtube.com/watch?v=invalid',
    'not-a-url',
  ])('rejects a non-video URL %s', (url) => {
    expect(getYouTubeVideoId(url)).toBeNull();
  });
});

describe('fetchYouTubeMetadata', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns the best available thumbnail', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{
        snippet: {
          title: 'Video title',
          description: 'Description',
          thumbnails: {
            default: { url: 'https://example.com/default.jpg' },
            high: { url: 'https://example.com/high.jpg' },
          },
        },
      }],
    }), { status: 200 })));

    await expect(fetchYouTubeMetadata('dQw4w9WgXcQ', 'secret')).resolves.toEqual({
      title: 'Video title',
      description: 'Description',
      image: 'https://example.com/high.jpg',
    });
  });

  it('rejects API errors and missing videos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('', { status: 403 })));
    await expect(fetchYouTubeMetadata('dQw4w9WgXcQ', 'secret')).rejects.toThrow('403');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 })));
    await expect(fetchYouTubeMetadata('dQw4w9WgXcQ', 'secret')).rejects.toThrow('not found');
  });
});

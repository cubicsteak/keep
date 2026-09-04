import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  fetchPublicHtml: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/safe-url', () => ({ fetchPublicHtml: mocks.fetchPublicHtml }));

import { GET } from './route';

function request(query = '') {
  return new NextRequest(`http://localhost/api/draw${query ? `?q=${encodeURIComponent(query)}` : ''}`);
}

describe('/api/draw', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.fetchPublicHtml.mockResolvedValue({
      html: '<html><head><title>Example</title><meta property="og:description" content="Description"><meta property="og:image" content="https://example.com/image.png"></head></html>',
      url: new URL('https://example.com/page'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requires authentication before fetching a remote URL', async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await GET(request('https://example.com'));

    expect(response.status).toBe(401);
    expect(mocks.fetchPublicHtml).not.toHaveBeenCalled();
  });

  it('requires a URL query', async () => {
    const response = await GET(request());

    expect(response.status).toBe(400);
    expect(mocks.fetchPublicHtml).not.toHaveBeenCalled();
  });

  it('extracts bookmark metadata from HTML', async () => {
    const response = await GET(request('https://example.com/page'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      title: 'Example',
      description: 'Description',
      image: 'https://example.com/image.png',
    });
  });

  it('does not expose internal fetch errors', async () => {
    mocks.fetchPublicHtml.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.1:5432'));

    const response = await GET(request('https://example.com'));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Unable to fetch metadata for that URL.',
    });
  });

  it('uses YouTube metadata as a fallback without exposing the API key', async () => {
    const previousToken = process.env.GOOGLE_TOKEN;
    process.env.GOOGLE_TOKEN = 'server-secret';
    mocks.fetchPublicHtml.mockResolvedValue({
      html: '<html><head></head></html>',
      url: new URL('https://youtu.be/video-id'),
    });
    const youtubeFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      items: [{ snippet: { title: 'Video', description: 'Video description' } }],
    }), { headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', youtubeFetch);

    try {
      const response = await GET(request('https://youtu.be/video-id'));
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({ title: 'Video' });
      expect(youtubeFetch).toHaveBeenCalledWith(expect.stringContaining('key=server-secret'));
    } finally {
      if (previousToken === undefined) delete process.env.GOOGLE_TOKEN;
      else process.env.GOOGLE_TOKEN = previousToken;
    }
  });
});

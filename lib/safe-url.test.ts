import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPublicHtml, validatePublicHttpUrl } from './safe-url';

const mocks = vi.hoisted(() => ({ lookup: vi.fn() }));

vi.mock('node:dns/promises', () => ({ lookup: mocks.lookup }));

describe('validatePublicHttpUrl', () => {
  beforeEach(() => {
    mocks.lookup.mockImplementation(async (hostname: string) => [{
      address: hostname === 'example.com' ? '93.184.216.34' : hostname,
      family: hostname.includes(':') ? 6 : 4,
    }]);
  });

  it.each([
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://user:password@example.com',
    'https://example.com:8443',
    'http://127.0.0.1',
    'http://10.0.0.1',
    'http://169.254.169.254/latest/meta-data',
    'http://[::1]',
    'http://[fd00::1]',
  ])('rejects unsafe URL %s', async (url) => {
    await expect(validatePublicHttpUrl(url)).rejects.toThrow();
  });

  it('allows a public HTTPS URL', async () => {
    await expect(validatePublicHttpUrl('https://example.com/page')).resolves.toMatchObject({
      hostname: 'example.com',
      protocol: 'https:',
    });
  });
});

describe('fetchPublicHtml', () => {
  beforeEach(() => {
    mocks.lookup.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns small HTML responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<title>Example</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })));

    await expect(fetchPublicHtml('https://example.com')).resolves.toMatchObject({
      html: '<title>Example</title>',
    });
  });

  it('rejects redirects to private networks', async () => {
    mocks.lookup.mockImplementation(async (hostname: string) => [{
      address: hostname === 'example.com' ? '93.184.216.34' : hostname,
      family: 4,
    }]);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {
      status: 302,
      headers: { location: 'http://169.254.169.254/latest/meta-data' },
    })));

    await expect(fetchPublicHtml('https://example.com')).rejects.toThrow(
      'Private or reserved network addresses are not allowed.',
    );
  });

  it('rejects oversized and non-HTML responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('large', {
      headers: { 'content-type': 'text/html', 'content-length': '1000001' },
    })));
    await expect(fetchPublicHtml('https://example.com')).rejects.toThrow('too large');

    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(new Response('{}', {
      headers: { 'content-type': 'application/json' },
    })));
    await expect(fetchPublicHtml('https://example.com')).rejects.toThrow('HTML document');
  });
});

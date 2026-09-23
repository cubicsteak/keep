// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';

import KeepItem from './keep-item';

const keep = {
  id: 42,
  userId: 'user-1',
  title: 'Example title',
  url: 'https://example.com/page?a=1',
  description: 'Example description',
};

function markupOf(props: Parameters<typeof KeepItem>[0]) {
  return renderToStaticMarkup(<KeepItem {...props} />);
}

function hrefsIn(markup: string) {
  return [...markup.matchAll(/<a[^>]*href="([^"]*)"/g)].map(([, href]) => href);
}

describe('KeepItem markup', () => {
  it('links straight to the destination so the status bar shows it', () => {
    const hrefs = hrefsIn(markupOf({ keep }));

    expect(hrefs.filter((href) => href === keep.url)).toHaveLength(2);
    expect(hrefs.some((href) => href.startsWith('/go/'))).toBe(false);
  });

  it('keeps the destination URL as the link text and the favicon source', () => {
    const markup = markupOf({ keep });

    expect(markup).toContain('>https://example.com/page?a=1</a>');
    expect(markup).toContain(`url=${encodeURIComponent(keep.url)}`);
  });

  it('renders no link when the bookmark has no URL', () => {
    const markup = markupOf({ keep: { ...keep, url: null } });

    expect(hrefsIn(markup)).toHaveLength(0);
    expect(markup).toContain('Example title');
  });
});

describe('KeepItem click', () => {
  let container: HTMLDivElement;
  const sendBeacon = vi.fn();

  beforeEach(() => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal('navigator', { ...navigator, sendBeacon });
    container = document.createElement('div');
    document.body.append(container);
    // jsdom cannot navigate; stop the anchor before it tries.
    container.addEventListener('click', (event) => event.preventDefault());
  });

  afterEach(() => {
    container.remove();
    vi.unstubAllGlobals();
  });

  async function render(props: Parameters<typeof KeepItem>[0]) {
    const root = createRoot(container);
    await act(async () => { root.render(<KeepItem {...props} />); });
    return [...container.querySelectorAll('a')].filter((a) => a.href.startsWith('https://example.com'));
  }

  it('counts the visit through the beacon when either link is clicked', async () => {
    const links = await render({ keep });
    expect(links).toHaveLength(2);

    for (const link of links) {
      await act(async () => { link.click(); });
    }

    expect(sendBeacon).toHaveBeenCalledTimes(2);
    expect(sendBeacon).toHaveBeenCalledWith('/api/keep/42/view');
  });

  it('does not count a bookmark with no ID', async () => {
    const links = await render({ keep: { ...keep, id: undefined } });

    await act(async () => { links[0].click(); });

    expect(sendBeacon).not.toHaveBeenCalled();
  });
});

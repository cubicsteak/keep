// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

import KeepItem from './keep-item';

const keep = {
  id: 42,
  userId: 'user-1',
  title: 'Example title',
  url: 'https://example.com/page?a=1',
  description: 'Example description',
};

function render(props: Parameters<typeof KeepItem>[0]) {
  return renderToStaticMarkup(<KeepItem {...props} />);
}

describe('KeepItem', () => {
  it('sends the title and URL links through the internal route', () => {
    const markup = render({ keep });
    const hrefs = [...markup.matchAll(/<a[^>]*href="([^"]*)"/g)].map(([, href]) => href);

    expect(hrefs).toContain('/go/42');
    expect(hrefs.filter((href) => href === '/go/42')).toHaveLength(2);
    expect(hrefs).not.toContain(keep.url);
  });

  it('keeps the destination URL as the link text and the favicon source', () => {
    const markup = render({ keep });

    expect(markup).toContain('>https://example.com/page?a=1</a>');
    expect(markup).toContain(`url=${encodeURIComponent(keep.url)}`);
  });

  it('renders no visit link when the bookmark has no ID', () => {
    const markup = render({ keep: { ...keep, id: undefined } });
    const hrefs = [...markup.matchAll(/<a[^>]*href="([^"]*)"/g)].map(([, href]) => href);

    expect(hrefs).toHaveLength(0);
    expect(markup).toContain('Example title');
    expect(markup).toContain('https://example.com/page?a=1');
  });
});

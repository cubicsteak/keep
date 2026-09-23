import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
    keep: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import { GET, HEAD } from './route';

function visit(id: string) {
  return GET(new Request(`http://localhost/go/${id}`), {
    params: Promise.resolve({ id }),
  });
}

describe('/go/[id]', () => {
  beforeEach(() => {
    mocks.findUnique.mockResolvedValue({ url: 'https://example.com/page' });
    mocks.update.mockResolvedValue({});
    // Run the callback against the mocked delegate, the way Prisma would.
    mocks.transaction.mockImplementation((callback: (tx: unknown) => unknown) => callback({
      keep: { findUnique: mocks.findUnique, update: mocks.update },
    }));
  });

  it('redirects to the stored URL and counts the visit once', async () => {
    const response = await visit('42');

    expect(response.status).toBe(302);
    expect(response.headers.get('location')).toBe('https://example.com/page');
    expect(response.headers.get('cache-control')).toBe('no-store');
    // The destination must not learn where the visitor came from, whichever way
    // they reached /go/[id].
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { url: true },
    });
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { views: { increment: 1 } },
    });
  });

  it('counts visits without a session', async () => {
    // The handler never reads auth: an anonymous visit is still a visit.
    const response = await visit('7');

    expect(response.status).toBe(302);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { views: { increment: 1 } },
    });
  });

  it.each(['abc', '0', '-1', '1.5', '', '1e3', '99999999999999999999'])(
    'rejects the invalid ID %s',
    async (id) => {
      const response = await visit(id);

      expect(response.status).toBe(404);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('referrer-policy')).toBe('no-referrer');
      expect(mocks.findUnique).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it('returns 404 for a bookmark that does not exist', async () => {
    mocks.findUnique.mockResolvedValue(null);

    const response = await visit('42');

    expect(response.status).toBe(404);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'data:text/html,<script>alert(1)</script>',
    'https://user:password@example.com',
    'not a url',
    '',
    null,
  ])('refuses to redirect to the unsafe stored URL %s', async (url) => {
    mocks.findUnique.mockResolvedValue({ url });

    const response = await visit('42');

    expect(response.status).toBe(404);
    expect(response.headers.get('location')).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('does not redirect when the increment fails', async () => {
    mocks.update.mockRejectedValue(new Error('deadlock detected on "Keep"'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await visit('42');

    expect(response.status).toBe(500);
    expect(response.headers.get('location')).toBeNull();
    // The error detail stays in the log, never in the response.
    expect(await response.text()).toBe('Internal Server Error');
  });

  it('does not count HEAD requests', async () => {
    const response = await HEAD();

    expect(response.status).toBe(204);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

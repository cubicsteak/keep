import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('@/prisma', () => ({
  prisma: { keep: { update: mocks.update } },
}));

import { POST } from './route';

function count(id: string) {
  return POST(new Request(`http://localhost/api/keep/${id}/view`, { method: 'POST' }), {
    params: Promise.resolve({ id }),
  });
}

describe('POST /api/keep/[id]/view', () => {
  beforeEach(() => {
    mocks.update.mockResolvedValue({});
  });

  it('increments the count once and answers without a body', async () => {
    const response = await count('42');

    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 42 },
      data: { views: { increment: 1 } },
    });
  });

  it('counts a visit with no session', async () => {
    // The handler never reads auth: an anonymous click is still a click.
    await count('7');

    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { views: { increment: 1 } },
    });
  });

  it.each(['abc', '0', '-1', '1.5', '', '1e3', '99999999999999999999'])(
    'rejects the invalid ID %s',
    async (id) => {
      const response = await count(id);

      expect(response.status).toBe(404);
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it('answers 404 for a bookmark that no longer exists', async () => {
    mocks.update.mockRejectedValue(Object.assign(new Error('Record to update not found.'), {
      code: 'P2025',
    }));

    expect((await count('42')).status).toBe(404);
  });

  it('answers 500 on a database failure without leaking the detail', async () => {
    mocks.update.mockRejectedValue(new Error('deadlock detected on "Keep"'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await count('42');

    expect(response.status).toBe(500);
    expect(await response.text()).toBe('');
  });
});

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  count: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
      count: mocks.count,
      delete: mocks.remove,
    },
  },
}));

import { DELETE, GET, POST } from './route';

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

function request(method = 'GET', body?: unknown) {
  return new NextRequest('http://localhost/api/user/me/profile', {
    method,
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

describe('/api/user/me/[slug]', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1' } });
    mocks.findUnique.mockResolvedValue({ nick: 'Person' });
    mocks.update.mockResolvedValue({});
    mocks.count.mockResolvedValue(0);
    mocks.remove.mockResolvedValue({});
  });

  it('rejects unauthenticated reads and deletion', async () => {
    mocks.auth.mockResolvedValue(null);

    expect((await GET(request(), params('profile'))).status).toBe(401);
    expect((await DELETE()).status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('does not expose the legacy password settings resource', async () => {
    const response = await GET(request(), params('security'));

    expect(response.status).toBe(404);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects privilege and field injection in profile updates', async () => {
    const response = await POST(request('POST', {
      nick: 'Person',
      email: 'person@example.com',
      bio: '',
      url: '',
      photo: '',
      role: 'admin',
    }), params('profile'));

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('only persists approved profile fields', async () => {
    const response = await POST(request('POST', {
      nick: 'Person',
      email: 'person@example.com',
      bio: 'Bio',
      url: 'https://example.com',
      photo: 'https://example.com/photo.png',
    }), params('profile'));

    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        nick: 'Person',
        bio: 'Bio',
        url: 'https://example.com',
        photo: 'https://example.com/photo.png',
      },
    });
  });

  it.each(['admin', 'ADMIN', '-invalid', 'ab'])('rejects reserved or invalid username %s', async (username) => {
    const response = await POST(request('POST', { username }), params('username'));

    expect(response.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('checks username duplicates case-insensitively', async () => {
    mocks.count.mockResolvedValue(1);

    const response = await POST(request('POST', { username: 'Person-1' }), params('username'));

    expect(response.status).toBe(400);
    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        username: { equals: 'Person-1', mode: 'insensitive' },
        NOT: { id: 'user-1' },
      },
    });
  });
});

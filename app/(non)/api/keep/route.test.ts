import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  create: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/prisma', () => ({
  prisma: {
    keep: {
      create: mocks.create,
      delete: mocks.remove,
    },
  },
}));

import { DELETE, POST } from './route';

function request(method: string, body: unknown) {
  return new NextRequest('http://localhost/api/keep', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('/api/keep', () => {
  beforeEach(() => {
    mocks.auth.mockResolvedValue({ user: { id: 'user-1', role: 'member' } });
    mocks.create.mockResolvedValue({});
    mocks.remove.mockResolvedValue({});
  });

  it('rejects unauthenticated writes', async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(request('POST', {
      title: 'Example',
      url: 'https://example.com',
    }));

    expect(response.status).toBe(401);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it.each(['javascript:alert(1)', 'file:///etc/passwd'])('rejects unsafe URL %s', async (url) => {
    const response = await POST(request('POST', { title: 'Unsafe', url }));

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('rejects mass-assignment fields', async () => {
    const response = await POST(request('POST', {
      title: 'Example',
      url: 'https://example.com',
      userId: 'attacker-selected-user',
      createdAt: '2000-01-01',
    }));

    expect(response.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('uses the authenticated user ID when creating a bookmark', async () => {
    const response = await POST(request('POST', {
      title: 'Example',
      description: '',
      url: 'https://example.com',
      image: '',
    }));

    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1' }),
    });
  });

  it('scopes deletion to the authenticated owner', async () => {
    const response = await DELETE(request('DELETE', { id: 42 }));

    expect(response.status).toBe(200);
    expect(mocks.remove).toHaveBeenCalledWith({
      where: { id: 42, userId: 'user-1' },
    });
  });

  it('allows an administrator to delete by ID', async () => {
    mocks.auth.mockResolvedValue({ user: { id: 'admin-1', role: 'admin' } });

    await DELETE(request('DELETE', { id: 42 }));

    expect(mocks.remove).toHaveBeenCalledWith({ where: { id: 42 } });
  });
});

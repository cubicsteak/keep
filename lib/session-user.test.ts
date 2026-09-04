import { describe, expect, it } from 'vitest';
import { toSessionUser } from './session-user';

describe('toSessionUser', () => {
  it('only returns explicitly approved session fields', () => {
    const source = {
      id: 'user-1',
      email: 'person@example.com',
      role: 'member',
      nick: 'Person',
      password: 'password-hash',
      passsalt: 'secret-salt',
      unexpectedClaim: 'do-not-copy',
    };

    const result = toSessionUser(source);

    expect(result).toMatchObject({
      id: 'user-1',
      email: 'person@example.com',
      role: 'member',
      nick: 'Person',
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('passsalt');
    expect(result).not.toHaveProperty('unexpectedClaim');
  });
});

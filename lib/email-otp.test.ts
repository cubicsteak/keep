import { describe, expect, it, vi } from 'vitest';
import type { Adapter, VerificationToken } from 'next-auth/adapters';
import { generateOtp, normalizeEmail, otpEmail, withOtpGuard, OTP_LENGTH } from './email-otp';

function setup(found: VerificationToken | null) {
  const adapter = {
    createVerificationToken: vi.fn(async (token: VerificationToken) => token),
    useVerificationToken: vi.fn(async () => found),
  } satisfies Adapter;
  const store = {
    deleteMany: vi.fn(async () => ({ count: 0 })),
    updateMany: vi.fn(async () => ({ count: 0 })),
  };
  return { adapter, store, guarded: withOtpGuard(adapter, store, 5) };
}

describe('generateOtp', () => {
  it('returns a zero padded numeric code', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateOtp()).toMatch(new RegExp(`^\\d{${OTP_LENGTH}}$`));
    }
  });
});

describe('normalizeEmail', () => {
  it('lowercases and trims', () => {
    expect(normalizeEmail('  Person@Example.COM ')).toBe('person@example.com');
  });
});

describe('otpEmail', () => {
  it('includes the code and escapes the host', () => {
    const mail = otpEmail({ code: '012345', host: '<x>', minutes: 10 });
    expect(mail.subject).toContain('012345');
    expect(mail.text).toContain('012345');
    expect(mail.html).toContain('012345');
    expect(mail.html).toContain('&lt;x&gt;');
    expect(mail.html).not.toContain('<x>');
  });
});

describe('withOtpGuard', () => {
  const token = { identifier: 'a@b.c', token: 'hash', expires: new Date() };

  it('removes earlier codes before issuing a new one', async () => {
    const { adapter, store, guarded } = setup(null);
    await guarded.createVerificationToken!(token);
    expect(store.deleteMany).toHaveBeenCalledWith({ where: { identifier: 'a@b.c' } });
    expect(adapter.createVerificationToken).toHaveBeenCalledWith(token);
  });

  it('passes through a matching code without counting an attempt', async () => {
    const { store, guarded } = setup(token);
    await expect(guarded.useVerificationToken!({ identifier: 'a@b.c', token: 'hash' })).resolves.toBe(token);
    expect(store.updateMany).not.toHaveBeenCalled();
  });

  it('counts a wrong guess and discards codes past the limit', async () => {
    const { store, guarded } = setup(null);
    await expect(guarded.useVerificationToken!({ identifier: 'a@b.c', token: 'bad' })).resolves.toBeNull();
    expect(store.updateMany).toHaveBeenCalledWith({
      where: { identifier: 'a@b.c' },
      data: { attempts: { increment: 1 } },
    });
    expect(store.deleteMany).toHaveBeenCalledWith({
      where: { identifier: 'a@b.c', attempts: { gte: 5 } },
    });
  });

  it('rejects lookups without an identifier', async () => {
    const { adapter, guarded } = setup(token);
    await expect(
      guarded.useVerificationToken!({ identifier: undefined as unknown as string, token: 'hash' }),
    ).resolves.toBeNull();
    expect(adapter.useVerificationToken).not.toHaveBeenCalled();
  });
});

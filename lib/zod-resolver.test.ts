import { zodResolver } from '@hookform/resolvers/zod';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

describe('Zod 4 form validation', () => {
  const resolver = zodResolver(z.object({ nick: z.string().min(2).max(16).trim() }));
  const options = { fields: {}, shouldUseNativeValidation: false };

  it.each(['', 'a'])('returns a field error for nickname %j without throwing', async (nick) => {
    await expect(resolver({ nick }, undefined, options)).resolves.toMatchObject({
      values: {},
      errors: { nick: { type: 'too_small', message: expect.any(String) } },
    });
  });

  it('returns validated values for a valid nickname', async () => {
    await expect(resolver({ nick: 'Alex ' }, undefined, options)).resolves.toEqual({
      values: { nick: 'Alex' },
      errors: {},
    });
  });
});

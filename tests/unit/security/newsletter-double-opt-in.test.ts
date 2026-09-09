import { Prisma, NewsletterSubscriptionStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({
  db: {
    newsletterSubscriber: {
      create: mocks.create,
      updateMany: mocks.updateMany,
      findUnique: mocks.findUnique,
    },
  },
}));

import { confirmNewsletter, subscribeNewsletter } from '@/lib/newsletter/service';

const input = {
  email: 'fan@example.com',
  source: 'site',
  consentAt: new Date('2026-08-09T12:00:00.000Z'),
  consentPolicyVersion: '2026-08-09',
  consentIpHash: null,
  consentUserAgentHash: null,
  signingSecret: 'a-secure-test-secret-that-is-at-least-32-bytes',
};

function uniqueConflict() {
  return new Prisma.PrismaClientKnownRequestError('unique conflict', {
    code: 'P2002',
    clientVersion: '6.19.3',
    meta: { target: ['email'] },
  });
}

describe('newsletter double opt-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a pending subscriber and returns an expiring confirmation challenge', async () => {
    mocks.create.mockResolvedValue({ id: 'subscriber-1' });

    const result = await subscribeNewsletter(input);

    expect(result.confirmationRequired).toBe(true);
    expect(mocks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: input.email,
          status: NewsletterSubscriptionStatus.PENDING,
          subscribedAt: null,
          confirmationTokenDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
          confirmationExpiresAt: expect.any(Date),
          confirmationSentAt: expect.any(Date),
        }),
      })
    );
  });

  it('does not reserve another send while the per-address cooldown is active', async () => {
    mocks.create.mockRejectedValue(uniqueConflict());
    mocks.updateMany.mockResolvedValue({ count: 0 });
    mocks.findUnique.mockResolvedValue({
      id: 'subscriber-1',
      status: NewsletterSubscriptionStatus.PENDING,
    });

    const result = await subscribeNewsletter(input);

    expect(result).toEqual({ subscriberId: 'subscriber-1', confirmationRequired: false });
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: input.email,
          OR: expect.any(Array),
        }),
      })
    );
  });

  it('activates only a pending, unexpired challenge and clears its digest', async () => {
    mocks.updateMany.mockResolvedValue({ count: 1 });
    const token = 'a'.repeat(43);

    await expect(confirmNewsletter(token, input.signingSecret)).resolves.toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: NewsletterSubscriptionStatus.PENDING,
          confirmationExpiresAt: { gt: expect.any(Date) },
        }),
        data: expect.objectContaining({
          status: NewsletterSubscriptionStatus.ACTIVE,
          confirmationTokenDigest: null,
          confirmedAt: expect.any(Date),
          subscribedAt: expect.any(Date),
        }),
      })
    );
  });
});

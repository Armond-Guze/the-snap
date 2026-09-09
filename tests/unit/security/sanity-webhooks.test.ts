import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  parseBody: vi.fn(),
  revalidatePath: vi.fn(),
  sanityFetch: vi.fn(),
  postTweet: vi.fn(),
  beginWebhookEventProcessing: vi.fn(),
  markWebhookEventProcessed: vi.fn(),
  markWebhookEventFailed: vi.fn(),
}));

vi.mock('next-sanity/webhook', () => ({ parseBody: mocks.parseBody }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/sanity/lib/client', () => ({
  client: {
    withConfig: () => ({ fetch: mocks.sanityFetch }),
  },
}));
vi.mock('@/lib/twitter', () => ({ postTweet: mocks.postTweet }));
vi.mock('@/lib/security/webhook-events', () => ({
  beginWebhookEventProcessing: mocks.beginWebhookEventProcessing,
  markWebhookEventProcessed: mocks.markWebhookEventProcessed,
  markWebhookEventFailed: mocks.markWebhookEventFailed,
}));

import { POST as revalidateSanity } from '@/app/api/webhooks/sanity/route';
import { POST as publishSocial } from '@/app/api/social/new-article/route';

describe('signed Sanity webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SANITY_WEBHOOK_SECRET = 'signed-sanity-webhook-secret';
    process.env.X_API_KEY = 'key';
    process.env.X_API_SECRET = 'secret';
    process.env.X_ACCESS_TOKEN = 'token';
    process.env.X_ACCESS_SECRET = 'token-secret';
  });

  it('rejects an invalid Sanity signature even when a bearer header is present', async () => {
    mocks.parseBody.mockResolvedValue({ body: { document: { _type: 'article' } }, isValidSignature: false });
    const request = new NextRequest('https://thegamesnap.com/api/webhooks/sanity', {
      method: 'POST',
      headers: { authorization: 'Bearer signed-sanity-webhook-secret' },
      body: '{}',
    });

    const response = await revalidateSanity(request);

    expect(response.status).toBe(401);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it('revalidates modern headline paths after a valid signed payload', async () => {
    mocks.parseBody.mockResolvedValue({
      isValidSignature: true,
      body: {
        document: {
          _type: 'article',
          format: 'headline',
          slug: { current: 'signed-headline' },
        },
      },
    });
    const request = new NextRequest('https://thegamesnap.com/api/webhooks/sanity', {
      method: 'POST',
      body: '{}',
    });

    const response = await revalidateSanity(request);

    expect(response.status).toBe(200);
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/articles/signed-headline');
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/rss.xml');
  });

  it('publishes current article-format headlines and claims an idempotency record', async () => {
    mocks.parseBody.mockResolvedValue({
      isValidSignature: true,
      body: { transition: 'appear', documentId: 'article-1' },
    });
    mocks.sanityFetch.mockResolvedValue({
      title: 'Current headline',
      slug: { current: 'current-headline' },
      category: { title: 'News' },
      author: { name: 'Reporter' },
      tags: ['NFL'],
    });
    mocks.beginWebhookEventProcessing.mockResolvedValue({
      logId: 'log-1',
      isDuplicateProcessed: false,
    });
    mocks.postTweet.mockResolvedValue({ ok: true, dryRun: false });

    const response = await publishSocial(
      new NextRequest('https://thegamesnap.com/api/social/new-article', {
        method: 'POST',
        body: '{}',
      })
    );

    expect(response.status).toBe(200);
    expect(mocks.sanityFetch.mock.calls[0]?.[0]).toContain('_type == "article"');
    expect(mocks.sanityFetch.mock.calls[0]?.[0]).toContain('format == "headline"');
    expect(mocks.beginWebhookEventProcessing).toHaveBeenCalledOnce();
    expect(mocks.postTweet).toHaveBeenCalledWith(expect.objectContaining({ dryRun: false }));
    expect(mocks.markWebhookEventProcessed).toHaveBeenCalledWith('log-1');
  });
});

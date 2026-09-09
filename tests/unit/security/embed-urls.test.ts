import { describe, expect, it } from 'vitest';

import {
  extractStrictYouTubeId,
  isAllowedSocialClipUrl,
  normalizeInstagramPostUrl,
  normalizeTikTokVideoUrl,
  normalizeXPostUrl,
  parseTikTokVideoUrl,
} from '@/lib/embed-urls';
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/youtube';

const VIDEO_ID = 'dQw4w9WgXcQ';

describe('external-media URL allowlists', () => {
  it('accepts only exact HTTPS YouTube hosts and supported path shapes', () => {
    expect(extractStrictYouTubeId(VIDEO_ID)).toBe(VIDEO_ID);
    expect(extractStrictYouTubeId(`https://www.youtube.com/watch?v=${VIDEO_ID}`)).toBe(VIDEO_ID);
    expect(extractStrictYouTubeId(`https://youtu.be/${VIDEO_ID}?feature=share`)).toBe(VIDEO_ID);
    expect(extractStrictYouTubeId(`https://www.youtube.com/shorts/${VIDEO_ID}`)).toBe(VIDEO_ID);

    expect(extractStrictYouTubeId(`http://www.youtube.com/watch?v=${VIDEO_ID}`)).toBeNull();
    expect(extractStrictYouTubeId(`https://www.youtube.com.evil.test/watch?v=${VIDEO_ID}`)).toBeNull();
    expect(extractStrictYouTubeId(`https://evilyoutu.be/${VIDEO_ID}`)).toBeNull();
    expect(extractStrictYouTubeId(`https://example.test/${VIDEO_ID}`)).toBeNull();
    expect(extractStrictYouTubeId(`prefix-${VIDEO_ID}-suffix`)).toBeNull();

    expect(youtubeEmbedUrl(VIDEO_ID)).toContain(`https://www.youtube-nocookie.com/embed/${VIDEO_ID}`);
    expect(youtubeWatchUrl('https://attacker.test/video')).toBe('https://www.youtube.com/');
  });

  it('canonicalizes exact Instagram and TikTok post URLs and rejects suffix/path tricks', () => {
    expect(normalizeInstagramPostUrl('https://instagram.com/reel/ABC_def-1/?utm_source=test'))
      .toBe('https://www.instagram.com/reel/ABC_def-1/');
    expect(normalizeInstagramPostUrl('https://instagram.com.evil.test/reel/ABC123/')).toBeNull();
    expect(normalizeInstagramPostUrl('https://www.instagram.com/reel/ABC123/embed')).toBeNull();
    expect(normalizeInstagramPostUrl('http://www.instagram.com/p/ABC123/')).toBeNull();

    expect(parseTikTokVideoUrl('https://tiktok.com/@snap.football/video/123456789?lang=en'))
      .toEqual({
        url: 'https://www.tiktok.com/@snap.football/video/123456789',
        videoId: '123456789',
      });
    expect(normalizeTikTokVideoUrl('https://www.tiktok.com/@snap/video/123/extra')).toBeNull();
    expect(normalizeTikTokVideoUrl('https://www.tiktok.com.evil.test/@snap/video/123')).toBeNull();
    expect(normalizeTikTokVideoUrl('https://vm.tiktok.com/short-code')).toBeNull();
  });

  it('uses exact X and clip-provider path validation', () => {
    expect(normalizeXPostUrl('https://twitter.com/thesnap/status/1234567890?ref=test'))
      .toBe('https://x.com/thesnap/status/1234567890');
    expect(normalizeXPostUrl('https://x.com.evil.test/thesnap/status/1234567890')).toBeNull();
    expect(normalizeXPostUrl('https://x.com/thesnap/status/1234567890/metrics')).toBeNull();

    expect(isAllowedSocialClipUrl('https://vimeo.com/123456789')).toBe(true);
    expect(isAllowedSocialClipUrl('https://player.vimeo.com/video/123456789')).toBe(true);
    expect(isAllowedSocialClipUrl('https://cdn.vimeo.com/123456789')).toBe(false);
    expect(isAllowedSocialClipUrl('https://vimeo.com/channels/staffpicks/123456789')).toBe(false);
  });
});


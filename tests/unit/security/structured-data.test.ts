import { describe, expect, it } from 'vitest';

import { serializeStructuredData } from '@/app/components/StructuredData';

describe('structured-data serialization', () => {
  it('cannot terminate the JSON-LD script element', () => {
    const serialized = serializeStructuredData({
      '@context': 'https://schema.org',
      headline: '</script><script>globalThis.pwned=true</script>',
    });

    expect(serialized).not.toContain('<');
    expect(serialized).not.toContain('>');
    expect(serialized).toContain('\\u003c/script\\u003e');
    expect(JSON.parse(serialized).headline).toBe(
      '</script><script>globalThis.pwned=true</script>'
    );
  });
});

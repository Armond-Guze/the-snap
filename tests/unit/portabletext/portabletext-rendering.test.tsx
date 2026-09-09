import { PortableText, type PortableTextProps } from '@portabletext/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { portableTextComponents } from '../../../lib/portabletext-components'

const renderPortableText = (value: PortableTextProps['value']) =>
  renderToStaticMarkup(<PortableText value={value} components={portableTextComponents} />)

describe('portableTextComponents', () => {
  it('demotes legacy body h1 blocks to h2', () => {
    const html = renderPortableText({
      _key: 'heading',
      _type: 'block',
      style: 'h1',
      markDefs: [],
      children: [{ _key: 'span', _type: 'span', marks: [], text: 'Legacy heading' }],
    })

    expect(html).toContain('<h2')
    expect(html).toContain('Legacy heading</h2>')
    expect(html).not.toContain('<h1')
  })

  it('renders the implied totals calculator without a missing-component warning', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const html = renderPortableText({
      _key: 'calculator',
      _type: 'impliedTotalsCalculator',
    })

    expect(html).toContain('Implied team total calculator')
    expect(html).toContain('25.5 points')
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  it('restores known mismatched legacy annotations without warnings', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    const html = renderPortableText({
      _key: 'paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: 'span',
          _type: 'span',
          marks: ['evergreen-franchise-related-guide-link-1'],
          text: 'salary cap guide',
        },
      ],
    })

    expect(html).toContain('href="/articles/how-does-the-nfl-salary-cap-work"')
    expect(warning).not.toHaveBeenCalled()
    warning.mockRestore()
  })

  it('adds isolation attributes to external links and rejects unsafe schemes', () => {
    const externalHtml = renderPortableText({
      _key: 'external-paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [{ _key: 'external', _type: 'link', href: 'https://operations.nfl.com/' }],
      children: [
        { _key: 'external-span', _type: 'span', marks: ['external'], text: 'NFL Operations' },
      ],
    })
    const unsafeHtml = renderPortableText({
      _key: 'unsafe-paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [{ _key: 'unsafe', _type: 'link', href: 'javascript:alert(1)' }],
      children: [{ _key: 'unsafe-span', _type: 'span', marks: ['unsafe'], text: 'unsafe' }],
    })

    expect(externalHtml).toContain('target="_blank"')
    expect(externalHtml).toContain('rel="noopener noreferrer"')
    expect(unsafeHtml).not.toContain('href=')
    expect(unsafeHtml).toContain('<span>unsafe</span>')
  })

  it('uses an accessible note when a future custom block has no renderer', () => {
    const html = renderToStaticMarkup(
      <PortableText
        value={{ _key: 'future', _type: 'futureInteractiveBlock' }}
        components={portableTextComponents}
        onMissingComponent={false}
      />,
    )

    expect(html).toContain('role="note"')
    expect(html).toContain('Embedded content unavailable')
  })
})

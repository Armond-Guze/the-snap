import { describe, expect, it } from 'vitest'

import { calculateImpliedTotals } from '../../../lib/implied-totals-calculator'

describe('calculateImpliedTotals', () => {
  it('derives the favorite and underdog totals from a total and spread', () => {
    expect(calculateImpliedTotals(47.5, 3.5)).toEqual({
      favorite: 25.5,
      underdog: 22,
    })
  })

  it('accepts a conventionally signed favorite spread', () => {
    expect(calculateImpliedTotals(44, -2)).toEqual({
      favorite: 23,
      underdog: 21,
    })
  })

  it('preserves valid quarter-point results', () => {
    expect(calculateImpliedTotals(47.5, 4)).toEqual({
      favorite: 25.75,
      underdog: 21.75,
    })
  })

  it.each([
    [0, 3],
    [44, 45],
    [Number.NaN, 3],
    [44, Number.POSITIVE_INFINITY],
  ])('rejects invalid inputs (%s, %s)', (total, spread) => {
    expect(calculateImpliedTotals(total, spread)).toBeNull()
  })
})

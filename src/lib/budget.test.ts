import { describe, it, expect } from 'vitest'
import { computeSplit, formatEUR } from './budget'

describe('computeSplit', () => {
  it('splits 1000 at 30% management into 300 / 700', () => {
    expect(computeSplit(1000, 30)).toEqual({ mgmt: 300, ads: 700 })
  })
  it('sums exactly to total with rounding (1000 @ 33%)', () => {
    const { mgmt, ads } = computeSplit(1000, 33)
    expect(mgmt).toBe(330)
    expect(mgmt + ads).toBe(1000)
  })
  it('handles odd totals so parts always sum to total (999 @ 33%)', () => {
    const { mgmt, ads } = computeSplit(999, 33)
    expect(mgmt + ads).toBe(999)
    expect(mgmt).toBe(330)
  })
  it('handles 0% and 100% bounds', () => {
    expect(computeSplit(500, 0)).toEqual({ mgmt: 0, ads: 500 })
    expect(computeSplit(500, 100)).toEqual({ mgmt: 500, ads: 0 })
  })
})

describe('formatEUR', () => {
  it('formats thousands with a space and no decimals', () => {
    expect(formatEUR(1000)).toBe('1 000')
    expect(formatEUR(700)).toBe('700')
    expect(formatEUR(12500)).toBe('12 500')
  })
})

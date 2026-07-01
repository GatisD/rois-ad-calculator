import { describe, it, expect } from 'vitest'
import { computeSplit, formatEUR, mgmtPctForBudget, tierForBudget, TIERS } from './budget'

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

describe('mgmtPctForBudget', () => {
  it('budgets under 5 000 pay 30% management', () => {
    expect(mgmtPctForBudget(0)).toBe(30)
    expect(mgmtPctForBudget(1000)).toBe(30)
    expect(mgmtPctForBudget(4999)).toBe(30)
  })
  it('budgets from 5 000 to under 10 000 pay 25%', () => {
    expect(mgmtPctForBudget(5000)).toBe(25)
    expect(mgmtPctForBudget(7500)).toBe(25)
    expect(mgmtPctForBudget(9999)).toBe(25)
  })
  it('budgets of 10 000 and up pay 20%', () => {
    expect(mgmtPctForBudget(10000)).toBe(20)
    expect(mgmtPctForBudget(25000)).toBe(20)
  })
})

describe('tierForBudget', () => {
  it('returns the matching tier object for each band', () => {
    expect(tierForBudget(3000).pct).toBe(30)
    expect(tierForBudget(6000).pct).toBe(25)
    expect(tierForBudget(12000).pct).toBe(20)
  })
  it('every tier pct matches mgmtPctForBudget at a representative budget', () => {
    for (const t of TIERS) {
      const sample = t.upTo === null ? t.min + 1000 : (t.min + t.upTo) / 2
      expect(mgmtPctForBudget(sample)).toBe(t.pct)
    }
  })
})

describe('formatEUR', () => {
  it('formats thousands with a space and no decimals', () => {
    expect(formatEUR(1000)).toBe('1 000')
    expect(formatEUR(700)).toBe('700')
    expect(formatEUR(12500)).toBe('12 500')
  })
  it('formatEUR(0) returns "0"', () => {
    expect(formatEUR(0)).toBe('0')
  })
})

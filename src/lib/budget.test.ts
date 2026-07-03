import { describe, it, expect } from 'vitest'
import {
  computeFromAds,
  computeFromFee,
  computeFromTotal,
  formatEUR,
  mgmtPctForBudget,
  tierForBudget,
  MIN_FEE,
  SETUP_PER_CHANNEL,
  TIERS,
} from './budget'

describe('computeFromTotal', () => {
  it('splits a 2 000 total into 600 fee (30%) and 1 400 ads', () => {
    expect(computeFromTotal(2000)).toEqual({ total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false })
  })
  it('applies the 500 EUR minimum fee on a 1 000 total (fee 500, ads 500)', () => {
    expect(computeFromTotal(1000)).toEqual({ total: 1000, fee: 500, ads: 500, pct: 30, minApplied: true })
  })
  it('switches to 25% at a 5 000 total (fee 1 250, ads 3 750)', () => {
    expect(computeFromTotal(5000)).toEqual({ total: 5000, fee: 1250, ads: 3750, pct: 25, minApplied: false })
  })
  it('switches to 20% at a 10 000 total (fee 2 000, ads 8 000)', () => {
    expect(computeFromTotal(10000)).toEqual({ total: 10000, fee: 2000, ads: 8000, pct: 20, minApplied: false })
  })
  it('rounds the fee and keeps fee + ads = total (1999 @ 30%)', () => {
    const { fee, ads } = computeFromTotal(1999)
    expect(fee).toBe(600)
    expect(fee + ads).toBe(1999)
  })
  it('never pushes ads below zero when total is under the minimum fee', () => {
    expect(computeFromTotal(400)).toEqual({ total: 400, fee: 400, ads: 0, pct: 30, minApplied: true })
    expect(computeFromTotal(0)).toEqual({ total: 0, fee: 0, ads: 0, pct: 30, minApplied: false })
  })
})

describe('computeFromAds (inverse: ads budget entered)', () => {
  it('1 400 ads implies a 2 000 total with a 600 fee (30%)', () => {
    expect(computeFromAds(1400)).toEqual({ total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false })
  })
  it('500 ads hits the minimum fee: total 1 000, fee 500', () => {
    expect(computeFromAds(500)).toEqual({ total: 1000, fee: 500, ads: 500, pct: 30, minApplied: true })
  })
  it('large ads budgets resolve to the matching lower tier (8 000 ads → 20%)', () => {
    const r = computeFromAds(8000)
    expect(r.pct).toBe(20)
    expect(r.total).toBe(10000)
    expect(r.fee).toBe(2000)
  })
  it('fee + ads always equals total', () => {
    for (const ads of [700, 1400, 3600, 5200, 9000]) {
      const r = computeFromAds(ads)
      expect(r.fee + r.ads).toBe(r.total)
    }
  })
  it('round-trips with computeFromTotal at a plain 30% point', () => {
    const fromTotal = computeFromTotal(2000)
    expect(computeFromAds(fromTotal.ads)).toEqual(fromTotal)
  })
  it('handles 0 ads', () => {
    expect(computeFromAds(0)).toEqual({ total: 0, fee: 0, ads: 0, pct: 30, minApplied: false })
  })
})

describe('computeFromFee (inverse: management fee entered)', () => {
  it('a 600 fee implies a 2 000 total with 1 400 ads (30%)', () => {
    expect(computeFromFee(600)).toEqual({ total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false })
  })
  it('a 2 000 fee resolves to the 25% tier (total 8 000, ads 6 000)', () => {
    expect(computeFromFee(2000)).toEqual({ total: 8000, fee: 2000, ads: 6000, pct: 25, minApplied: false })
  })
  it('flags fees below the 500 EUR minimum', () => {
    const r = computeFromFee(400)
    expect(r.minApplied).toBe(true)
  })
  it('fee + ads always equals total', () => {
    for (const fee of [500, 600, 1250, 2000, 3000]) {
      const r = computeFromFee(fee)
      expect(r.fee + r.ads).toBe(r.total)
    }
  })
})

describe('mgmtPctForBudget (tier by total budget)', () => {
  it('totals under 5 000 pay 30% management', () => {
    expect(mgmtPctForBudget(0)).toBe(30)
    expect(mgmtPctForBudget(4999)).toBe(30)
  })
  it('totals from 5 000 to under 10 000 pay 25%', () => {
    expect(mgmtPctForBudget(5000)).toBe(25)
    expect(mgmtPctForBudget(9999)).toBe(25)
  })
  it('totals of 10 000 and up pay 20%', () => {
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

describe('MIN_FEE', () => {
  it('is 500 EUR', () => {
    expect(MIN_FEE).toBe(500)
  })
})

describe('SETUP_PER_CHANNEL', () => {
  it('is a 749 EUR one-time fee per channel', () => {
    expect(SETUP_PER_CHANNEL).toBe(749)
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

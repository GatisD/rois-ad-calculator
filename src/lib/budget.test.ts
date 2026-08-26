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
    expect(computeFromTotal(2000)).toEqual({
      total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false, plateauApplied: false, effectivePct: 30,
    })
  })
  it('applies the 500 EUR minimum fee on a 1 000 total (fee 500, ads 500)', () => {
    expect(computeFromTotal(1000)).toEqual({
      total: 1000, fee: 500, ads: 500, pct: 30, minApplied: true, plateauApplied: false, effectivePct: 50,
    })
  })
  it('holds the 1 500 fee at a 5 000 total instead of dropping to 25% (1 250)', () => {
    expect(computeFromTotal(5000)).toEqual({
      total: 5000, fee: 1500, ads: 3500, pct: 25, minApplied: false, plateauApplied: true, effectivePct: 30,
    })
  })
  it('holds the 2 500 fee at a 10 000 total instead of dropping to 20% (2 000)', () => {
    expect(computeFromTotal(10000)).toEqual({
      total: 10000, fee: 2500, ads: 7500, pct: 20, minApplied: false, plateauApplied: true, effectivePct: 25,
    })
  })
  it('rounds the fee and keeps fee + ads = total (1999 @ 30%)', () => {
    const { fee, ads } = computeFromTotal(1999)
    expect(fee).toBe(600)
    expect(fee + ads).toBe(1999)
  })
  it('never pushes ads below zero when total is under the minimum fee', () => {
    expect(computeFromTotal(400)).toEqual({
      total: 400, fee: 400, ads: 0, pct: 30, minApplied: true, plateauApplied: false, effectivePct: 100,
    })
    expect(computeFromTotal(0)).toEqual({
      total: 0, fee: 0, ads: 0, pct: 30, minApplied: false, plateauApplied: false, effectivePct: 30,
    })
  })
})

// Reinis Rocens, 2026-08-26: a bigger budget must never cost less to manage.
// Each tier boundary used to cut the fee (4 999 -> 1 500, 5 000 -> 1 250), which
// also left a band of ads budgets the calculator could not express at all.
describe('the fee never falls as the budget grows', () => {
  it('is non-decreasing across every tier boundary', () => {
    let prev = computeFromTotal(1).fee
    for (let total = 2; total <= 20000; total++) {
      const fee = computeFromTotal(total).fee
      expect(fee, `fee dropped at ${total} EUR`).toBeGreaterThanOrEqual(prev)
      prev = fee
    }
  })
  it('leaves a non-decreasing ads budget too', () => {
    let prev = computeFromTotal(1).ads
    for (let total = 2; total <= 20000; total++) {
      const ads = computeFromTotal(total).ads
      expect(ads, `ads budget dropped at ${total} EUR`).toBeGreaterThanOrEqual(prev)
      prev = ads
    }
  })
  it('keeps the 1 500 fee from 5 000 until 25% catches up at 6 000', () => {
    for (const total of [5000, 5001, 5500, 5999, 6000]) {
      expect(computeFromTotal(total).fee, `${total} EUR`).toBe(1500)
    }
    expect(computeFromTotal(6100).fee).toBe(1525)
  })
  it('keeps the 2 500 fee from 10 000 until 20% catches up at 12 500', () => {
    for (const total of [10000, 11000, 12499, 12500]) {
      expect(computeFromTotal(total).fee, `${total} EUR`).toBe(2500)
    }
    expect(computeFromTotal(13000).fee).toBe(2600)
  })
  it('reports the effective share, not the nominal tier, while the fee is held', () => {
    const r = computeFromTotal(5500)
    expect(r.fee).toBe(1500)
    expect(r.pct).toBe(25)
    expect(r.effectivePct).toBe(27)
    expect(r.plateauApplied).toBe(true)
  })
})

describe('computeFromAds (inverse: ads budget entered)', () => {
  it('1 400 ads implies a 2 000 total with a 600 fee (30%)', () => {
    expect(computeFromAds(1400)).toEqual({
      total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false, plateauApplied: false, effectivePct: 30,
    })
  })
  it('500 ads hits the minimum fee: total 1 000, fee 500', () => {
    expect(computeFromAds(500)).toEqual({
      total: 1000, fee: 500, ads: 500, pct: 30, minApplied: true, plateauApplied: false, effectivePct: 50,
    })
  })
  it('large ads budgets stay on the held fee (8 000 ads -> 2 500)', () => {
    const r = computeFromAds(8000)
    expect(r.total).toBe(10500)
    expect(r.fee).toBe(2500)
  })
  it('answers the ads budgets that used to fall in the tier gap', () => {
    // Reinis' own figures from the 2026-08-26 mail.
    expect(computeFromAds(3500)).toMatchObject({ total: 5000, fee: 1500 })
    expect(computeFromAds(4000)).toMatchObject({ total: 5500, fee: 1500 })
    expect(computeFromAds(4500)).toMatchObject({ total: 6000, fee: 1500 })
    expect(computeFromAds(4600)).toMatchObject({ total: 6133, fee: 1533 })
  })
  it('every ads budget is reachable and matches what the total would produce', () => {
    for (let ads = 1; ads <= 12000; ads++) {
      const r = computeFromAds(ads)
      expect(r.ads, `ads ${ads}`).toBe(ads)
      expect(r.fee + r.ads).toBe(r.total)
      expect(computeFromTotal(r.total).fee, `ads ${ads} -> total ${r.total}`).toBe(r.fee)
    }
  })
  it('round-trips with computeFromTotal at a plain 30% point', () => {
    const fromTotal = computeFromTotal(2000)
    expect(computeFromAds(fromTotal.ads)).toEqual(fromTotal)
  })
  it('handles 0 ads', () => {
    expect(computeFromAds(0)).toEqual({
      total: 0, fee: 0, ads: 0, pct: 30, minApplied: false, plateauApplied: false, effectivePct: 30,
    })
  })
})

describe('computeFromFee (inverse: management fee entered)', () => {
  it('a 600 fee implies a 2 000 total with 1 400 ads (30%)', () => {
    expect(computeFromFee(600)).toMatchObject({ total: 2000, fee: 600, ads: 1400, pct: 30, minApplied: false })
  })
  it('a 2 000 fee resolves to the 25% tier (total 8 000, ads 6 000)', () => {
    expect(computeFromFee(2000)).toMatchObject({ total: 8000, fee: 2000, ads: 6000, pct: 25, minApplied: false })
  })
  it('flags fees below the 500 EUR minimum', () => {
    const r = computeFromFee(400)
    expect(r.minApplied).toBe(true)
  })
  it('fee + ads always equals total, and the total agrees with computeFromTotal', () => {
    for (const fee of [500, 600, 1250, 1500, 2000, 2500, 3000]) {
      const r = computeFromFee(fee)
      expect(r.fee + r.ads).toBe(r.total)
      expect(computeFromTotal(r.total).fee, `fee ${fee}`).toBe(fee)
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

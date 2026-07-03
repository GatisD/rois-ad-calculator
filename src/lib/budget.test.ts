import { describe, it, expect } from 'vitest'
import { computeFromAds, formatEUR, mgmtPctForBudget, tierForBudget, TIERS } from './budget'

describe('computeFromAds', () => {
  it('adds 30% fee on top of a 2 000 ads budget (fee 600, total 2 600)', () => {
    expect(computeFromAds(2000)).toEqual({ pct: 30, fee: 600, total: 2600 })
  })
  it('switches to 25% at a 5 000 ads budget (fee 1 250, total 6 250)', () => {
    expect(computeFromAds(5000)).toEqual({ pct: 25, fee: 1250, total: 6250 })
  })
  it('switches to 20% at a 10 000 ads budget (fee 2 000, total 12 000)', () => {
    expect(computeFromAds(10000)).toEqual({ pct: 20, fee: 2000, total: 12000 })
  })
  it('rounds the fee and keeps total = ads + fee (999 @ 30%)', () => {
    const { fee, total } = computeFromAds(999)
    expect(fee).toBe(300)
    expect(total).toBe(999 + 300)
  })
  it('handles 0 ads budget', () => {
    expect(computeFromAds(0)).toEqual({ pct: 30, fee: 0, total: 0 })
  })
})

describe('mgmtPctForBudget (tier by ads budget)', () => {
  it('ads budgets under 5 000 pay 30% fee', () => {
    expect(mgmtPctForBudget(0)).toBe(30)
    expect(mgmtPctForBudget(1000)).toBe(30)
    expect(mgmtPctForBudget(4999)).toBe(30)
  })
  it('ads budgets from 5 000 to under 10 000 pay 25%', () => {
    expect(mgmtPctForBudget(5000)).toBe(25)
    expect(mgmtPctForBudget(7500)).toBe(25)
    expect(mgmtPctForBudget(9999)).toBe(25)
  })
  it('ads budgets of 10 000 and up pay 20%', () => {
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

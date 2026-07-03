export interface FeeResult { pct: number; fee: number; total: number }

export interface Tier {
  /** Lower bound of the ads-budget band (EUR/month), inclusive. */
  min: number
  /** Upper bound (exclusive); null means open-ended top tier. */
  upTo: number | null
  /** Short label. */
  label: string
  /** Management fee percentage for this band. */
  pct: number
}

/**
 * Management-fee tiers keyed by the ads budget: the larger the monthly
 * ads budget, the lower the fee. Bands are contiguous and ordered ascending.
 */
export const TIERS: Tier[] = [
  { min: 0, upTo: 5000, label: '< 5k', pct: 30 },
  { min: 5000, upTo: 10000, label: '5-10k', pct: 25 },
  { min: 10000, upTo: null, label: '10k+', pct: 20 },
]

/** The tier a given monthly ads budget falls into. */
export function tierForBudget(ads: number): Tier {
  return TIERS.find((t) => t.upTo === null || ads < t.upTo) ?? TIERS[TIERS.length - 1]
}

/** Management percentage for a given monthly ads budget, per TIERS. */
export function mgmtPctForBudget(ads: number): number {
  return tierForBudget(ads).pct
}

/** Fee = round(ads * pct/100) on top of the ads budget; total = ads + fee. */
export function computeFromAds(ads: number): FeeResult {
  const pct = mgmtPctForBudget(ads)
  const fee = Math.round((ads * pct) / 100)
  return { pct, fee, total: ads + fee }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export interface Split { mgmt: number; ads: number }

export interface Tier {
  /** Lower bound of the budget band (EUR/month), inclusive. */
  min: number
  /** Upper bound (exclusive); null means open-ended top tier. */
  upTo: number | null
  /** Short button label. */
  label: string
  /** Management fee percentage for this band. */
  pct: number
}

/**
 * Management-fee tiers: the larger the monthly budget, the lower the
 * management share. Bands are contiguous and ordered ascending.
 */
export const TIERS: Tier[] = [
  { min: 0, upTo: 5000, label: '< 5k', pct: 30 },
  { min: 5000, upTo: 10000, label: '5-10k', pct: 25 },
  { min: 10000, upTo: null, label: '10k+', pct: 20 },
]

/** The tier a given monthly budget falls into. */
export function tierForBudget(total: number): Tier {
  return TIERS.find((t) => t.upTo === null || total < t.upTo) ?? TIERS[TIERS.length - 1]
}

/** Management percentage for a given monthly budget, per TIERS. */
export function mgmtPctForBudget(total: number): number {
  return tierForBudget(total).pct
}

/** Management = round(total * pct/100); ads = remainder so parts sum to total. */
export function computeSplit(total: number, mgmtPct: number): Split {
  const mgmt = Math.round((total * mgmtPct) / 100)
  return { mgmt, ads: total - mgmt }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

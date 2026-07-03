export interface Breakdown {
  /** Total monthly marketing budget (fee + ads). */
  total: number
  /** Monthly management fee. */
  fee: number
  /** Monthly ads spend. */
  ads: number
  /** Fee percentage the breakdown is based on. */
  pct: number
  /** True when the 500 EUR minimum fee (not the percentage) set the fee. */
  minApplied: boolean
}

export interface Tier {
  /** Lower bound of the total-budget band (EUR/month), inclusive. */
  min: number
  /** Upper bound (exclusive); null means open-ended top tier. */
  upTo: number | null
  /** Short label. */
  label: string
  /** Management fee percentage for this band. */
  pct: number
}

/**
 * Management-fee tiers keyed by the total monthly budget: the larger the
 * budget, the lower the fee share. Bands are contiguous and ordered ascending.
 */
export const TIERS: Tier[] = [
  { min: 0, upTo: 5000, label: '< 5k', pct: 30 },
  { min: 5000, upTo: 10000, label: '5-10k', pct: 25 },
  { min: 10000, upTo: null, label: '10k+', pct: 20 },
]

/** The management fee never drops below this (EUR/month). */
export const MIN_FEE = 500

/** One-time setup fee per advertising channel (EUR). */
export const SETUP_PER_CHANNEL = 749

/** The tier a given total monthly budget falls into. */
export function tierForBudget(total: number): Tier {
  return TIERS.find((t) => t.upTo === null || total < t.upTo) ?? TIERS[TIERS.length - 1]
}

/** Management percentage for a given total monthly budget, per TIERS. */
export function mgmtPctForBudget(total: number): number {
  return tierForBudget(total).pct
}

/** Total entered: fee = pct of total (min 500, never above total); ads = rest. */
export function computeFromTotal(total: number): Breakdown {
  const t = Math.max(0, total)
  const pct = mgmtPctForBudget(t)
  const raw = Math.round((t * pct) / 100)
  const fee = Math.min(t, Math.max(MIN_FEE, raw))
  return { total: t, fee, ads: t - fee, pct, minApplied: t > 0 && fee !== raw }
}

/** Ads budget entered: solve for the total whose split leaves exactly this much for ads. */
export function computeFromAds(ads: number): Breakdown {
  if (ads <= 0) return { total: 0, fee: 0, ads: 0, pct: TIERS[0].pct, minApplied: false }
  for (const t of TIERS) {
    const total = Math.round(ads / (1 - t.pct / 100))
    const fee = total - ads
    if (fee >= MIN_FEE && total >= t.min && (t.upTo === null || total < t.upTo)) {
      return { total, fee, ads, pct: t.pct, minApplied: false }
    }
  }
  const firstTierFee = Math.round(ads / (1 - TIERS[0].pct / 100)) - ads
  if (firstTierFee < MIN_FEE) {
    const total = ads + MIN_FEE
    return { total, fee: MIN_FEE, ads, pct: tierForBudget(total).pct, minApplied: true }
  }
  // Tier-boundary gap: settle on the tier the first-pass implied total lands in.
  const pct = tierForBudget(Math.round(ads / (1 - TIERS[0].pct / 100))).pct
  const total = Math.round(ads / (1 - pct / 100))
  return { total, fee: total - ads, ads, pct, minApplied: false }
}

/** Management fee entered: solve for the total this fee corresponds to. */
export function computeFromFee(fee: number): Breakdown {
  if (fee <= 0) return { total: 0, fee: 0, ads: 0, pct: TIERS[0].pct, minApplied: false }
  const minApplied = fee < MIN_FEE
  for (const t of TIERS) {
    const total = Math.round(fee / (t.pct / 100))
    if (total >= t.min && (t.upTo === null || total < t.upTo)) {
      return { total, fee, ads: total - fee, pct: t.pct, minApplied }
    }
  }
  // Tier-boundary gap: settle on the tier the first-pass implied total lands in.
  const pct = tierForBudget(Math.round(fee / (TIERS[0].pct / 100))).pct
  const total = Math.round(fee / (pct / 100))
  return { total, fee, ads: total - fee, pct, minApplied }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

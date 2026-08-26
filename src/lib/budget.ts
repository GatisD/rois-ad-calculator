export interface Breakdown {
  /** Total monthly marketing budget (fee + ads). */
  total: number
  /** Monthly management fee. */
  fee: number
  /** Monthly ads spend. */
  ads: number
  /** Nominal tier percentage the budget falls into. */
  pct: number
  /** True when the 500 EUR minimum fee (not the percentage) set the fee. */
  minApplied: boolean
  /** True when the fee is held at a lower tier's level because this tier's percentage has not caught up yet. */
  plateauApplied: boolean
  /** The fee as a share of the total, rounded - what the client actually pays. */
  effectivePct: number
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

/**
 * The highest fee any budget up to `total` would have paid.
 *
 * The tier percentage steps down at each band boundary, so the raw percentage
 * alone is not monotonic: a 4 999 EUR budget paid 1 500 EUR while 5 000 EUR paid
 * only 1 250 EUR. Carrying the previous band's ceiling forward removes that
 * cliff - the fee stays put until the new, lower percentage catches up with it.
 * Ads budgets between the two sides of the cliff were unreachable before; with
 * the carry they map onto the plateau one-to-one.
 */
function carriedFeeCeiling(total: number): number {
  let ceiling = 0
  for (const t of TIERS) {
    if (t.min > total) break
    // The largest budget this band can reach at or below `total`. For a band
    // already passed that is the band's own upper bound.
    const reach = t.upTo === null ? total : Math.min(total, t.upTo)
    ceiling = Math.max(ceiling, Math.round((reach * t.pct) / 100))
  }
  return ceiling
}

/** Fee for a given total: the carried ceiling, floored at MIN_FEE, capped at the budget. */
function feeForTotal(total: number): number {
  return Math.min(total, Math.max(MIN_FEE, carriedFeeCeiling(total)))
}

function breakdownFor(total: number): Breakdown {
  const pct = mgmtPctForBudget(total)
  const raw = Math.round((total * pct) / 100)
  const ceiling = carriedFeeCeiling(total)
  const fee = Math.min(total, Math.max(MIN_FEE, ceiling))
  return {
    total,
    fee,
    ads: total - fee,
    pct,
    minApplied: total > 0 && fee !== ceiling,
    plateauApplied: fee === ceiling && ceiling > raw,
    effectivePct: total > 0 ? Math.round((fee / total) * 100) : pct,
  }
}

/**
 * Smallest total budget whose split leaves at least `ads` for advertising.
 * feeForTotal never falls, so the ads budget never falls either and the search
 * is well defined - which is exactly what the carried ceiling buys us.
 */
function totalForAds(ads: number): number {
  let lo = 1
  let hi = 2 * ads + MIN_FEE + 2
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2)
    if (mid - feeForTotal(mid) >= ads) hi = mid
    else lo = mid + 1
  }
  return lo
}

/** Total entered: fee = the tier percentage, never below a smaller budget's fee. */
export function computeFromTotal(total: number): Breakdown {
  return breakdownFor(Math.max(0, total))
}

/** Ads budget entered: solve for the total whose split leaves exactly this much for ads. */
export function computeFromAds(ads: number): Breakdown {
  if (ads <= 0) return breakdownFor(0)
  const total = totalForAds(ads)
  const b = breakdownFor(total)
  if (b.ads === ads) return b
  // Defensive: rounding could in principle skip a value. Keep the figure the
  // client typed and stay internally consistent.
  const fee = total - ads
  return { ...b, ads, fee, effectivePct: Math.round((fee / total) * 100) }
}

/** Management fee entered: solve for the total this fee corresponds to. */
export function computeFromFee(fee: number): Breakdown {
  if (fee <= 0) return breakdownFor(0)
  const minApplied = fee < MIN_FEE
  for (const t of TIERS) {
    const total = Math.round(fee / (t.pct / 100))
    if (total >= t.min && (t.upTo === null || total < t.upTo)) {
      return { ...breakdownFor(total), fee, ads: total - fee, minApplied }
    }
  }
  // Tier-boundary gap: settle on the tier the first-pass implied total lands in.
  const pct = tierForBudget(Math.round(fee / (TIERS[0].pct / 100))).pct
  const total = Math.round(fee / (pct / 100))
  return { ...breakdownFor(total), fee, ads: total - fee, minApplied }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

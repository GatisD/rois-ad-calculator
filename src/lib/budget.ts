export interface Split { mgmt: number; ads: number }

/** Management = round(total * pct/100); ads = remainder so parts sum to total. */
export function computeSplit(total: number, mgmtPct: number): Split {
  const mgmt = Math.round((total * mgmtPct) / 100)
  return { mgmt, ads: total - mgmt }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

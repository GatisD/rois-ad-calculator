import { useState } from 'react'
import { computeSplit, formatEUR, mgmtPctForBudget, tierForBudget, TIERS } from '../lib/budget'

export default function Calculator() {
  const [total, setTotal] = useState(1000)
  // null = follow the budget tier automatically; a number = manual override
  const [override, setOverride] = useState<number | null>(null)

  const autoPct = mgmtPctForBudget(total)
  const mgmtPct = override ?? autoPct
  const adsPct = 100 - mgmtPct
  const { mgmt, ads } = computeSplit(total, mgmtPct)
  const activeTier = tierForBudget(total)
  const isManual = override !== null && override !== autoPct

  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)))
  const setBudget = (v: number) => {
    setTotal(Math.max(0, v))
    setOverride(null) // budget change re-enables auto tier
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <h1 className="font-head font-bold text-2xl">ROIS budžeta kalkulators</h1>
        <p className="text-muted text-sm mb-6">Sadali mēneša budžetu - apkalpošana un reklāma.</p>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Kopējais budžets / mēnesī</div>
            <div className="bg-panel2 border border-line rounded-xl px-4 py-3 flex items-baseline gap-2">
              <input
                type="number" min={0} value={total === 0 ? '' : total}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isFinite(v)) setBudget(v)
                }}
                className="bg-transparent outline-none font-head font-bold text-3xl w-full text-txt"
              />
              <span className="font-head font-bold text-xl text-gold">EUR</span>
            </div>
            <div className="text-xs text-muted mt-2">
              Tiers <span className="text-goldSoft font-semibold">{activeTier.label}</span> → apkalpošana{' '}
              <span className="text-goldSoft font-semibold">{autoPct}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] uppercase tracking-wide text-muted">Apkalpošana</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" min={0} max={100} value={mgmtPct === 0 ? '' : mgmtPct}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (!Number.isFinite(v)) return
                    setOverride(clampPct(v))
                  }}
                  className="bg-panel2 border border-line rounded-md w-14 text-right px-2 py-1 text-goldSoft font-head font-semibold outline-none"
                />
                <span className="text-muted text-sm">%</span>
              </div>
            </div>
            <input
              type="range" min={0} max={100} value={mgmtPct}
              onChange={(e) => setOverride(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex gap-2 mt-3">
              {TIERS.map((t) => (
                <button
                  key={t.label} onClick={() => setOverride(t.pct === autoPct ? null : t.pct)}
                  className={`flex-1 rounded-lg py-2 border transition-colors text-center leading-tight ${
                    mgmtPct === t.pct
                      ? 'bg-gold text-bg border-gold'
                      : 'bg-panel2 text-muted border-line hover:border-gold'
                  }`}
                >
                  <span className="block font-head font-semibold text-sm">{t.pct}%</span>
                  <span className={`block text-[10px] ${mgmtPct === t.pct ? 'text-bg/70' : 'text-muted'}`}>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 h-4 text-[11px]">
              {isManual ? (
                <button onClick={() => setOverride(null)} className="text-muted hover:text-gold transition-colors">
                  Manuāli iestatīts - <span className="underline">atiestatīt uz auto ({autoPct}%)</span>
                </button>
              ) : (
                <span className="text-muted">Auto pēc budžeta</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-panel2 border border-line rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Apkalpošana</div>
              <div className="font-head font-bold text-2xl">{formatEUR(mgmt)} <span className="text-gold text-base">EUR</span></div>
              <div className="text-xs text-muted mt-1">{mgmtPct}% no budžeta</div>
            </div>
            <div className="rounded-xl p-4 border border-gold bg-gradient-to-br from-gold/10 to-transparent">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Reklāmas budžets</div>
              <div className="font-head font-bold text-2xl">{formatEUR(ads)} <span className="text-gold text-base">EUR</span></div>
              <div className="text-xs text-muted mt-1">{adsPct}% no budžeta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { computeFromAds, formatEUR } from '../lib/budget'

export default function Calculator() {
  const [ads, setAds] = useState(1000)

  const { pct, fee, total } = computeFromAds(ads)

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <h1 className="font-head font-bold text-2xl">ROIS budžeta kalkulators</h1>
        <p className="text-muted text-sm mb-6">Ievadi reklāmas budžetu - apkalpošanas maksu sarēķinām mēs.</p>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Reklāmas budžets / mēnesī</div>
            <div className="bg-panel2 border border-line rounded-xl px-4 py-3 flex items-baseline gap-2">
              <input
                type="number" min={0} value={ads === 0 ? '' : ads}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  if (Number.isFinite(v)) setAds(Math.max(0, v))
                }}
                className="bg-transparent outline-none font-head font-bold text-3xl w-full text-txt"
              />
              <span className="font-head font-bold text-xl text-gold">EUR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-panel2 border border-line rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Apkalpošana</div>
              <div className="font-head font-bold text-2xl">{formatEUR(fee)} <span className="text-gold text-base">EUR</span></div>
              <div className="text-xs text-muted mt-1">{pct}% no reklāmas budžeta</div>
            </div>
            <div className="rounded-xl p-4 border border-gold bg-gradient-to-br from-gold/10 to-transparent">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Kopā mēnesī</div>
              <div className="font-head font-bold text-2xl">{formatEUR(total)} <span className="text-gold text-base">EUR</span></div>
              <div className="text-xs text-muted mt-1">reklāma + apkalpošana</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

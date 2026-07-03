import { useState } from 'react'
import {
  computeFromAds,
  computeFromFee,
  computeFromTotal,
  formatEUR,
  MIN_FEE,
  SETUP_PER_CHANNEL,
} from '../lib/budget'

type Field = 'total' | 'fee' | 'ads'

export default function Calculator() {
  // The last edited field drives the other two.
  const [source, setSource] = useState<{ field: Field; value: number }>({ field: 'total', value: 2000 })
  const [channels, setChannels] = useState(1)

  const r =
    source.field === 'total' ? computeFromTotal(source.value)
    : source.field === 'ads' ? computeFromAds(source.value)
    : computeFromFee(source.value)

  const shown = (field: Field) => (source.field === field ? source.value : r[field])
  const onEdit = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    if (Number.isFinite(v)) setSource({ field, value: Math.max(0, v) })
  }
  const setup = SETUP_PER_CHANNEL * Math.max(1, channels)

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <h1 className="font-head font-bold text-2xl">ROIS budžeta kalkulators</h1>
        <p className="text-muted text-sm mb-6">Ievadi jebkuru no summām - pārējās sarēķinām mēs.</p>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Kopējais budžets / mēnesī</div>
            <div className="bg-panel2 border border-line rounded-xl px-4 py-3 flex items-baseline gap-2">
              <input
                type="number" min={0} value={shown('total') === 0 ? '' : shown('total')}
                onChange={onEdit('total')}
                className="bg-transparent outline-none font-head font-bold text-3xl w-full text-txt"
              />
              <span className="font-head font-bold text-xl text-gold">EUR</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-panel2 border border-line rounded-xl p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Apkalpošana / mēnesī</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number" min={0} value={shown('fee') === 0 ? '' : shown('fee')}
                  onChange={onEdit('fee')}
                  className="bg-transparent outline-none font-head font-bold text-2xl w-full text-txt"
                />
                <span className="font-head font-bold text-base text-gold">EUR</span>
              </div>
              <div className="text-xs text-muted mt-1">
                {r.minApplied ? `minimālā maksa ${formatEUR(MIN_FEE)} EUR` : `${r.pct}% no budžeta`}
              </div>
            </div>
            <div className="rounded-xl p-4 border border-gold bg-gradient-to-br from-gold/10 to-transparent">
              <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Reklāmas budžets / mēnesī</div>
              <div className="flex items-baseline gap-1">
                <input
                  type="number" min={0} value={shown('ads') === 0 ? '' : shown('ads')}
                  onChange={onEdit('ads')}
                  className="bg-transparent outline-none font-head font-bold text-2xl w-full text-txt"
                />
                <span className="font-head font-bold text-base text-gold">EUR</span>
              </div>
              <div className="text-xs text-muted mt-1">aiziet reklāmā</div>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted mb-1">Setup - vienreizējs maksājums</div>
                <div className="text-xs text-muted">{formatEUR(SETUP_PER_CHANNEL)} EUR par kanālu</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted">Kanāli</span>
                <input
                  type="number" min={1} value={channels === 0 ? '' : channels}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (Number.isFinite(v)) setChannels(Math.max(0, Math.round(v)))
                  }}
                  className="bg-panel2 border border-line rounded-md w-14 text-right px-2 py-1 text-goldSoft font-head font-semibold outline-none"
                />
              </div>
            </div>
            <div className="mt-3 bg-panel2 border border-line rounded-xl px-4 py-3 flex items-baseline justify-between">
              <span className="text-[11px] uppercase tracking-wide text-muted">Setup kopā</span>
              <span className="font-head font-bold text-xl">{formatEUR(setup)} <span className="text-gold text-base">EUR</span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

# ROIS Ad Budget Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page ROIS-styled web tool that splits a total monthly budget into a management fee and an ad budget, deployed to Vercel for the team.

**Architecture:** Vite + React + TypeScript single page. A pure `lib/budget.ts` module holds the calculation and LV number formatting (unit-tested with Vitest). A single `Calculator` React component holds UI state (`total`, `mgmtPct`) and renders the controls and result cards. Zero backend.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS v3, Vitest, deployed on Vercel.

---

### Task 1: Scaffold project and tooling

**Files:**
- Create: project scaffold via Vite in `~/rois-ad-calculator` (current repo root)
- Create: `tailwind.config.js`, `postcss.config.js`, `src/index.css`
- Modify: `package.json` (add test script)

- [ ] **Step 1: Scaffold Vite React-TS into the existing repo**

The repo already exists with `docs/` and `.gitignore`. Scaffold into a temp dir then move files in to avoid clobbering.

```bash
cd ~ && npm create vite@latest rois-ad-calculator-tmp -- --template react-ts
cd ~/rois-ad-calculator-tmp && rm -rf .git
# move scaffold into the real repo (don't overwrite .gitignore/docs)
cp -R src index.html package.json tsconfig*.json vite.config.ts ~/rois-ad-calculator/
cd ~/rois-ad-calculator && rm -rf ~/rois-ad-calculator-tmp
```

- [ ] **Step 2: Install dependencies (Tailwind v3, Vitest)**

```bash
cd ~/rois-ad-calculator
npm install
npm install -D tailwindcss@3 postcss autoprefixer vitest jsdom @testing-library/react @testing-library/jest-dom
npx tailwindcss init -p
```

- [ ] **Step 3: Configure Tailwind**

Write `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#090907', panel: '#13120f', panel2: '#1b1a16', line: '#2a2823',
        gold: '#D5A134', goldSoft: '#e7c074', txt: '#f4f1ea', muted: '#9a948a',
      },
      fontFamily: {
        head: ['Poppins', 'sans-serif'],
        body: ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 4: Set up base CSS and fonts**

Replace `src/index.css` with:

```css
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Montserrat:wght@400;500;600&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { background: #090907; color: #f4f1ea; font-family: 'Montserrat', sans-serif; }
```

- [ ] **Step 5: Add test script to package.json**

Add to `"scripts"`: `"test": "vitest run"`. Add a Vitest config block to `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true },
})
```

- [ ] **Step 6: Verify dev build runs**

Run: `cd ~/rois-ad-calculator && npm run build`
Expected: build succeeds, `dist/` created.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "Scaffold Vite + React + TS + Tailwind project"
```

---

### Task 2: Budget calculation and LV formatting (TDD)

**Files:**
- Create: `src/lib/budget.ts`
- Test: `src/lib/budget.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/budget.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeSplit, formatEUR } from './budget'

describe('computeSplit', () => {
  it('splits 1000 at 30% management into 300 / 700', () => {
    expect(computeSplit(1000, 30)).toEqual({ mgmt: 300, ads: 700 })
  })
  it('sums exactly to total with rounding (1000 @ 33%)', () => {
    const { mgmt, ads } = computeSplit(1000, 33)
    expect(mgmt).toBe(330)
    expect(mgmt + ads).toBe(1000)
  })
  it('handles odd totals so parts always sum to total (999 @ 33%)', () => {
    const { mgmt, ads } = computeSplit(999, 33)
    expect(mgmt + ads).toBe(999) // 330 + 669
    expect(mgmt).toBe(330)
  })
  it('handles 0% and 100% bounds', () => {
    expect(computeSplit(500, 0)).toEqual({ mgmt: 0, ads: 500 })
    expect(computeSplit(500, 100)).toEqual({ mgmt: 500, ads: 0 })
  })
})

describe('formatEUR', () => {
  it('formats thousands with a space and no decimals', () => {
    expect(formatEUR(1000)).toBe('1 000')
    expect(formatEUR(700)).toBe('700')
    expect(formatEUR(12500)).toBe('12 500')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL - cannot find module `./budget`.

- [ ] **Step 3: Write minimal implementation**

`src/lib/budget.ts`:

```ts
export interface Split { mgmt: number; ads: number }

/** Management = round(total * pct/100); ads = remainder so parts sum to total. */
export function computeSplit(total: number, mgmtPct: number): Split {
  const mgmt = Math.round((total * mgmtPct) / 100)
  return { mgmt, ads: total - mgmt }
}

/** LV format: space as thousands separator, no decimals. EUR label added in UI. */
export function formatEUR(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all cases green).

- [ ] **Step 5: Commit**

```bash
git add src/lib/budget.ts src/lib/budget.test.ts
git commit -m "Add budget split + LV EUR formatting (TDD)"
```

---

### Task 3: Calculator UI component

**Files:**
- Create: `src/components/Calculator.tsx`
- Modify: `src/App.tsx`
- Modify: `src/main.tsx` (ensure imports `./index.css`)

- [ ] **Step 1: Write the Calculator component**

`src/components/Calculator.tsx`:

```tsx
import { useState } from 'react'
import { computeSplit, formatEUR } from '../lib/budget'

const PRESETS = [20, 30, 40]

export default function Calculator() {
  const [total, setTotal] = useState(1000)
  const [mgmtPct, setMgmtPct] = useState(30)
  const adsPct = 100 - mgmtPct
  const { mgmt, ads } = computeSplit(total, mgmtPct)

  const clampPct = (v: number) => Math.max(0, Math.min(100, Math.round(v)))

  return (
    <div className="min-h-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        <h1 className="font-head font-bold text-2xl">ROIS budžeta kalkulators</h1>
        <p className="text-muted text-sm mb-6">Sadali mēneša budžetu - apkalpošana un reklāma.</p>

        <div className="bg-panel border border-line rounded-2xl p-5 sm:p-6 space-y-6">
          {/* Total */}
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted mb-2">Kopējais budžets / mēnesī</div>
            <div className="bg-panel2 border border-line rounded-xl px-4 py-3 flex items-baseline gap-2">
              <input
                type="number" min={0} value={total}
                onChange={(e) => setTotal(Math.max(0, Number(e.target.value)))}
                className="bg-transparent outline-none font-head font-bold text-3xl w-full text-txt"
              />
              <span className="font-head font-bold text-xl text-gold">EUR</span>
            </div>
          </div>

          {/* Split control */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] uppercase tracking-wide text-muted">Apkalpošana</span>
              <div className="flex items-center gap-1">
                <input
                  type="number" min={0} max={100} value={mgmtPct}
                  onChange={(e) => setMgmtPct(clampPct(Number(e.target.value)))}
                  className="bg-panel2 border border-line rounded-md w-14 text-right px-2 py-1 text-goldSoft font-head font-semibold outline-none"
                />
                <span className="text-muted text-sm">%</span>
              </div>
            </div>
            <input
              type="range" min={0} max={100} value={mgmtPct}
              onChange={(e) => setMgmtPct(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="flex gap-2 mt-3">
              {PRESETS.map((p) => (
                <button
                  key={p} onClick={() => setMgmtPct(p)}
                  className={`flex-1 rounded-lg py-2 text-sm font-head font-semibold border transition-colors ${
                    mgmtPct === p
                      ? 'bg-gold text-bg border-gold'
                      : 'bg-panel2 text-muted border-line hover:border-gold'
                  }`}
                >{p}%</button>
              ))}
            </div>
          </div>

          {/* Results */}
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
```

- [ ] **Step 2: Wire into App**

Replace `src/App.tsx`:

```tsx
import Calculator from './components/Calculator'

export default function App() {
  return <Calculator />
}
```

Ensure `src/main.tsx` imports `'./index.css'` (Vite scaffold already does).

- [ ] **Step 3: Verify build and dev render**

Run: `npm run build`
Expected: type-checks and builds with no errors.

Then run `npm run dev` and manually verify in browser:
- Default shows 1 000 EUR, 30% → Apkalpošana 300 EUR, Reklāma 700 EUR
- Slider, % input, and preset buttons all update both cards in sync
- Active preset button highlights gold

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "Add ROIS-styled Calculator UI (layout A, presets)"
```

---

### Task 4: Deploy to GitHub + Vercel

**Files:**
- Create: `vercel.json` (optional - Vite is auto-detected, include for explicitness)
- Create: `README.md`

- [ ] **Step 1: Add README and vercel.json**

`README.md`:

```md
# ROIS reklāmu budžeta kalkulators

Iekšējais rīks: sadali klienta mēneša budžetu starp apkalpošanas maksu un reklāmas budžetu.

## Lokāli
npm install && npm run dev

## Build
npm run build
```

`vercel.json`:

```json
{ "framework": "vite", "buildCommand": "npm run build", "outputDirectory": "dist" }
```

- [ ] **Step 2: Commit**

```bash
git add README.md vercel.json && git commit -m "Add README and Vercel config"
```

- [ ] **Step 3: Create public GitHub repo and push**

```bash
cd ~/rois-ad-calculator
gh repo create rois-ad-calculator --public --source=. --remote=origin --push
```
Expected: repo created at github.com/GatisD/rois-ad-calculator, branch pushed.

- [ ] **Step 4: Deploy to Vercel**

```bash
cd ~/rois-ad-calculator
npx vercel --prod --yes
```
Expected: deployment URL printed. If `vercel` is not authenticated, run `npx vercel login` first.
(Alternative: import the GitHub repo at vercel.com/new for auto-deploys on push.)

- [ ] **Step 5: Verify live URL**

Open the printed Vercel URL, confirm the calculator renders and defaults to 1 000 EUR / 300 / 700, then share the link with colleagues.

---

## Self-Review notes

- **Spec coverage:** Total input + slider + manual % + presets (Task 3); 2-level split with exact-sum rounding (Task 2); LV `1 000 EUR` format (Task 2); ROIS dark/gold theme + Poppins/Montserrat (Task 1 + 3); Vite/React/TS/Tailwind, zero backend (Task 1); Git public + Vercel, Gatis as author already set in repo config (Task 4). All covered.
- **Out of scope** (channels, forecasts, lead form, PDF, multi-lang) intentionally absent. ✓
- **Type consistency:** `computeSplit` returns `{ mgmt, ads }`; `formatEUR(number): string` - used identically in Task 3. ✓

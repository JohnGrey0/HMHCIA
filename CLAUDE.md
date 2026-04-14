# How Much House Can I Afford? — Calculator

## Project Overview

A static single-page HTML/CSS/JS application that helps users determine what home price they can realistically afford. It goes well beyond a basic mortgage calculator by including DTI analysis, PMI projections, post-purchase financial health checks, equity milestones, rate sensitivity analysis, scenario comparison, and a **Bank vs. Reality** budget view that contrasts gross-income DTI with net-income real spending.

**Tech stack:** Vanilla HTML + CSS + JavaScript (no build tools, no framework). Chart.js loaded via CDN for visualizations.

## File Structure

```
index.html          — Single-page app markup (~380 lines)
styles.css          — Full stylesheet with dark/light theme support (~810 lines)
js/data.js          — State-level property tax & insurance rates, defaults (~77 lines)
js/app.js           — All application logic, calculations, rendering (~1300 lines)
prompt.md           — Original specification / requirements document
```

## Key Features Implemented

- **Two calculation modes:** "I know my target price" (forward) and "I know my monthly budget" (backward/reverse)
- **Affordability tiers:** Conservative (25/30 DTI), Moderate (28/36), Maximum (31/43)
- **Bank vs. Reality:** Side-by-side comparison of gross-income DTI (bank view) vs. net-income real budget (your reality), with current and projected spending breakdowns
- **Monthly Bills input:** Captures real living costs (food, utilities, subscriptions) separately from debt payments, showing the full budget picture
- **State-aware:** Auto-populates property tax and insurance rates for all 50 states + DC
- **Opt-in geolocation:** "Detect my state" button (user-initiated, not automatic) via ipapi.co
- **PMI analysis:** Calculates when PMI drops off and total PMI cost
- **Post-purchase health check:** Emergency reserve analysis (3-6 month threshold)
- **Breathing room:** Monthly cash flow analysis after all obligations
- **Down payment timeline:** Savings gap + monthly savings projection
- **Rate sensitivity chart:** +/- 2% rate impact visualization (filters out near-zero rates)
- **Equity milestones:** Year 1/5/10/15/30 with optional 3% appreciation toggle
- **Scenario comparison:** Save up to 3 scenarios side-by-side
- **Dark/light theme:** Persisted via localStorage, donut chart respects theme
- **Input persistence:** Inputs saved to localStorage after each calculation; restored on return visits. First visit gets randomized realistic defaults. "Randomize" button available anytime.
- **Inline validation:** Themed error messages displayed inline (no native `alert()`)
- **Tooltips on dashboard:** "i" icons with detailed calculation breakdowns
- **"How is this calculated?" explainers:** Expandable sections showing exact formulas used

## Architecture Notes

- All calculation logic lives in `calculate()` which returns a single result object consumed by all `render*()` functions.
- Core math functions: `monthlyPayment()`, `maxLoanFromPayment()`, `amortizationBalance()`, `maxHomePrice()` — all handle the zero-rate edge case.
- Chart.js instances (`donutChart`, `rateBarChart`, `equityBarChart`) are tracked globally and `.destroy()`ed before re-creation to prevent memory leaks.
- Currency inputs use `inputmode="numeric"` with blur/focus formatting (commas on blur, raw number on focus).
- State data is a static object in `data.js` with `taxRate` and `insRate` as decimal values.
- `realityBudget` object in results carries all gross-vs-net analysis: tax wedge, current bills ratio, projected bills ratio.
- Input persistence uses a `SAVE_KEY` in localStorage with all input IDs serialized as JSON.

## Things Done Well

1. **Comprehensive financial modeling** — This isn't a toy calculator. It covers DTI (front & back), PMI drop-off, post-purchase reserves, breathing room, equity projections, rate sensitivity, and now gross-vs-net budget reality. Very few online calculators do all of this in one place.

2. **Clean separation of concerns** — `data.js` holds static data, `app.js` holds logic, calculation is separated from rendering. The `calculate()` function is pure (takes inputs, returns a result object) making it testable.

3. **Solid math** — The amortization, max-home-price-from-payment, and PMI drop-off calculations are correct. Zero-rate edge cases are handled. Input clamping prevents NaN/Infinity from propagating.

4. **Thoughtful UX** — The forward/backward mode toggle, custom down payment option, "How is this calculated?" explainers, tooltips showing exact arithmetic, the readiness dashboard, and the Bank vs. Reality comparison all show real care for the end user.

5. **Dark/light theming** — Well-implemented with CSS custom properties. Theme preference persists. Donut chart center text reads theme colors via `getComputedStyle()`.

6. **Responsive design** — Breakpoints at 768px and 480px gracefully reflow the grid layouts from multi-column to single-column.

7. **State data completeness** — All 50 states + DC with sourced tax and insurance rates. The data is well-documented with sources cited.

8. **Input validation** — Guardrails catch unrealistic values ($50M+ price, debts exceeding income, etc.) with inline themed error messages.

9. **Accessibility considerations** — `tabindex="0"` on tooltip triggers for keyboard access, semantic HTML with `<header>`, `<main>`, `<footer>`, `<section>`, `<details>/<summary>`.

10. **No unnecessary dependencies** — Vanilla JS with only Chart.js as an external dependency. No build step needed.

## Things to Improve

### Code Quality

1. **No tests** — There are zero unit tests. The core math functions (`monthlyPayment`, `maxHomePrice`, `amortizationBalance`) are pure and highly testable. Add at least a basic test suite.

2. **Large monolithic app.js (~1300 lines)** — Consider splitting into modules: `math.js` (core calculations), `render.js` (DOM rendering), `ui.js` (event handlers, mode toggling), `charts.js` (Chart.js wrappers).

3. **Global state** — `lastResult`, `scenarios`, chart instances, and the `$`/`$$` helpers are all globals. A simple app state object or module pattern would reduce pollution.

4. **HTML built as string concatenation** — All `render*()` functions build HTML via template literals with `innerHTML`. This works but is fragile (no escaping, hard to maintain, potential XSS if any user input were reflected unsanitized). Consider template elements or a lightweight templating approach for complex sections.

5. **Hardcoded colors in chart JS** — Chart bar colors like `'#2563eb'`, `'#16a34a'`, `'#dc2626'` are still duplicated from CSS. Consider reading them from CSS custom properties via `getComputedStyle()` for full theme consistency.

6. **Vague commit messages** — All commits say "Updated". Use descriptive messages that explain what changed and why.

### Functionality

7. **No URL state / shareable links** — While inputs persist in localStorage, they aren't encoded in the URL. Consider encoding key inputs in the URL hash so users can share specific scenarios.

## Development

To run locally, just open `index.html` in a browser. No build step or server required. For development with live reload, use any static file server (e.g., `npx serve` or VS Code Live Server extension).

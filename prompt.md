# How Much House Can I Afford? — Calculator App

## Overview
Build a static **HTML / JavaScript / CSS** single-page application that helps a household determine what home price range they can realistically afford — now and in the future.

---

## User Inputs

### 1. Household Income
- Collect **after-tax/deductions bi-weekly take-home pay** (per earner or combined).
- Extrapolate to monthly and annual real cash income.

### 2. Liquid Assets
- **Cash on hand / savings** available for a down payment and closing costs.

### 3. Existing Home & Mortgage (optional section)
- Current home's estimated market value.
- Outstanding mortgage balance.
- Auto-calculate **home equity** (market value − mortgage balance).
- Factor equity into available funds when selling to buy the next home.

### 4. Monthly Savings Capacity
- How much of their take-home income they can **realistically save per month** starting today.
- Used to project timelines for reaching a down-payment or closing-cost goal.
- Optionally show a breakdown: income minus estimated monthly expenses = available savings.

### 5. Target Home Price & Down Payment Goal
- User enters a **desired / dream home price** (e.g., $800,000).
- User selects or enters a **desired down payment percentage** (e.g., 20%).
- Auto-calculate the **down payment dollar amount** (e.g., $160,000 on an $800k home).
- Show the gap between current available funds (cash + equity) and the down payment + closing costs target.
- Feed the gap into the savings timeline: "At $X/month savings, you'll reach your down payment goal in Y months."

### 6. U.S. State Selection
- User selects their **state** from a dropdown.
- Used to look up state-specific property tax rates and homeowner's insurance averages.
- These values auto-populate but remain **user-adjustable** as overrides.

---

## Calculations & Output

### Affordability Tiers
Using standard lending guidelines (e.g., 28/36 DTI rules) and current conventional mortgage interest rates:

| Tier | Description |
|------|-------------|
| **Minimum** | Conservative estimate — comfortable with large safety margin |
| **Median** | Moderate estimate — typical recommended range |
| **Maximum** | Upper bound — still technically feasible but tight |

### Feasibility Analysis for Target Home
- Compare the target price against the affordability tiers.
- If the target exceeds current affordability:
  - Show **how long it would take** to save/grow into that price point.
  - Project scenarios (e.g., saving X per month, equity growth, rate changes).

### Scenario Projections
- **Current**: What can the user afford right now?
- **Future**: Timeline projections showing when the target becomes realistic under various saving rates or income-growth assumptions.

---

## Differentiating Features (things most calculators skip)

### 1. PMI Auto-Calculation & Drop-Off Point
- If down payment is < 20%, auto-calculate **Private Mortgage Insurance** (~0.5–1.5% of loan/year based on LTV and credit tier).
- Show **when PMI drops off** (at 80% LTV) and how many months/payments that takes.
- Show total PMI cost over that period — makes the 10% vs 20% down decision crystal clear.

### 2. Post-Purchase Financial Health Check
- After subtracting down payment + closing costs from available funds, show **remaining liquid reserves**.
- Flag whether the user still has a **3–6 month emergency fund** post-purchase.
- Color-coded: green (6+ months), yellow (3–6), red (< 3 months).

### 3. True Monthly Cost Breakdown (not just P&I)
- Visual **donut/pie chart** breaking out: Principal, Interest, Property Tax, Insurance, PMI, HOA (optional input).
- Show the **total true monthly housing cost** vs. just the mortgage payment — most calculators bury this.

### 4. Existing Debt & Real DTI Calculation
- Optional input for **existing monthly debts** (car payment, student loans, credit cards, etc.).
- Calculate the **actual back-end DTI ratio** (all debts + housing / gross income).
- Show where the user lands against lender thresholds (28% front-end / 36% back-end, and FHA's 43% max).

### 5. Side-by-Side Scenario Comparison
- Let the user **compare 2–3 scenarios** simultaneously (e.g., $600k @ 10% down vs. $800k @ 20% down).
- Display results in a comparison table or card layout.

### 7. Interest Rate Sensitivity Slider
- "What if rates change?" slider: show how **±1–2%** rate movement impacts monthly payment and total interest paid over the life of the loan.
- A simple bar chart showing the difference.

### 8. Equity Milestones
- Show projected equity position at **year 1, 5, 10, 15, 30** (accounting for principal paydown only — not appreciation, to stay conservative).
- Optional: toggle to include a modest appreciation assumption (e.g., 3%/year).

### 9. Monthly Breathing Room
- After all housing costs, show **what's left of monthly take-home income**.
- Categorize: comfortable (> 30% left), manageable (15–30%), tight (< 15%).

---

## UI/UX Requirements
- Clean, modern, responsive single-page layout.
- Inputs grouped into logical sections with clear labels.
- Results displayed with visual indicators (progress bars, tier cards, timeline chart).
- All logic runs client-side — no backend required.

---

## Key Assumptions to Bake In
- Conventional 30-year fixed mortgage.
- Default interest rate pulled from a reasonable current estimate (user-adjustable).
- Down-payment percentage input (with common presets: 3%, 5%, 10%, 20%, or custom).
- Closing costs estimate (~2-5% of purchase price, user-adjustable).

---

## State-Level Property Tax & Insurance Data

### Property Tax Rates by State
Embed a **built-in lookup table** of effective property tax rates by U.S. state (sourced from U.S. Census / Tax Foundation data). Example subset:

| State | Effective Property Tax Rate |
|-------|----------------------------|
| AL | 0.41% |
| AK | 1.19% |
| AZ | 0.62% |
| AR | 0.62% |
| CA | 0.74% |
| CO | 0.51% |
| CT | 2.15% |
| DE | 0.57% |
| FL | 0.89% |
| GA | 0.92% |
| HI | 0.28% |
| ID | 0.69% |
| IL | 2.27% |
| IN | 0.85% |
| IA | 1.57% |
| KS | 1.41% |
| KY | 0.86% |
| LA | 0.55% |
| ME | 1.36% |
| MD | 1.09% |
| MA | 1.23% |
| MI | 1.54% |
| MN | 1.12% |
| MS | 0.81% |
| MO | 0.97% |
| MT | 0.84% |
| NE | 1.73% |
| NV | 0.60% |
| NH | 2.18% |
| NJ | 2.49% |
| NM | 0.80% |
| NY | 1.72% |
| NC | 0.84% |
| ND | 0.98% |
| OH | 1.56% |
| OK | 0.90% |
| OR | 0.97% |
| PA | 1.58% |
| RI | 1.63% |
| SC | 0.57% |
| SD | 1.31% |
| TN | 0.71% |
| TX | 1.80% |
| UT | 0.63% |
| VT | 1.90% |
| VA | 0.82% |
| WA | 0.98% |
| WV | 0.58% |
| WI | 1.85% |
| WY | 0.61% |
| DC | 0.56% |

> Full 50-state + DC table will be embedded in the JS source. Rates are approximate effective rates and user can override.

### Homeowner's Insurance Averages by State
Embed a similar **built-in lookup table** of average annual homeowner's insurance premiums (or as a percentage of home value) by state. Source from NAIC/Insurance Information Institute data.

> As a fallback default, use **0.35%–0.50% of home value** annually, auto-adjusted when a state is selected.

### Alternative: Free APIs / Data Sources to Consider
- **No reliable free real-time API** exists for property tax rates at the state level — a static table is the most maintainable approach.
- For insurance, same recommendation: static averages are more reliable than depending on a third-party API that could go down.
- Data should be versioned (e.g., "Rates as of 2025") with a note to the user that they can override.
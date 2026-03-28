/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   How Much House — Application Logic
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ── Utility helpers ──────────────────────────────
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => (n * 100).toFixed(1) + '%';
const tip = (text) => `<span class="fof-tip" tabindex="0"><span class="fof-tip-icon">i</span><span class="fof-tip-body">${text}</span></span>`;
const parseNum = (str) => {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^0-9.\-]/g, '')) || 0;
};

// ── State dropdown population ────────────────────
function populateStateDropdown() {
  const sel = $('#stateSelect');
  const sorted = Object.entries(STATE_DATA).sort((a, b) => a[1].name.localeCompare(b[1].name));
  sorted.forEach(([code, s]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = `${s.name} (${code})`;
    sel.appendChild(opt);
  });
  sel.value = 'NH'; // Default to New Hampshire
  updateStateRates();
}

function updateStateRates() {
  const code = $('#stateSelect').value;
  const s = STATE_DATA[code];
  if (s) {
    $('#propertyTaxRate').value = (s.taxRate * 100).toFixed(2);
    $('#insuranceRate').value = (s.insRate * 100).toFixed(2);
  }
}

// ── Currency input formatting ────────────────────
function setupCurrencyInputs() {
  document.querySelectorAll('input[inputmode="numeric"]').forEach(input => {
    input.addEventListener('blur', () => {
      const val = parseNum(input.value);
      if (val > 0) {
        input.value = new Intl.NumberFormat('en-US').format(val);
      }
    });
    input.addEventListener('focus', () => {
      const val = parseNum(input.value);
      input.value = val > 0 ? val : '';
    });
  });
}

// ── Collapsible: existing home ───────────────────
function setupExistingHome() {
  const cb = $('#hasExistingHome');
  const fields = $('#existingHomeFields');
  const msg = $('#noHomeMessage');
  cb.addEventListener('change', () => {
    fields.classList.toggle('hidden', !cb.checked);
    if (msg) msg.classList.toggle('hidden', cb.checked);
  });

  ['currentHomeValue', 'mortgageBalance'].forEach(id => {
    $(`#${id}`).addEventListener('input', updateEquityDisplay);
  });
}

function updateEquityDisplay() {
  const value = parseNum($('#currentHomeValue').value);
  const balance = parseNum($('#mortgageBalance').value);
  const equity = Math.max(0, value - balance);
  $('#equityDisplay').innerHTML = `Estimated Equity: <strong>${fmt(equity)}</strong>`;
}

// ── Down payment custom toggle ───────────────────
function setupDownPayment() {
  const sel = $('#downPaymentPct');
  const custom = $('#customDownField');
  sel.addEventListener('change', () => {
    custom.classList.toggle('hidden', sel.value !== 'custom');
    updateDpSummary();
  });
  $('#targetPrice').addEventListener('input', updateDpSummary);
  $('#customDownPct').addEventListener('input', updateDpSummary);

  // Backward mode down payment
  const bSel = $('#backwardDownPct');
  const bCustom = $('#customBackwardDownField');
  bSel.addEventListener('change', () => {
    bCustom.classList.toggle('hidden', bSel.value !== 'custom');
  });
}

function getDownPct() {
  if (getCalcMode() === 'backward') {
    const sel = $('#backwardDownPct');
    if (sel.value === 'custom') {
      return (parseFloat($('#customBackwardDownPct').value) || 20) / 100;
    }
    return parseFloat(sel.value);
  }
  const sel = $('#downPaymentPct');
  if (sel.value === 'custom') {
    return (parseFloat($('#customDownPct').value) || 20) / 100;
  }
  return parseFloat(sel.value);
}

function updateDpSummary() {
  const target = parseNum($('#targetPrice').value);
  const pct = getDownPct();
  const dp = target * pct;
  const el = $('#dpSummary');
  if (target > 0) {
    el.textContent = `Down payment: ${fmtPct(pct)} of ${fmt(target)} = ${fmt(dp)}`;
  } else {
    el.textContent = '';
  }
}

// ── Calc mode ────────────────────────────────────
function getCalcMode() {
  return $('#modeBackwardBtn').classList.contains('active') ? 'backward' : 'forward';
}

function setupCalcMode() {
  const fwdBtn = $('#modeForwardBtn');
  const bwdBtn = $('#modeBackwardBtn');
  const fwdFields = $('#forwardFields');
  const bwdFields = $('#backwardFields');

  function setMode(mode) {
    const isForward = mode === 'forward';
    fwdBtn.classList.toggle('active', isForward);
    bwdBtn.classList.toggle('active', !isForward);
    fwdFields.classList.toggle('hidden', !isForward);
    bwdFields.classList.toggle('hidden', isForward);
  }

  fwdBtn.addEventListener('click', () => setMode('forward'));
  bwdBtn.addEventListener('click', () => setMode('backward'));
}

// ── Core math ────────────────────────────────────
function monthlyPayment(principal, annualRate, years) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal / n;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function maxLoanFromPayment(maxPI, annualRate, years) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return maxPI * n;
  return maxPI * (Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n));
}

function amortizationBalance(principal, annualRate, years, afterMonths) {
  const r = annualRate / 12;
  const n = years * 12;
  if (r === 0) return principal * (1 - afterMonths / n);
  const payment = monthlyPayment(principal, annualRate, years);
  return principal * Math.pow(1 + r, afterMonths) - payment * (Math.pow(1 + r, afterMonths) - 1) / r;
}

function maxHomePrice(maxHousingPayment, annualRate, years, downPct, taxRate, insRate, pmiRate, hoaMonthly) {
  const r = annualRate / 12;
  const n = years * 12;
  let piCoeff;
  if (r === 0) {
    piCoeff = (1 - downPct) / n;
  } else {
    piCoeff = (1 - downPct) * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  const taxCoeff = taxRate / 12;
  const insCoeff = insRate / 12;
  const pmiCoeff = downPct < 0.2 ? (1 - downPct) * pmiRate / 12 : 0;
  const totalCoeff = piCoeff + taxCoeff + insCoeff + pmiCoeff;
  const available = maxHousingPayment - hoaMonthly;
  if (available <= 0 || totalCoeff <= 0) return 0;
  return available / totalCoeff;
}

// ── Gather all inputs ────────────────────────────
function getInputs() {
  const calcMode = getCalcMode();
  const grossAnnual = parseNum($('#grossIncome').value);
  const biweekly = parseNum($('#biweeklyTakeHome').value);
  const cashOnHand = parseNum($('#cashOnHand').value);
  const hasHome = $('#hasExistingHome').checked;
  const homeValue = hasHome ? parseNum($('#currentHomeValue').value) : 0;
  const mortBal = hasHome ? parseNum($('#mortgageBalance').value) : 0;
  const equity = Math.max(0, homeValue - mortBal);
  const monthlySavings = parseNum($('#monthlySavings').value);
  const downPct = getDownPct();
  const annualRate = parseFloat($('#interestRate').value) / 100;
  const taxRate = parseFloat($('#propertyTaxRate').value) / 100;
  const insRate = parseFloat($('#insuranceRate').value) / 100;
  const closingPct = parseFloat($('#closingCostPct').value) / 100;
  const monthlyDebts = parseNum($('#monthlyDebts').value);
  const hoa = parseNum($('#hoaMonthly').value);
  const comfortPayment = parseNum($('#comfortPayment').value);
  const targetPriceInput = parseNum($('#targetPrice').value);

  const grossMonthly = grossAnnual / 12;
  const netMonthly = biweekly * 26 / 12;
  const totalFunds = cashOnHand + equity;

  // In backward mode, derive target price from comfortable payment
  let targetPrice;
  if (calcMode === 'backward' && comfortPayment > 0) {
    targetPrice = maxHomePrice(comfortPayment, annualRate, DEFAULTS.loanTermYears, downPct, taxRate, insRate, DEFAULTS.pmiRate, hoa);
    targetPrice = Math.max(0, Math.round(targetPrice));
  } else {
    targetPrice = targetPriceInput;
  }

  return {
    calcMode, grossAnnual, grossMonthly, biweekly, netMonthly,
    cashOnHand, equity, totalFunds, monthlySavings,
    targetPrice, downPct, annualRate, taxRate, insRate,
    closingPct, monthlyDebts, hoa, comfortPayment
  };
}

// ── Main calculation ─────────────────────────────
function calculate() {
  const inp = getInputs();
  const years = DEFAULTS.loanTermYears;
  const pmiRate = DEFAULTS.pmiRate;

  // ── Affordability tiers ──
  const tiers = [
    { key: 'conservative', frontDTI: DEFAULTS.dtiConservativeFront, backDTI: DEFAULTS.dtiConservativeBack },
    { key: 'moderate',     frontDTI: DEFAULTS.dtiModerateFront,     backDTI: DEFAULTS.dtiModerateBack },
    { key: 'aggressive',   frontDTI: DEFAULTS.dtiAggressiveFront,   backDTI: DEFAULTS.dtiAggressiveBack },
  ];

  const tierResults = tiers.map(t => {
    const maxFront = inp.grossMonthly * t.frontDTI;
    const maxBack = inp.grossMonthly * t.backDTI - inp.monthlyDebts;
    const maxHousing = Math.min(maxFront, maxBack);
    const price = maxHomePrice(maxHousing, inp.annualRate, years, inp.downPct, inp.taxRate, inp.insRate, pmiRate, inp.hoa);
    return { ...t, maxHousing, price: Math.max(0, price) };
  });

  // ── Target analysis ──
  const dpDollars = inp.targetPrice * inp.downPct;
  const closingDollars = inp.targetPrice * inp.closingPct;
  const totalNeeded = dpDollars + closingDollars;
  const fundGap = Math.max(0, totalNeeded - inp.totalFunds);
  const loanAmount = inp.targetPrice * (1 - inp.downPct);
  const pi = monthlyPayment(loanAmount, inp.annualRate, years);
  const taxMonthly = inp.targetPrice * inp.taxRate / 12;
  const insMonthly = inp.targetPrice * inp.insRate / 12;
  const pmiMonthly = inp.downPct < 0.2 ? loanAmount * pmiRate / 12 : 0;
  const totalHousing = pi + taxMonthly + insMonthly + pmiMonthly + inp.hoa;
  const frontDTI = inp.grossMonthly > 0 ? totalHousing / inp.grossMonthly : 0;
  const backDTI = inp.grossMonthly > 0 ? (totalHousing + inp.monthlyDebts) / inp.grossMonthly : 0;

  // ── PMI analysis ──
  let pmiDropMonth = 0;
  let totalPMI = 0;
  if (pmiMonthly > 0) {
    for (let m = 1; m <= years * 12; m++) {
      const bal = amortizationBalance(loanAmount, inp.annualRate, years, m);
      totalPMI += pmiMonthly;
      if (bal <= inp.targetPrice * DEFAULTS.pmiThresholdLTV) {
        pmiDropMonth = m;
        break;
      }
    }
    if (pmiDropMonth === 0) {
      pmiDropMonth = years * 12;
    }
  }

  // ── Post-purchase reserves ──
  const remainingReserves = inp.totalFunds - totalNeeded;
  const monthsOfReserves = totalHousing > 0 ? remainingReserves / totalHousing : 0;

  // ── Breathing room ──
  const netAfterHousing = inp.netMonthly - totalHousing - inp.monthlyDebts;
  const breathingPct = inp.netMonthly > 0 ? netAfterHousing / inp.netMonthly : 0;

  // ── Savings timeline ──
  const monthsToSave = (inp.monthlySavings > 0 && fundGap > 0) ? Math.ceil(fundGap / inp.monthlySavings) : 0;

  // ── Rate sensitivity ──
  const rateSteps = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
  const rateSensitivity = rateSteps.map(delta => {
    const r = Math.max(0.001, inp.annualRate + delta / 100);
    const payment = monthlyPayment(loanAmount, r, years);
    const totalInterest = payment * years * 12 - loanAmount;
    return { delta, rate: r, payment, totalInterest, totalHousing: payment + taxMonthly + insMonthly + (inp.downPct < 0.2 ? pmiMonthly : 0) + inp.hoa };
  });

  // ── Equity milestones ──
  const milestoneYears = [1, 5, 10, 15, 30];
  const equityMilestones = milestoneYears.map(y => {
    const months = y * 12;
    const bal = Math.max(0, amortizationBalance(loanAmount, inp.annualRate, years, months));
    const equityNoAppreciation = inp.targetPrice - bal;
    const valueWithAppreciation = inp.targetPrice * Math.pow(1 + DEFAULTS.appreciationRate, y);
    const equityWithAppreciation = valueWithAppreciation - bal;
    return { year: y, balance: bal, equityBase: equityNoAppreciation, equityAppreciated: equityWithAppreciation, homeValueAppreciated: valueWithAppreciation };
  });

  // ── Budget-based affordability (from comfortable payment) ──
  let budgetPrice = 0;
  if (inp.comfortPayment > 0 && inp.calcMode === 'forward') {
    budgetPrice = maxHomePrice(inp.comfortPayment, inp.annualRate, years, inp.downPct, inp.taxRate, inp.insRate, pmiRate, inp.hoa);
    budgetPrice = Math.max(0, budgetPrice);
  }

  return {
    inp, tierResults, budgetPrice, dpDollars, closingDollars, totalNeeded, fundGap,
    loanAmount, pi, taxMonthly, insMonthly, pmiMonthly, totalHousing,
    frontDTI, backDTI, pmiDropMonth, totalPMI,
    remainingReserves, monthsOfReserves,
    netAfterHousing, breathingPct,
    monthsToSave, rateSensitivity, equityMilestones
  };
}

// ── Chart instances (for cleanup) ────────────────
let donutChart = null;
let rateBarChart = null;
let equityBarChart = null;

// ── Render results ───────────────────────────────
function renderResults(res) {
  $('#results').classList.remove('hidden');

  renderDashboard(res);
  renderTiers(res);
  renderCostBreakdown(res);
  renderDTI(res);
  renderPMI(res);
  renderHealth(res);
  renderBreathing(res);
  renderTimeline(res);
  renderRateSensitivity(res);
  renderEquity(res);
  renderExplainers(res);

  $('#saveScenarioBtn').disabled = false;
  $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Readiness Dashboard ──────────────────────────
function renderDashboard(res) {
  const el = $('#dashboardContent');
  const isBackward = res.inp.calcMode === 'backward';
  const canBuyNow = res.fundGap <= 0 && res.backDTI <= 0.43;
  const canFundNow = res.fundGap <= 0;

  // Determine verdict
  let verdictClass, verdictText, verdictSub;
  if (canBuyNow) {
    verdictClass = 'verdict-ready';
    verdictText = '✓ Ready to Buy Now';
    verdictSub = isBackward
      ? `At ${fmt(res.inp.comfortPayment)}/mo, you can afford ${fmt(res.inp.targetPrice)}. You have enough funds and your debt ratios are within limits.`
      : `You have enough funds and your debt ratios are within limits for ${fmt(res.inp.targetPrice)}.`;
  } else if (canFundNow && res.backDTI > 0.43) {
    verdictClass = 'verdict-not-yet';
    verdictText = '✗ Funds OK, but DTI Too High';
    verdictSub = `You have enough cash, but your debt-to-income ratio (${fmtPct(res.backDTI)}) exceeds the 43% max. Reduce debts or increase income.`;
  } else {
    const years = Math.floor(res.monthsToSave / 12);
    const months = res.monthsToSave % 12;
    const timeStr = res.inp.monthlySavings > 0
      ? (years > 0 ? `~${years} yr${years > 1 ? 's' : ''}${months > 0 ? ` ${months} mo` : ''}` : `~${months} mo`)
      : 'unknown (set monthly savings)';
    if (res.monthsToSave > 0 && res.monthsToSave <= 24) {
      verdictClass = 'verdict-close';
      verdictText = '⏳ Almost There';
      verdictSub = `You need ${fmt(res.fundGap)} more. At ${fmt(res.inp.monthlySavings)}/mo savings → ${timeStr} to go.`;
    } else {
      verdictClass = 'verdict-not-yet';
      verdictText = '⏳ Not Yet — But Here\'s the Plan';
      verdictSub = `You need ${fmt(res.fundGap)} more. At ${fmt(res.inp.monthlySavings)}/mo savings → ${timeStr} to reach your goal.`;
    }
  }

  // Flow of funds breakdown
  const equityLine = res.inp.equity > 0
    ? `<div class="fof-item"><div class="fof-label">Home Equity (from sale)</div><div class="fof-value">${fmt(res.inp.equity)} ${tip(`${fmt(res.inp.homeValue)} market value − ${fmt(res.inp.mortgageBalance)} mortgage = ${fmt(res.inp.equity)}`)}</div></div>`
    : '';

  const surplus = res.inp.totalFunds - res.totalNeeded;
  const totalFundsTip = res.inp.equity > 0
    ? `${fmt(res.inp.cashOnHand)} cash + ${fmt(res.inp.equity)} equity = ${fmt(res.inp.totalFunds)}`
    : 'Equals your cash/savings on hand';
  const surplusTip = surplus >= 0
    ? `${fmt(res.inp.totalFunds)} total funds − ${fmt(res.dpDollars)} down − ${fmt(res.closingDollars)} closing = ${fmt(surplus)}`
    : `${fmt(res.inp.totalFunds)} total funds − ${fmt(res.dpDollars)} down − ${fmt(res.closingDollars)} closing = −${fmt(Math.abs(surplus))} shortfall`;

  // Build housing cost breakdown string for tooltip
  const housingParts = [`${fmt(res.pi)} P&I`, `${fmt(res.taxMonthly)} tax`, `${fmt(res.insMonthly)} ins`];
  if (res.pmiMonthly > 0) housingParts.push(`${fmt(res.pmiMonthly)} PMI`);
  if (res.inp.hoa > 0) housingParts.push(`${fmt(res.inp.hoa)} HOA`);
  const housingTip = housingParts.join(' + ') + ` = ${fmt(res.totalHousing)}`;

  const leftOver = Math.max(0, res.netAfterHousing);
  const leftOverTip = `${fmt(res.inp.netMonthly)} take-home − ${fmt(res.totalHousing)} housing − ${fmt(res.inp.monthlyDebts)} debts = ${fmt(leftOver)} (${fmtPct(Math.max(0, res.breathingPct))} of take-home)`;

  const comfortLine = (res.inp.comfortPayment > 0 && res.inp.calcMode === 'forward')
    ? `<div class="fof-item ${res.totalHousing <= res.inp.comfortPayment ? 'fof-good' : 'fof-bad'}"><div class="fof-label">Your Comfort Target</div><div class="fof-value">${fmt(res.inp.comfortPayment)} ${tip(`You said you'd be comfortable paying ${fmt(res.inp.comfortPayment)}/mo. Actual housing cost is ${fmt(res.totalHousing)}/mo — ${res.totalHousing <= res.inp.comfortPayment ? 'within' : 'over'} your comfort zone.`)}</div></div>`
    : '';

  el.innerHTML = `
    <div class="dashboard-header">
      <div>
        <div class="dashboard-verdict ${verdictClass}">${verdictText}</div>
        <div class="dashboard-subtitle">${verdictSub}</div>
      </div>
    </div>

    <h3 style="font-size:.85rem;font-weight:700;margin-bottom:.35rem;color:var(--clr-text)">${isBackward ? `Calculated Home Price from ${fmt(res.inp.comfortPayment)}/mo Budget` : 'Flow of Funds — Where the Money Comes From & Goes'}</h3>
    ${isBackward ? `<div class="backward-result-banner"><span class="backward-result-label">Home You Can Afford</span><span class="backward-result-price">${fmt(res.inp.targetPrice)}</span><span class="backward-result-sub">at ${fmt(res.inp.comfortPayment)}/mo total housing cost · ${fmtPct(res.inp.downPct)} down = ${fmt(res.dpDollars)}</span></div>` : ''}
    <div class="flow-of-funds">
      <div class="fof-item"><div class="fof-label">Cash / Savings</div><div class="fof-value">${fmt(res.inp.cashOnHand)} ${tip('Value you entered in "Cash on hand" input')}</div></div>
      ${equityLine}
      <div class="fof-item fof-highlight"><div class="fof-label">Total Available Funds</div><div class="fof-value">${fmt(res.inp.totalFunds)} ${tip(totalFundsTip)}</div></div>
      <div class="fof-item"><div class="fof-label">Down Payment (${fmtPct(res.inp.downPct)})</div><div class="fof-value">− ${fmt(res.dpDollars)} ${tip(`${fmtPct(res.inp.downPct)} × ${fmt(res.inp.targetPrice)} = ${fmt(res.dpDollars)}`)}</div></div>
      <div class="fof-item"><div class="fof-label">Closing Costs (${fmtPct(res.inp.closingPct)})</div><div class="fof-value">− ${fmt(res.closingDollars)} ${tip(`${fmtPct(res.inp.closingPct)} × ${fmt(res.inp.targetPrice)} = ${fmt(res.closingDollars)}`)}</div></div>
      <div class="fof-item ${surplus >= 0 ? 'fof-good' : 'fof-bad'}"><div class="fof-label">${surplus >= 0 ? 'Surplus / Reserves' : 'Funding Gap'}</div><div class="fof-value">${fmt(Math.abs(surplus))} ${tip(surplusTip)}</div></div>
    </div>

    <h3 style="font-size:.85rem;font-weight:700;margin:.75rem 0 .35rem;color:var(--clr-text)">Monthly Payment Capacity <span style="font-weight:400;font-size:.75rem;color:var(--clr-muted)">(uses after-tax take-home income)</span></h3>
    <div class="flow-of-funds">
      <div class="fof-item"><div class="fof-label">Monthly Take-Home</div><div class="fof-value">${fmt(res.inp.netMonthly)} ${tip(`${fmt(res.inp.biweekly)} bi-weekly × 26 pays/yr ÷ 12 months = ${fmt(res.inp.netMonthly)}/mo`)}</div></div>
      <div class="fof-item"><div class="fof-label">Total Housing Cost</div><div class="fof-value">${fmt(res.totalHousing)} ${tip(housingTip)}</div></div>
      ${comfortLine}
      <div class="fof-item"><div class="fof-label">Other Debts</div><div class="fof-value">${fmt(res.inp.monthlyDebts)} ${tip('Sum of all monthly debt payments you entered (car, student loans, etc.)')}</div></div>
      <div class="fof-item ${res.breathingPct > 0.15 ? 'fof-good' : 'fof-bad'}"><div class="fof-label">Left Over Each Month</div><div class="fof-value">${fmt(leftOver)} ${tip(leftOverTip)}</div></div>
    </div>
  `;
}

function renderTiers(res) {
  // Remove any previous budget comparison note
  document.querySelectorAll('#tiersSection > .target-feasibility:not(#targetFeasibility)').forEach(el => el.remove());

  $('#tierConservative').textContent = fmt(res.tierResults[0].price);
  $('#tierModerate').textContent = fmt(res.tierResults[1].price);
  $('#tierAggressive').textContent = fmt(res.tierResults[2].price);

  // Budget tier (from comfortable payment) — only in forward mode
  const budgetCard = $('#tierBudgetCard');
  if (res.budgetPrice > 0 && res.inp.calcMode === 'forward') {
    budgetCard.classList.remove('hidden');
    $('#tierBudget').textContent = fmt(res.budgetPrice);
    $('#tierBudgetPayment').textContent = `at ${fmt(res.inp.comfortPayment)}/mo`;
  } else {
    budgetCard.classList.add('hidden');
  }

  const el = $('#targetFeasibility');
  const target = res.inp.targetPrice;
  const moderate = res.tierResults[1].price;
  const max = res.tierResults[2].price;
  const isBackward = res.inp.calcMode === 'backward';
  const priceLabel = isBackward ? `${fmt(target)} (from ${fmt(res.inp.comfortPayment)}/mo)` : fmt(target);

  if (target <= moderate) {
    el.className = 'target-feasibility feasible';
    el.innerHTML = `<strong>\u2713 ${priceLabel} is within a comfortable range.</strong><br>This is at or below the moderate affordability tier. You should be in good shape.`;
  } else if (target <= max) {
    el.className = 'target-feasibility stretch';
    el.innerHTML = `<strong>\u26A0 ${priceLabel} is a stretch but feasible.</strong><br>This is between the moderate and maximum tiers. Budget carefully.`;
  } else {
    el.className = 'target-feasibility infeasible';
    el.innerHTML = `<strong>\u2717 ${priceLabel} exceeds your maximum affordability of ${fmt(max)}.</strong><br>${isBackward ? 'Your comfortable payment implies a price above what lender DTI rules allow. Consider a lower monthly payment target or reducing debts.' : 'Consider a lower price, higher income, reducing debts, or saving longer for a larger down payment.'}`;
  }

  // Add budget comparison if set (forward mode only)
  if (res.budgetPrice > 0 && res.inp.calcMode === 'forward') {
    let budgetNote;
    if (target <= res.budgetPrice) {
      budgetNote = `<div class="target-feasibility feasible" style="margin-top:.5rem"><strong>\u2713 Fits your budget:</strong> Your target is within the ${fmt(res.budgetPrice)} you can afford at ${fmt(res.inp.comfortPayment)}/mo.</div>`;
    } else {
      budgetNote = `<div class="target-feasibility stretch" style="margin-top:.5rem"><strong>\u26A0 Over your comfort zone:</strong> At ${fmt(res.inp.comfortPayment)}/mo you can afford up to ${fmt(res.budgetPrice)}, but your target is ${fmt(target)}. The actual payment would be ${fmt(res.totalHousing)}/mo.</div>`;
    }
    el.insertAdjacentHTML('afterend', budgetNote);
  }
}

function renderCostBreakdown(res) {
  $('#breakdownTarget').textContent = fmt(res.inp.targetPrice);

  const items = [
    { label: 'Principal & Interest', value: res.pi, color: '#2563eb' },
    { label: 'Property Tax', value: res.taxMonthly, color: '#7c3aed' },
    { label: 'Insurance', value: res.insMonthly, color: '#0891b2' },
  ];
  if (res.pmiMonthly > 0) items.push({ label: 'PMI', value: res.pmiMonthly, color: '#dc2626' });
  if (res.inp.hoa > 0) items.push({ label: 'HOA', value: res.inp.hoa, color: '#d97706' });

  // Donut chart
  if (donutChart) donutChart.destroy();
  donutChart = new Chart($('#costDonut'), {
    type: 'doughnut',
    data: {
      labels: items.map(i => i.label),
      datasets: [{
        data: items.map(i => Math.round(i.value)),
        backgroundColor: items.map(i => i.color),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      cutout: '60%',
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.label}: ${fmt(ctx.parsed)}` }
        }
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {
        const { width, height, ctx: c } = chart;
        c.save();
        c.font = 'bold 1.2rem -apple-system, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#1e293b';
        c.fillText(fmt(res.totalHousing), width / 2, height / 2 - 8);
        c.font = '0.7rem -apple-system, sans-serif';
        c.fillStyle = '#64748b';
        c.fillText('/month', width / 2, height / 2 + 14);
        c.restore();
      }
    }]
  });

  // Table
  let html = '<table><thead><tr><th>Item</th><th style="text-align:right">Monthly</th><th style="text-align:right">Annual</th></tr></thead><tbody>';
  items.forEach(i => {
    html += `<tr><td><span class="swatch" style="background:${i.color}"></span>${i.label}</td><td style="text-align:right">${fmt(i.value)}</td><td style="text-align:right">${fmt(i.value * 12)}</td></tr>`;
  });
  html += `<tr class="total-row"><td>Total</td><td style="text-align:right">${fmt(res.totalHousing)}</td><td style="text-align:right">${fmt(res.totalHousing * 12)}</td></tr>`;
  html += '</tbody></table>';
  $('#breakdownTable').innerHTML = html;
}

function renderDTI(res) {
  const meters = [
    { label: 'Front-End DTI (Housing / Gross)', value: res.frontDTI, thresholds: [0.28, 0.31] },
    { label: 'Back-End DTI (All Debt / Gross)', value: res.backDTI, thresholds: [0.36, 0.43] },
  ];

  let html = '';
  meters.forEach(m => {
    const pct = Math.min(m.value, 0.60);
    const barWidth = (pct / 0.60) * 100;
    let color = 'var(--clr-success)';
    if (m.value > m.thresholds[1]) color = 'var(--clr-danger)';
    else if (m.value > m.thresholds[0]) color = 'var(--clr-warn)';

    html += `<div class="dti-meter-row">
      <div class="label-row"><span>${m.label}</span><span>${fmtPct(m.value)}</span></div>
      <div class="dti-bar-track">
        <div class="dti-bar-fill" style="width:${barWidth}%;background:${color}"></div>
        <div class="dti-bar-marker" style="left:${(m.thresholds[0]/0.60)*100}%" data-label="${fmtPct(m.thresholds[0])}"></div>
        <div class="dti-bar-marker" style="left:${(m.thresholds[1]/0.60)*100}%" data-label="${fmtPct(m.thresholds[1])}"></div>
      </div>
      <div class="dti-thresholds">Conventional limit: ${fmtPct(m.thresholds[0])} · FHA max: ${fmtPct(m.thresholds[1])}</div>
    </div>`;
  });
  $('#dtiMeters').innerHTML = html;
}

function renderPMI(res) {
  const el = $('#pmiContent');
  if (res.inp.downPct >= 0.2) {
    el.innerHTML = `<div class="status-badge status-green">✓ No PMI required — down payment is ${fmtPct(res.inp.downPct)}</div>`;
    return;
  }

  const years = Math.floor(res.pmiDropMonth / 12);
  const months = res.pmiDropMonth % 12;
  const timeStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''} ${months} mo` : `${months} mo`;

  el.innerHTML = `
    <div class="status-badge status-yellow">⚠ PMI required — down payment below 20%</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Monthly PMI</div><div class="value">${fmt(res.pmiMonthly)}</div></div>
      <div class="info-item"><div class="label">PMI Drops After</div><div class="value">${timeStr}</div></div>
      <div class="info-item"><div class="label">Total PMI Cost</div><div class="value">${fmt(res.totalPMI)}</div></div>
      <div class="info-item"><div class="label">LTV at Purchase</div><div class="value">${fmtPct(1 - res.inp.downPct)}</div></div>
    </div>
    <p style="margin-top:.75rem;font-size:.82rem;color:var(--clr-muted)">PMI drops when your loan balance reaches 80% of the home's value. You can request removal at that point.</p>
  `;
}

function renderHealth(res) {
  const el = $('#healthContent');
  let statusClass, label;
  if (res.monthsOfReserves >= 6) { statusClass = 'status-green'; label = '✓ Healthy'; }
  else if (res.monthsOfReserves >= 3) { statusClass = 'status-yellow'; label = '⚠ Caution'; }
  else { statusClass = 'status-red'; label = '✗ At Risk'; }

  const reserveMonths = res.monthsOfReserves < 0 ? 'No' : `${res.monthsOfReserves.toFixed(1)} months of`;

  el.innerHTML = `
    <div class="status-badge ${statusClass}">${label} — ${reserveMonths} reserves after closing</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Cash + Equity</div><div class="value">${fmt(res.inp.totalFunds)}</div></div>
      <div class="info-item"><div class="label">Down Payment</div><div class="value">${fmt(res.dpDollars)}</div></div>
      <div class="info-item"><div class="label">Closing Costs</div><div class="value">${fmt(res.closingDollars)}</div></div>
      <div class="info-item"><div class="label">Remaining Reserves</div><div class="value">${fmt(Math.max(0, res.remainingReserves))}</div></div>
    </div>
    <p style="margin-top:.75rem;font-size:.82rem;color:var(--clr-muted)">Financial advisors recommend keeping 3–6 months of housing costs in reserves after closing.</p>
  `;
}

function renderBreathing(res) {
  const el = $('#breathingContent');
  let statusClass, label;
  if (res.breathingPct > 0.30) { statusClass = 'status-green'; label = 'Comfortable'; }
  else if (res.breathingPct > 0.15) { statusClass = 'status-yellow'; label = 'Manageable'; }
  else { statusClass = 'status-red'; label = 'Tight'; }

  el.innerHTML = `
    <div class="status-badge ${statusClass}">${label} — ${fmtPct(Math.max(0, res.breathingPct))} of take-home remaining</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Monthly Take-Home</div><div class="value">${fmt(res.inp.netMonthly)}</div></div>
      <div class="info-item"><div class="label">Total Housing Cost</div><div class="value">${fmt(res.totalHousing)}</div></div>
      <div class="info-item"><div class="label">Other Debts</div><div class="value">${fmt(res.inp.monthlyDebts)}</div></div>
      <div class="info-item"><div class="label">Remaining</div><div class="value">${fmt(Math.max(0, res.netAfterHousing))}</div></div>
    </div>
  `;
}

function renderTimeline(res) {
  const el = $('#timelineContent');
  if (res.fundGap <= 0) {
    el.innerHTML = `
      <div class="status-badge status-green">✓ You have enough funds for the down payment and closing costs!</div>
      <div class="info-grid">
        <div class="info-item"><div class="label">Total Needed</div><div class="value">${fmt(res.totalNeeded)}</div></div>
        <div class="info-item"><div class="label">Available Funds</div><div class="value">${fmt(res.inp.totalFunds)}</div></div>
        <div class="info-item"><div class="label">Surplus</div><div class="value">${fmt(res.inp.totalFunds - res.totalNeeded)}</div></div>
      </div>
    `;
    return;
  }

  const pct = Math.min(1, res.inp.totalFunds / res.totalNeeded);
  const years = Math.floor(res.monthsToSave / 12);
  const months = res.monthsToSave % 12;
  const timeStr = years > 0 ? `${years} yr${years > 1 ? 's' : ''} ${months > 0 ? ` ${months} mo` : ''}` : `${months} mo`;
  const noSavings = res.monthsToSave === 0 && res.fundGap > 0;

  el.innerHTML = `
    <div class="status-badge status-yellow">⚠ You need ${fmt(res.fundGap)} more to reach your goal</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Down Payment (${fmtPct(res.inp.downPct)})</div><div class="value">${fmt(res.dpDollars)}</div></div>
      <div class="info-item"><div class="label">Closing Costs (${fmtPct(res.inp.closingPct)})</div><div class="value">${fmt(res.closingDollars)}</div></div>
      <div class="info-item"><div class="label">Total Needed</div><div class="value">${fmt(res.totalNeeded)}</div></div>
      <div class="info-item"><div class="label">Available Now</div><div class="value">${fmt(res.inp.totalFunds)}</div></div>
    </div>
    <div style="margin-top:1rem">
      <div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.25rem">
        <span>${fmt(res.inp.totalFunds)} saved</span>
        <span>${fmt(res.totalNeeded)} goal</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${pct * 100}%"></div>
      </div>
      ${noSavings
        ? '<p style="font-size:.88rem;color:var(--clr-danger);margin-top:.5rem">Set a monthly savings amount above $0 to see a timeline.</p>'
        : `<p style="font-size:.88rem;margin-top:.5rem">At <strong>${fmt(res.inp.monthlySavings)}/mo</strong> savings, you'll reach your goal in <strong>${timeStr}</strong>.</p>`
      }
    </div>
  `;
}

function renderRateSensitivity(res) {
  const data = res.rateSensitivity;
  const labels = data.map(d => (d.rate * 100).toFixed(1) + '%');
  const payments = data.map(d => Math.round(d.totalHousing));
  const colors = data.map(d => d.delta === 0 ? '#2563eb' : d.delta < 0 ? '#16a34a' : '#dc2626');

  if (rateBarChart) rateBarChart.destroy();
  rateBarChart = new Chart($('#rateChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Total Monthly Payment',
        data: payments,
        backgroundColor: colors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `Monthly: ${fmt(ctx.parsed.y)}`,
            afterLabel: ctx => `Total Interest: ${fmt(data[ctx.dataIndex].totalInterest)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          ticks: { callback: v => fmt(v) }
        }
      }
    }
  });

  const current = data.find(d => d.delta === 0);
  const low = data[0];
  const high = data[data.length - 1];
  $('#rateSummary').innerHTML = `At your current rate of ${(current.rate * 100).toFixed(2)}%, total interest over 30 yrs: <strong>${fmt(current.totalInterest)}</strong>.
    A 2% drop saves <strong>${fmt(current.totalInterest - low.totalInterest)}</strong> in interest. A 2% increase adds <strong>${fmt(high.totalInterest - current.totalInterest)}</strong>.`;
}

function renderEquity(res, withAppreciation) {
  if (typeof withAppreciation === 'undefined') {
    withAppreciation = $('#appreciationToggle').checked;
  }

  const ms = res.equityMilestones;
  const labels = ms.map(m => `Year ${m.year}`);
  const equityData = ms.map(m => Math.round(withAppreciation ? m.equityAppreciated : m.equityBase));

  if (equityBarChart) equityBarChart.destroy();
  equityBarChart = new Chart($('#equityChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Equity',
        data: equityData,
        backgroundColor: '#2563eb',
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => fmt(v) } }
      }
    }
  });

  let tHtml = '<table><thead><tr><th>Year</th><th>Remaining Balance</th><th>Home Value</th><th>Equity</th></tr></thead><tbody>';
  ms.forEach(m => {
    const hv = withAppreciation ? m.homeValueAppreciated : res.inp.targetPrice;
    const eq = withAppreciation ? m.equityAppreciated : m.equityBase;
    tHtml += `<tr><td>Year ${m.year}</td><td>${fmt(m.balance)}</td><td>${fmt(hv)}</td><td>${fmt(eq)}</td></tr>`;
  });
  tHtml += '</tbody></table>';
  $('#equityTable').innerHTML = tHtml;
}

// ── Scenario comparison ──────────────────────────
let scenarios = [];
let lastResult = null;

function saveScenario() {
  if (!lastResult || scenarios.length >= 3) return;
  const res = lastResult;
  scenarios.push({
    label: `Scenario ${scenarios.length + 1}`,
    targetPrice: res.inp.targetPrice,
    downPct: res.inp.downPct,
    rate: res.inp.annualRate,
    totalHousing: res.totalHousing,
    comfortPayment: res.inp.comfortPayment,
    pi: res.pi,
    loanAmount: res.loanAmount,
    frontDTI: res.frontDTI,
    backDTI: res.backDTI,
    pmiMonthly: res.pmiMonthly,
    breathingPct: res.breathingPct,
    netAfterHousing: res.netAfterHousing,
    monthsOfReserves: res.monthsOfReserves,
    totalInterest: res.rateSensitivity.find(d => d.delta === 0).totalInterest
  });
  renderScenarios();
  if (scenarios.length >= 3) $('#saveScenarioBtn').disabled = true;
}

function renderScenarios() {
  if (scenarios.length < 2) {
    $('#scenarioSection').classList.add('hidden');
    $('#clearScenariosBtn').style.display = 'none';
    return;
  }
  $('#scenarioSection').classList.remove('hidden');
  $('#clearScenariosBtn').style.display = '';

  const grid = $('#scenarioGrid');
  grid.innerHTML = scenarios.map((s, i) => `
    <div class="scenario-card">
      <h3>${s.label}: ${fmt(s.targetPrice)}</h3>
      <div class="sc-row"><span class="sc-label">Down Payment</span><span class="sc-value">${fmtPct(s.downPct)} (${fmt(s.targetPrice * s.downPct)})</span></div>
      <div class="sc-row"><span class="sc-label">Loan Amount</span><span class="sc-value">${fmt(s.loanAmount)}</span></div>
      <div class="sc-row"><span class="sc-label">Rate</span><span class="sc-value">${(s.rate * 100).toFixed(2)}%</span></div>
      <div class="sc-row"><span class="sc-label">Monthly Payment</span><span class="sc-value">${fmt(s.totalHousing)}</span></div>
      <div class="sc-row"><span class="sc-label">P&I Only</span><span class="sc-value">${fmt(s.pi)}</span></div>
      <div class="sc-row"><span class="sc-label">PMI</span><span class="sc-value">${s.pmiMonthly > 0 ? fmt(s.pmiMonthly) : 'None'}</span></div>
      <div class="sc-row"><span class="sc-label">Front DTI</span><span class="sc-value">${fmtPct(s.frontDTI)}</span></div>
      <div class="sc-row"><span class="sc-label">Back DTI</span><span class="sc-value">${fmtPct(s.backDTI)}</span></div>
      <div class="sc-row"><span class="sc-label">Total Interest (30yr)</span><span class="sc-value">${fmt(s.totalInterest)}</span></div>
      <div class="sc-row"><span class="sc-label">Breathing Room</span><span class="sc-value">${fmtPct(s.breathingPct)}</span></div>
      <div class="sc-row"><span class="sc-label">Reserves Post-Close</span><span class="sc-value">${s.monthsOfReserves.toFixed(1)} mo</span></div>
    </div>
  `).join('');
}

// ── Calculation Explainers ───────────────────────
function renderExplainers(res) {
  const inp = res.inp;

  // Tiers explainer
  const tiersEl = $('#tiersExplainer');
  if (tiersEl) {
    const modTier = res.tierResults[1];
    tiersEl.innerHTML = `
      <p><strong>What are DTI limits?</strong> Lenders use Debt-to-Income (DTI) ratios to decide the max you can borrow.
      <em>Front-end DTI</em> = housing costs ÷ gross monthly income. <em>Back-end DTI</em> = (housing + all debts) ÷ gross monthly income.</p>
      <p><strong>Example (Moderate tier):</strong></p>
      <p>Your gross monthly income: <code>${fmt(inp.grossAnnual)} ÷ 12 = ${fmt(inp.grossMonthly)}/mo</code></p>
      <p>Max front-end (28%): <code>${fmt(inp.grossMonthly)} × 0.28 = ${fmt(inp.grossMonthly * 0.28)}/mo</code> for housing</p>
      <p>Max back-end (36%): <code>${fmt(inp.grossMonthly)} × 0.36 = ${fmt(inp.grossMonthly * 0.36)}/mo</code> total — minus your ${fmt(inp.monthlyDebts)} debts = <code>${fmt(inp.grossMonthly * 0.36 - inp.monthlyDebts)}</code> for housing</p>
      <p>We take the lower of those two, then solve backwards for the home price that produces that payment at your rate, tax, and insurance.</p>
      <p><strong>Result:</strong> Moderate tier max home ≈ <code>${fmt(modTier.price)}</code></p>
    `;
  }

  // Cost breakdown explainer
  const costEl = $('#costExplainer');
  if (costEl) {
    costEl.innerHTML = `
      <p><strong>Loan amount:</strong> <code>${fmt(inp.targetPrice)} − ${fmt(res.dpDollars)} down = ${fmt(res.loanAmount)}</code></p>
      <p><strong>Principal & Interest:</strong> Standard amortization formula for a ${fmt(res.loanAmount)} loan at ${(inp.annualRate * 100).toFixed(2)}% over 30 years = <code>${fmt(res.pi)}/mo</code></p>
      <p><strong>Property Tax:</strong> <code>${fmt(inp.targetPrice)} × ${fmtPct(inp.taxRate)} ÷ 12 = ${fmt(res.taxMonthly)}/mo</code></p>
      <p><strong>Insurance:</strong> <code>${fmt(inp.targetPrice)} × ${fmtPct(inp.insRate)} ÷ 12 = ${fmt(res.insMonthly)}/mo</code></p>
      ${res.pmiMonthly > 0 ? `<p><strong>PMI:</strong> <code>${fmt(res.loanAmount)} × 0.7% ÷ 12 = ${fmt(res.pmiMonthly)}/mo</code> (because down payment < 20%)</p>` : ''}
      ${inp.hoa > 0 ? `<p><strong>HOA:</strong> <code>${fmt(inp.hoa)}/mo</code> (your input)</p>` : ''}
      <p><strong>Total:</strong> <code>${fmt(res.totalHousing)}/mo</code></p>
    `;
  }

  // DTI explainer
  const dtiEl = $('#dtiExplainer');
  if (dtiEl) {
    dtiEl.innerHTML = `
      <p><strong>Front-End DTI:</strong> <code>${fmt(res.totalHousing)} housing ÷ ${fmt(inp.grossMonthly)} gross = ${fmtPct(res.frontDTI)}</code></p>
      <p><strong>Back-End DTI:</strong> <code>(${fmt(res.totalHousing)} housing + ${fmt(inp.monthlyDebts)} debts) ÷ ${fmt(inp.grossMonthly)} gross = ${fmtPct(res.backDTI)}</code></p>
      <p>Conventional loans typically require front-end ≤ 28% and back-end ≤ 36%. FHA allows up to 43% back-end.</p>
    `;
  }
}

// ── Event wiring ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  populateStateDropdown();
  setupCurrencyInputs();
  setupExistingHome();
  setupDownPayment();
  setupCalcMode();

  $('#stateSelect').addEventListener('change', updateStateRates);

  // Initialize equity display from prefilled values
  if ($('#hasExistingHome').checked) {
    updateEquityDisplay();
  }
  updateDpSummary();

  $('#calcForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = getCalcMode();
    if (mode === 'forward' && parseNum($('#targetPrice').value) <= 0) {
      $('#targetPrice').focus();
      return;
    }
    if (mode === 'backward' && parseNum($('#comfortPayment').value) <= 0) {
      $('#comfortPayment').focus();
      return;
    }
    lastResult = calculate();
    renderResults(lastResult);
  });

  $('#saveScenarioBtn').addEventListener('click', saveScenario);
  $('#clearScenariosBtn').addEventListener('click', () => {
    scenarios = [];
    renderScenarios();
    $('#saveScenarioBtn').disabled = false;
  });

  $('#appreciationToggle').addEventListener('change', () => {
    if (lastResult) renderEquity(lastResult);
  });
});

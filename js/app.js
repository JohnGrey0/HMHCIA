/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   How Much House — Main Application Entry Point
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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
  sel.value = 'NH';
  updateStateRates();
  detectUserState();
}

// ── Detect state from IP geolocation (opt-in) ──────
function detectUserState() {
  const btn = $('#detectStateBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    btn.disabled = true;
    btn.textContent = 'Detecting…';

    function applyState(regionCode) {
      if (regionCode && STATE_DATA[regionCode]) {
        $('#stateSelect').value = regionCode;
        updateStateRates();
        btn.textContent = `Detected: ${STATE_DATA[regionCode].name}`;
        return true;
      }
      return false;
    }

    // ipwho.is: free, HTTPS, no key, generous rate limit
    fetch('https://ipwho.is/')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (data.success === false) throw new Error('lookup failed');
        if (data.country_code === 'US' && applyState(data.region_code)) return;
        btn.textContent = 'Could not detect (non-US?)';
      })
      .catch(() => {
        btn.textContent = 'Detection failed — select manually';
      })
      .finally(() => {
        setTimeout(() => { btn.disabled = false; btn.textContent = '📍 Detect my state'; }, 4000);
      });
  });
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

// ── Randomize default values ─────────────────────
function randomizeDefaults() {
  const commaFmt = (n) => new Intl.NumberFormat('en-US').format(n);
  const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const roundTo = (n, step) => Math.round(n / step) * step;

  const gross = roundTo(randInt(80000, 400000), 5000);
  const payFreqVal = parseInt($('#payFrequency').value) || 26;
  const paycheck = roundTo(Math.round(gross * (0.28 + Math.random() * 0.07) / payFreqVal), 50);
  const netMonthly = paycheck * payFreqVal / 12;

  const maxDebts = Math.floor(netMonthly * 0.15);
  const debts = Math.random() < 0.4 ? 0 : roundTo(randInt(100, Math.max(100, maxDebts)), 100);

  const availableForSavings = netMonthly - debts;
  const savingsMax = Math.floor(availableForSavings * 0.25);
  const savingsMin = Math.floor(availableForSavings * 0.05);
  const savings = roundTo(randInt(Math.max(250, savingsMin), Math.max(500, savingsMax)), 250);

  const comfortMin = roundTo(Math.floor(netMonthly * 0.25), 250);
  const comfortMax = roundTo(Math.floor(netMonthly * 0.40), 250);
  const comfort = roundTo(randInt(Math.max(1500, comfortMin), Math.max(1750, comfortMax)), 250);

  const targetMin = roundTo(Math.floor(gross * 2), 25000);
  const targetMax = roundTo(Math.floor(gross * 5), 25000);
  const target = roundTo(randInt(targetMin, targetMax), 25000);

  const cashMin = roundTo(Math.floor(target * 0.05), 5000);
  const cashMax = roundTo(Math.floor(target * 0.30), 5000);
  const cash = roundTo(randInt(Math.max(10000, cashMin), Math.max(15000, cashMax)), 5000);

  const rentMin = roundTo(Math.floor(netMonthly * 0.20), 250);
  const rentMax = roundTo(Math.floor(netMonthly * 0.35), 250);
  const rent = roundTo(randInt(Math.max(1000, rentMin), Math.max(1500, rentMax)), 250);

  const billsMin = roundTo(Math.floor(netMonthly * 0.25), 250);
  const billsMax = roundTo(Math.floor(netMonthly * 0.50), 250);
  const bills = roundTo(randInt(Math.max(1000, billsMin), Math.max(1500, billsMax)), 250);

  const bump = roundTo(randInt(100, 600), 50);

  const homeVal = roundTo(randInt(200000, 800000), 25000);
  const mortBal = roundTo(Math.round(homeVal * (0.3 + Math.random() * 0.5)), 5000);

  $('#targetPrice').value = commaFmt(target);
  $('#comfortPayment').value = commaFmt(comfort);
  $('#grossIncome').value = commaFmt(gross);
  $('#paycheckTakeHome').value = commaFmt(paycheck);
  $('#cashOnHand').value = commaFmt(cash);
  $('#monthlySavings').value = commaFmt(savings);
  $('#monthlyDebts').value = debts === 0 ? '0' : commaFmt(debts);
  $('#currentRent').value = commaFmt(rent);
  $('#monthlyBills').value = commaFmt(bills);
  $('#costBump').value = commaFmt(bump);
  $('#currentHomeValue').value = commaFmt(homeVal);
  $('#mortgageBalance').value = commaFmt(mortBal);
  $('#sellCostsPct').value = '8';
  $('#recastAmount').value = '0';
  $('#bankFees').value = '0';
  $('#buyerAgentFee').value = '0';
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

  ['currentHomeValue', 'mortgageBalance', 'sellCostsPct'].forEach(id => {
    $(`#${id}`).addEventListener('input', updateEquityDisplay);
  });
}

function updateEquityDisplay() {
  const value = parseNum($('#currentHomeValue').value);
  const balance = parseNum($('#mortgageBalance').value);
  const sellPct = Math.max(0, parseFloat($('#sellCostsPct').value) / 100 || 0);
  const sellCosts = value * sellPct;
  const grossEquity = Math.max(0, value - balance);
  const netProceeds = Math.max(0, value - balance - sellCosts);
  $('#equityDisplay').innerHTML = `Gross Equity: <strong>${fmt(grossEquity)}</strong> &nbsp;|&nbsp; Selling Costs: <strong>${fmt(sellCosts)}</strong> &nbsp;|&nbsp; Net Proceeds: <strong>${fmt(netProceeds)}</strong>`;
}

// ── Lender overrides toggle ─────────────────────
function setupLenderOverrides() {
  const cb = $('#hasLenderEstimates');
  const fields = $('#lenderFields');
  cb.addEventListener('change', () => {
    fields.classList.toggle('hidden', !cb.checked);
  });
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

// ── Gather all inputs ────────────────────────────
function getInputs() {
  const calcMode = getCalcMode();
  const grossAnnual = Math.max(0, parseNum($('#grossIncome').value));
  const paycheck = Math.max(0, parseNum($('#paycheckTakeHome').value));
  const payFreq = parseInt($('#payFrequency').value) || 26;
  const cashOnHand = Math.max(0, parseNum($('#cashOnHand').value));
  const earnestDeposit = Math.max(0, parseNum($('#earnestDeposit').value));
  const bankFees = Math.max(0, parseNum($('#bankFees').value));
  const buyerAgentFee = Math.max(0, parseNum($('#buyerAgentFee').value));
  const hasHome = $('#hasExistingHome').checked;
  const homeValue = hasHome ? Math.max(0, parseNum($('#currentHomeValue').value)) : 0;
  const mortBal = hasHome ? Math.max(0, parseNum($('#mortgageBalance').value)) : 0;
  const sellCostsPct = hasHome ? Math.min(0.15, Math.max(0, parseFloat($('#sellCostsPct').value) / 100 || 0)) : 0;
  const sellCosts = homeValue * sellCostsPct;
  const grossEquity = Math.max(0, homeValue - mortBal);
  const netProceeds = Math.max(0, homeValue - mortBal - sellCosts);
  const recastInput = hasHome ? Math.max(0, parseNum($('#recastAmount').value)) : 0;
  const monthlySavings = Math.max(0, parseNum($('#monthlySavings').value));
  const downPct = Math.min(1, Math.max(0, getDownPct()));
  const annualRate = Math.min(0.15, Math.max(0, parseFloat($('#interestRate').value) / 100 || 0));
  const taxRate = Math.min(0.10, Math.max(0, parseFloat($('#propertyTaxRate').value) / 100 || 0));
  const insRate = Math.min(0.10, Math.max(0, parseFloat($('#insuranceRate').value) / 100 || 0));
  const closingPct = Math.min(0.10, Math.max(0, parseFloat($('#closingCostPct').value) / 100 || 0));
  const currentRent = Math.max(0, parseNum($('#currentRent').value));
  const monthlyDebts = Math.max(0, parseNum($('#monthlyDebts').value));
  const monthlyBills = Math.max(0, parseNum($('#monthlyBills').value));
  const costBump = Math.max(0, parseNum($('#costBump').value));
  const hoa = Math.max(0, parseNum($('#hoaMonthly').value));
  const hasLender = $('#hasLenderEstimates').checked;
  const overridePI = hasLender ? Math.max(0, parseNum($('#overridePI').value)) : 0;
  const overridePMI = hasLender ? Math.max(0, parseNum($('#overridePMI').value)) : 0;
  const overrideIns = hasLender ? Math.max(0, parseNum($('#overrideIns').value)) : 0;
  const overrideTax = hasLender ? Math.max(0, parseNum($('#overrideTax').value)) : 0;
  const comfortPayment = calcMode === 'backward' ? Math.max(0, parseNum($('#comfortPayment').value)) : 0;
  const targetPriceInput = calcMode === 'forward' ? Math.max(0, parseNum($('#targetPrice').value)) : 0;

  const grossMonthly = grossAnnual / 12;
  const netMonthly = paycheck * payFreq / 12;
  const totalFunds = cashOnHand + netProceeds;

  let targetPrice;
  if (calcMode === 'backward' && comfortPayment > 0) {
    targetPrice = maxHomePrice(comfortPayment, annualRate, DEFAULTS.loanTermYears, downPct, taxRate, insRate, DEFAULTS.pmiRate, hoa);
    targetPrice = Math.max(0, Math.round(targetPrice));
  } else {
    targetPrice = targetPriceInput;
  }

  return {
    calcMode, grossAnnual, grossMonthly, paycheck, payFreq, netMonthly,
    cashOnHand, earnestDeposit, bankFees, buyerAgentFee, hasHome, homeValue, mortBal, sellCostsPct, sellCosts, grossEquity, netProceeds,
    recastInput, totalFunds, monthlySavings,
    targetPrice, downPct, annualRate, taxRate, insRate,
    closingPct, currentRent, monthlyDebts, monthlyBills, costBump, hoa,
    overridePI, overridePMI, overrideIns, overrideTax, comfortPayment
  };
}

// ── Main calculation ─────────────────────────────
function calculate() {
  const inp = getInputs();
  const years = DEFAULTS.loanTermYears;
  const pmiRate = DEFAULTS.pmiRate;

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

  const dpDollars = inp.targetPrice * inp.downPct;
  const closingDollars = inp.targetPrice * inp.closingPct;
  const bankFees = inp.bankFees;
  const buyerAgentFee = inp.buyerAgentFee;
  const totalNeeded = dpDollars + closingDollars + bankFees + buyerAgentFee;
  // Earnest deposit is already in cashOnHand — it's credited at closing, reducing what's due
  const earnest = Math.min(inp.earnestDeposit, totalNeeded);
  const dueAtClosing = totalNeeded - earnest;
  const fundGap = Math.max(0, totalNeeded - inp.totalFunds);
  const loanAmount = Math.max(0, inp.targetPrice * (1 - inp.downPct));

  // Recast: cap to what's available after down payment + closing, and to loan amount
  const surplusForRecast = Math.max(0, inp.totalFunds - totalNeeded);
  const recastAmount = Math.min(inp.recastInput, surplusForRecast, loanAmount);
  const effectiveLoan = Math.max(0, loanAmount - recastAmount);

  // Calculated values (formula-based, on effective post-recast loan)
  const calcPI = monthlyPayment(effectiveLoan, inp.annualRate, years);
  const calcTax = inp.targetPrice * inp.taxRate / 12;
  const calcIns = inp.targetPrice * inp.insRate / 12;
  const effectiveLTV = inp.targetPrice > 0 ? effectiveLoan / inp.targetPrice : 0;
  const calcPMI = (inp.downPct < 0.2 && effectiveLTV > 0.80) ? effectiveLoan * pmiRate / 12 : 0;

  // Pre-recast values (lender overrides OR formula on full loan)
  const preRecastPI = inp.overridePI > 0 ? inp.overridePI : monthlyPayment(loanAmount, inp.annualRate, years);
  const preRecastPMI = inp.overridePMI > 0 ? inp.overridePMI : (inp.downPct < 0.2 ? loanAmount * pmiRate / 12 : 0);
  const preRecastTax = inp.overrideTax > 0 ? inp.overrideTax : calcTax;
  const preRecastIns = inp.overrideIns > 0 ? inp.overrideIns : calcIns;
  const preRecastTotal = Math.max(0, preRecastPI + preRecastTax + preRecastIns + preRecastPMI + inp.hoa);

  // Post-recast: if recast > 0, recalculate P&I on reduced balance; PMI drops if LTV ≤ 80%
  // If no recast, post-recast equals pre-recast (lender overrides used as-is)
  const hasRecast = recastAmount > 0;
  const pi = hasRecast ? calcPI : (inp.overridePI > 0 ? inp.overridePI : calcPI);
  const taxMonthly = inp.overrideTax > 0 ? inp.overrideTax : calcTax;
  const insMonthly = inp.overrideIns > 0 ? inp.overrideIns : calcIns;
  const pmiMonthly = hasRecast
    ? calcPMI  // recalculated on effective loan; 0 if LTV ≤ 80%
    : (inp.overridePMI > 0 ? inp.overridePMI : calcPMI);
  const totalHousing = Math.max(0, pi + taxMonthly + insMonthly + pmiMonthly + inp.hoa);
  const frontDTI = inp.grossMonthly > 0 ? totalHousing / inp.grossMonthly : 0;
  const backDTI = inp.grossMonthly > 0 ? (totalHousing + inp.monthlyDebts) / inp.grossMonthly : 0;

  let pmiDropMonth = 0;
  let totalPMI = 0;
  if (pmiMonthly > 0) {
    for (let m = 1; m <= years * 12; m++) {
      const bal = amortizationBalance(effectiveLoan, inp.annualRate, years, m);
      totalPMI += pmiMonthly;
      if (bal <= inp.targetPrice * DEFAULTS.pmiThresholdLTV) {
        pmiDropMonth = m;
        break;
      }
    }
    if (pmiDropMonth === 0) pmiDropMonth = years * 12;
  }

  const remainingReserves = inp.totalFunds - totalNeeded - recastAmount;
  const monthsOfReserves = totalHousing > 0 ? Math.max(0, remainingReserves / totalHousing) : 0;

  // True remaining: take-home minus ALL obligations (housing + bills + debts + cost bump)
  const projectedBills = inp.monthlyBills + inp.costBump;
  const netAfterAll = inp.netMonthly - totalHousing - inp.monthlyDebts - projectedBills;
  const netAfterHousing = netAfterAll; // kept for backward compat with render references
  const breathingPct = inp.netMonthly > 0 ? netAfterAll / inp.netMonthly : 0;

  const monthsToSave = (inp.monthlySavings > 0 && fundGap > 0) ? Math.ceil(fundGap / inp.monthlySavings) : 0;

  const rateSteps = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
  const rateSensitivity = rateSteps
    .filter(delta => (inp.annualRate + delta / 100) >= 0.005)
    .map(delta => {
      const r = inp.annualRate + delta / 100;
      const payment = monthlyPayment(effectiveLoan, r, years);
      const totalInterest = Math.max(0, payment * years * 12 - effectiveLoan);
      return { delta, rate: r, payment, totalInterest, totalHousing: payment + taxMonthly + insMonthly + (inp.downPct < 0.2 ? pmiMonthly : 0) + inp.hoa };
    });

  const milestoneYears = [1, 5, 10, 15, 30];
  const equityMilestones = milestoneYears.map(y => {
    const months = y * 12;
    const bal = Math.max(0, amortizationBalance(effectiveLoan, inp.annualRate, years, months));
    const equityNoAppreciation = inp.targetPrice - bal;
    const valueWithAppreciation = inp.targetPrice * Math.pow(1 + DEFAULTS.appreciationRate, y);
    const equityWithAppreciation = valueWithAppreciation - bal;
    return { year: y, balance: bal, equityBase: equityNoAppreciation, equityAppreciated: equityWithAppreciation, homeValueAppreciated: valueWithAppreciation };
  });

  let budgetPrice = 0;
  if (inp.comfortPayment > 0 && inp.calcMode === 'forward') {
    budgetPrice = maxHomePrice(inp.comfortPayment, inp.annualRate, years, inp.downPct, inp.taxRate, inp.insRate, pmiRate, inp.hoa);
    budgetPrice = Math.max(0, budgetPrice);
  }

  // Bank vs. Reality budget analysis
  const bankFrontPct = frontDTI;
  const bankBackPct = backDTI;
  const grossUnused = inp.grossMonthly - totalHousing - inp.monthlyDebts;
  const grossUnusedPct = inp.grossMonthly > 0 ? grossUnused / inp.grossMonthly : 0;

  const currentBillsTotal = inp.currentRent + inp.monthlyBills + inp.monthlyDebts;
  const currentRemaining = inp.netMonthly - currentBillsTotal;
  const currentBillsPct = inp.netMonthly > 0 ? currentBillsTotal / inp.netMonthly : 0;
  const currentRemainingPct = inp.netMonthly > 0 ? currentRemaining / inp.netMonthly : 0;

  const projectedBillsTotal = totalHousing + inp.monthlyBills + inp.costBump + inp.monthlyDebts;
  const projectedRemaining = inp.netMonthly - projectedBillsTotal;
  const projectedBillsPct = inp.netMonthly > 0 ? projectedBillsTotal / inp.netMonthly : 0;
  const projectedRemainingPct = inp.netMonthly > 0 ? projectedRemaining / inp.netMonthly : 0;

  const taxWedge = inp.grossMonthly - inp.netMonthly;
  const taxWedgePct = inp.grossMonthly > 0 ? taxWedge / inp.grossMonthly : 0;

  const realityBudget = {
    taxWedge, taxWedgePct,
    bankFrontPct, bankBackPct, grossUnused, grossUnusedPct,
    currentBillsTotal, currentRemaining, currentBillsPct, currentRemainingPct,
    projectedBillsTotal, projectedRemaining, projectedBillsPct, projectedRemainingPct,
  };

  return {
    inp, tierResults, budgetPrice, dpDollars, closingDollars, bankFees, buyerAgentFee, totalNeeded, earnest, dueAtClosing, fundGap,
    loanAmount, recastAmount, effectiveLoan,
    calcPI, calcTax, calcIns, calcPMI,
    preRecastPI, preRecastPMI, preRecastTax, preRecastIns, preRecastTotal,
    pi, taxMonthly, insMonthly, pmiMonthly, totalHousing,
    frontDTI, backDTI, pmiDropMonth, totalPMI,
    remainingReserves, monthsOfReserves,
    netAfterHousing, breathingPct,
    monthsToSave, rateSensitivity, equityMilestones, realityBudget
  };
}

// ── Theme toggle ─────────────────────────────────
function setupTheme() {
  const saved = localStorage.getItem('hmh-theme');
  if (saved === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  if (isLight) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('hmh-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('hmh-theme', 'light');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = $('#themeToggle');
  if (!btn) return;
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  btn.textContent = isLight ? '🌙' : '☀️';
  btn.title = isLight ? 'Switch to dark mode' : 'Switch to light mode';
}

// ── Input persistence (localStorage) ────────────────
const SAVE_KEY = 'hmh-inputs';
const INPUT_IDS = [
  'targetPrice', 'comfortPayment', 'grossIncome', 'paycheckTakeHome', 'payFrequency',
  'cashOnHand', 'earnestDeposit', 'bankFees', 'buyerAgentFee', 'monthlySavings', 'currentRent', 'monthlyDebts', 'monthlyBills', 'costBump',
  'currentHomeValue', 'mortgageBalance', 'sellCostsPct', 'recastAmount', 'interestRate',
  'overridePI', 'overridePMI', 'overrideIns', 'overrideTax',
  'propertyTaxRate', 'insuranceRate', 'closingCostPct', 'hoaMonthly',
  'downPaymentPct', 'backwardDownPct', 'customDownPct', 'customBackwardDownPct',
  'stateSelect'
];

function saveInputs() {
  const data = {};
  INPUT_IDS.forEach(id => {
    const el = $(`#${id}`);
    if (el) data[id] = el.value;
  });
  data._hasExistingHome = $('#hasExistingHome').checked;
  data._hasLenderEstimates = $('#hasLenderEstimates').checked;
  data._calcMode = getCalcMode();
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function restoreInputs() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    INPUT_IDS.forEach(id => {
      const el = $(`#${id}`);
      if (el && data[id] !== undefined) el.value = data[id];
    });
    if (data._hasExistingHome) {
      $('#hasExistingHome').checked = true;
      $('#existingHomeFields').classList.remove('hidden');
      if ($('#noHomeMessage')) $('#noHomeMessage').classList.add('hidden');
    }
    if (data._hasLenderEstimates) {
      $('#hasLenderEstimates').checked = true;
      $('#lenderFields').classList.remove('hidden');
    }
    if (data._calcMode === 'backward') {
      $('#modeBackwardBtn').click();
    }
    return true;
  } catch { return false; }
}

// ── Inline validation errors ────────────────────────
function showFormErrors(errors) {
  clearFormErrors();
  if (errors.length === 0) return;
  const container = document.createElement('div');
  container.id = 'formErrors';
  container.className = 'form-errors';
  container.innerHTML = `<strong>Please fix the following:</strong><ul>${errors.map(e => `<li>${e}</li>`).join('')}</ul>`;
  const actions = $('.form-actions');
  actions.parentNode.insertBefore(container, actions);
  container.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function clearFormErrors() {
  const existing = $('#formErrors');
  if (existing) existing.remove();
}

// ── Event wiring ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  populateStateDropdown();

  const restored = restoreInputs();
  if (!restored) randomizeDefaults();

  updateStateRates();
  setupCurrencyInputs();
  setupExistingHome();
  setupLenderOverrides();
  setupDownPayment();
  setupCalcMode();

  $('#stateSelect').addEventListener('change', updateStateRates);

  if ($('#hasExistingHome').checked) {
    updateEquityDisplay();
  }
  updateDpSummary();

  $('#calcForm').addEventListener('submit', (e) => {
    e.preventDefault();
    clearFormErrors();
    const mode = getCalcMode();

    const errors = [];
    const grossVal = parseNum($('#grossIncome').value);
    const takeHomeVal = parseNum($('#paycheckTakeHome').value);
    const rateVal = parseFloat($('#interestRate').value);

    if (grossVal <= 0) errors.push('Annual gross income must be greater than $0.');
    if (takeHomeVal <= 0) errors.push('Take-home pay per paycheck must be greater than $0.');
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 15) errors.push('Interest rate must be between 0% and 15%.');

    if (mode === 'forward') {
      const tp = parseNum($('#targetPrice').value);
      if (tp <= 0) { $('#targetPrice').focus(); return; }
      if (tp > 50000000) errors.push('Target price seems unrealistically high (>$50M).');
    }
    if (mode === 'backward') {
      const cp = parseNum($('#comfortPayment').value);
      if (cp <= 0) { $('#comfortPayment').focus(); return; }
      if (cp > 200000) errors.push('Monthly payment seems unrealistically high (>$200K).');
    }

    const debtsVal = parseNum($('#monthlyDebts').value);
    if (debtsVal < 0) errors.push('Monthly debts cannot be negative.');
    if (grossVal > 0 && debtsVal > grossVal / 12) errors.push('Monthly debts exceed your gross monthly income — no lender will approve this. Lower debts or raise income.');

    if (errors.length > 0) {
      showFormErrors(errors);
      return;
    }

    saveInputs();
    const result = calculate();
    setLastResult(result);
    renderResults(result);
  });

  $('#saveScenarioBtn').addEventListener('click', saveScenario);
  $('#clearScenariosBtn').addEventListener('click', () => {
    clearScenarios();
    renderScenarios();
    $('#saveScenarioBtn').disabled = false;
  });

  $('#randomizeBtn').addEventListener('click', () => {
    randomizeDefaults();
    updateStateRates();
    updateDpSummary();
    setupCurrencyInputs();
    if ($('#hasExistingHome').checked) updateEquityDisplay();
  });

  $('#appreciationToggle').addEventListener('change', () => {
    const res = calculate();
    setLastResult(res);
    renderEquity(res);
  });

  $('#themeToggle').addEventListener('click', toggleTheme);
});

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   How Much House — Rendering & Charts
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// ── Chart instances (for cleanup) ────────────────
let donutChart = null;
let rateBarChart = null;
let equityBarChart = null;

// ── Scenario state ──────────────────────────────
let scenarios = [];
let lastResult = null;

function setLastResult(res) { lastResult = res; }
function clearScenarios() { scenarios = []; }

// ── Render results ───────────────────────────────
function renderResults(res) {
  $('#results').classList.remove('hidden');

  renderDashboard(res);
  renderReality(res);
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
  const hasHome = res.inp.hasHome && res.inp.homeValue > 0;
  let saleProceedsLines = '';
  if (hasHome) {
    saleProceedsLines = `
      <div class="fof-item"><div class="fof-label">Home Sale (market value)</div><div class="fof-value">${fmt(res.inp.homeValue)} ${tip('Current estimated market value of your home')}</div></div>
      <div class="fof-item"><div class="fof-label">Mortgage Payoff</div><div class="fof-value">− ${fmt(res.inp.mortBal)} ${tip('Remaining mortgage balance paid at closing')}</div></div>
      <div class="fof-item"><div class="fof-label">Selling Costs (${fmtPct(res.inp.sellCostsPct)})</div><div class="fof-value">− ${fmt(res.inp.sellCosts)} ${tip(`${fmtPct(res.inp.sellCostsPct)} × ${fmt(res.inp.homeValue)} = ${fmt(res.inp.sellCosts)} (agent commissions + seller closing costs)`)}</div></div>
      <div class="fof-item fof-highlight"><div class="fof-label">Net Sale Proceeds</div><div class="fof-value">${fmt(res.inp.netProceeds)} ${tip(`${fmt(res.inp.homeValue)} − ${fmt(res.inp.mortBal)} mortgage − ${fmt(res.inp.sellCosts)} selling costs = ${fmt(res.inp.netProceeds)}`)}</div></div>`;
  }

  const surplus = res.inp.totalFunds - res.totalNeeded - res.recastAmount;
  const totalFundsTip = hasHome
    ? `${fmt(res.inp.cashOnHand)} cash + ${fmt(res.inp.netProceeds)} net proceeds = ${fmt(res.inp.totalFunds)}`
    : 'Equals your cash/savings on hand';
  const surplusLabel = surplus >= 0 ? 'Surplus / Reserves' : 'Funding Gap';
  const surplusParts = [`${fmt(res.inp.totalFunds)} total funds`, `− ${fmt(res.dpDollars)} down`, `− ${fmt(res.closingDollars)} closing`];
  if (res.recastAmount > 0) surplusParts.push(`− ${fmt(res.recastAmount)} recast`);
  surplusParts.push(`= ${surplus >= 0 ? fmt(surplus) : '−' + fmt(Math.abs(surplus)) + ' shortfall'}`);
  const surplusTip = surplusParts.join(' ');

  // Build housing cost breakdown string for tooltip
  const housingParts = [`${fmt(res.pi)} P&I`, `${fmt(res.taxMonthly)} tax`, `${fmt(res.insMonthly)} ins`];
  if (res.pmiMonthly > 0) housingParts.push(`${fmt(res.pmiMonthly)} PMI`);
  if (res.inp.hoa > 0) housingParts.push(`${fmt(res.inp.hoa)} HOA`);
  const housingTip = housingParts.join(' + ') + ` = ${fmt(res.totalHousing)}`;

  const leftOver = res.netAfterHousing;
  const leftOverLabel = leftOver < 0 ? 'Monthly Shortfall' : 'Left Over Each Month';
  const projBills = res.inp.monthlyBills + res.inp.costBump;
  const leftOverTip = `${fmt(res.inp.netMonthly)} take-home − ${fmt(res.totalHousing)} housing − ${fmt(res.inp.monthlyDebts)} debts − ${fmt(projBills)} bills/bump = ${fmt(leftOver)} (${fmtPct(res.breathingPct)} of take-home)`;

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
      ${saleProceedsLines}
      <div class="fof-item fof-highlight"><div class="fof-label">Total Available Funds</div><div class="fof-value">${fmt(res.inp.totalFunds)} ${tip(totalFundsTip)}</div></div>
      <div class="fof-item"><div class="fof-label">Down Payment (${fmtPct(res.inp.downPct)})</div><div class="fof-value">− ${fmt(res.dpDollars)} ${tip(`${fmtPct(res.inp.downPct)} × ${fmt(res.inp.targetPrice)} = ${fmt(res.dpDollars)}`)}</div></div>
      <div class="fof-item"><div class="fof-label">Closing Costs (${fmtPct(res.inp.closingPct)})</div><div class="fof-value">− ${fmt(res.closingDollars)} ${tip(`${fmtPct(res.inp.closingPct)} × ${fmt(res.inp.targetPrice)} = ${fmt(res.closingDollars)}`)}</div></div>
      ${res.recastAmount > 0 ? `<div class="fof-item"><div class="fof-label">Mortgage Recast</div><div class="fof-value">− ${fmt(res.recastAmount)} ${tip(`Lump sum applied to reduce your ${fmt(res.loanAmount)} loan to ${fmt(res.effectiveLoan)}. Monthly P&I recalculated on the lower balance.`)}</div></div>` : ''}
      <div class="fof-item ${surplus >= 0 ? 'fof-good' : 'fof-bad'}"><div class="fof-label">${surplusLabel}</div><div class="fof-value">${surplus >= 0 ? fmt(surplus) : '−' + fmt(Math.abs(surplus))} ${tip(surplusTip)}</div></div>
    </div>

    <h3 style="font-size:.85rem;font-weight:700;margin:.75rem 0 .35rem;color:var(--clr-text)">Monthly Payment Capacity <span style="font-weight:400;font-size:.75rem;color:var(--clr-muted)">(uses after-tax take-home income)</span></h3>
    <div class="flow-of-funds">
      <div class="fof-item"><div class="fof-label">Monthly Take-Home</div><div class="fof-value">${fmt(res.inp.netMonthly)} ${tip(`${fmt(res.inp.biweekly)} bi-weekly × 26 pays/yr ÷ 12 months = ${fmt(res.inp.netMonthly)}/mo`)}</div></div>
      <div class="fof-item"><div class="fof-label">Total Housing Cost</div><div class="fof-value">${fmt(res.totalHousing)} ${tip(housingTip)}</div></div>
      ${comfortLine}
      <div class="fof-item"><div class="fof-label">Other Debts</div><div class="fof-value">${fmt(res.inp.monthlyDebts)} ${tip('Sum of all monthly debt payments you entered (car, student loans, etc.)')}</div></div>
      <div class="fof-item ${leftOver < 0 ? 'fof-bad' : res.breathingPct > 0.15 ? 'fof-good' : 'fof-bad'}"><div class="fof-label">${leftOverLabel}</div><div class="fof-value">${leftOver < 0 ? '−' + fmt(Math.abs(leftOver)) : fmt(leftOver)} ${tip(leftOverTip)}</div></div>
    </div>
  `;
}

function renderTiers(res) {
  document.querySelectorAll('#tiersSection > .target-feasibility:not(#targetFeasibility)').forEach(el => el.remove());

  $('#tierConservative').textContent = fmt(res.tierResults[0].price);
  $('#tierModerate').textContent = fmt(res.tierResults[1].price);
  $('#tierAggressive').textContent = fmt(res.tierResults[2].price);

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
        const styles = getComputedStyle(document.documentElement);
        c.save();
        c.font = 'bold 1.2rem -apple-system, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = styles.getPropertyValue('--clr-text').trim() || '#1e293b';
        c.fillText(fmt(res.totalHousing), width / 2, height / 2 - 8);
        c.font = '0.7rem -apple-system, sans-serif';
        c.fillStyle = styles.getPropertyValue('--clr-muted').trim() || '#64748b';
        c.fillText('/month', width / 2, height / 2 + 14);
        c.restore();
      }
    }]
  });

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

  const reserveMonths = res.monthsOfReserves === 0 ? 'No' : `${res.monthsOfReserves.toFixed(1)} months of`;

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
  if (res.netAfterHousing < 0) { statusClass = 'status-red'; label = 'Unaffordable — You\'d be in the red'; }
  else if (res.breathingPct > 0.30) { statusClass = 'status-green'; label = 'Comfortable'; }
  else if (res.breathingPct > 0.15) { statusClass = 'status-yellow'; label = 'Manageable'; }
  else { statusClass = 'status-red'; label = 'Tight'; }

  const remainingDisplay = res.netAfterHousing < 0
    ? `−${fmt(Math.abs(res.netAfterHousing))}`
    : fmt(res.netAfterHousing);

  el.innerHTML = `
    <div class="status-badge ${statusClass}">${label}${res.netAfterHousing >= 0 ? ` — ${fmtPct(res.breathingPct)} of take-home remaining` : ` — ${fmt(Math.abs(res.netAfterHousing))}/mo more than you earn`}</div>
    <div class="info-grid">
      <div class="info-item"><div class="label">Monthly Take-Home</div><div class="value">${fmt(res.inp.netMonthly)}</div></div>
      <div class="info-item"><div class="label">Total Housing Cost</div><div class="value">− ${fmt(res.totalHousing)}</div></div>
      <div class="info-item"><div class="label">Debts</div><div class="value">− ${fmt(res.inp.monthlyDebts)}</div></div>
      <div class="info-item"><div class="label">Bills & Living Costs</div><div class="value">− ${fmt(res.inp.monthlyBills)}</div></div>
      ${res.inp.costBump > 0 ? `<div class="info-item"><div class="label">Expected Cost Increase</div><div class="value">− ${fmt(res.inp.costBump)}</div></div>` : ''}
      <div class="info-item"><div class="label">${res.netAfterHousing < 0 ? 'Monthly Shortfall' : 'Remaining'}</div><div class="value">${remainingDisplay}</div></div>
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
    recastAmount: res.recastAmount,
    effectiveLoan: res.effectiveLoan,
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
      <div class="sc-row"><span class="sc-label">Loan Amount</span><span class="sc-value">${fmt(s.loanAmount)}${s.recastAmount > 0 ? ` → ${fmt(s.effectiveLoan)} after recast` : ''}</span></div>
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

  const costEl = $('#costExplainer');
  if (costEl) {
    costEl.innerHTML = `
      <p><strong>Loan amount:</strong> <code>${fmt(inp.targetPrice)} − ${fmt(res.dpDollars)} down = ${fmt(res.loanAmount)}</code></p>
      ${res.recastAmount > 0 ? `<p><strong>Recast:</strong> <code>${fmt(res.loanAmount)} − ${fmt(res.recastAmount)} lump sum = ${fmt(res.effectiveLoan)} effective loan</code></p>` : ''}
      <p><strong>Principal & Interest:</strong> Standard amortization formula for a ${fmt(res.effectiveLoan)} loan at ${(inp.annualRate * 100).toFixed(2)}% over 30 years = <code>${fmt(res.pi)}/mo</code></p>
      <p><strong>Property Tax:</strong> <code>${fmt(inp.targetPrice)} × ${fmtPct(inp.taxRate)} ÷ 12 = ${fmt(res.taxMonthly)}/mo</code></p>
      <p><strong>Insurance:</strong> <code>${fmt(inp.targetPrice)} × ${fmtPct(inp.insRate)} ÷ 12 = ${fmt(res.insMonthly)}/mo</code></p>
      ${res.pmiMonthly > 0 ? `<p><strong>PMI:</strong> <code>${fmt(res.effectiveLoan)} × 0.7% ÷ 12 = ${fmt(res.pmiMonthly)}/mo</code> (because effective LTV > 80%)</p>` : ''}
      ${inp.hoa > 0 ? `<p><strong>HOA:</strong> <code>${fmt(inp.hoa)}/mo</code> (your input)</p>` : ''}
      <p><strong>Total:</strong> <code>${fmt(res.totalHousing)}/mo</code></p>
    `;
  }

  const dtiEl = $('#dtiExplainer');
  if (dtiEl) {
    dtiEl.innerHTML = `
      <p><strong>Front-End DTI:</strong> <code>${fmt(res.totalHousing)} housing ÷ ${fmt(inp.grossMonthly)} gross = ${fmtPct(res.frontDTI)}</code></p>
      <p><strong>Back-End DTI:</strong> <code>(${fmt(res.totalHousing)} housing + ${fmt(inp.monthlyDebts)} debts) ÷ ${fmt(inp.grossMonthly)} gross = ${fmtPct(res.backDTI)}</code></p>
      <p>Conventional loans typically require front-end ≤ 28% and back-end ≤ 36%. FHA allows up to 43% back-end.</p>
    `;
  }
}

// ── Bank vs. Reality ────────────────────────────────
function renderReality(res) {
  const rb = res.realityBudget;
  const inp = res.inp;
  const hasCurrentSpending = inp.currentRent > 0 || inp.monthlyBills > 0;

  function stackedBar(segments, height) {
    height = height || 28;
    let html = `<div class="stacked-bar" style="height:${height}px">`;
    segments.forEach(s => {
      if (s.pct <= 0) return;
      const w = Math.min(s.pct * 100, 100);
      html += `<div class="stacked-seg" style="width:${w}%;background:${s.color}" title="${s.label}: ${fmtPct(s.pct)}"></div>`;
    });
    html += '</div>';
    return html;
  }

  const bankHousingPct = rb.bankFrontPct;
  const bankDebtsPct = inp.grossMonthly > 0 ? inp.monthlyDebts / inp.grossMonthly : 0;
  const bankTaxWedgePct = rb.taxWedgePct;
  const bankOtherPct = Math.max(0, 1 - bankHousingPct - bankDebtsPct - bankTaxWedgePct);

  const bankBar = stackedBar([
    { pct: bankHousingPct, color: 'var(--clr-primary)', label: 'Housing' },
    { pct: bankDebtsPct, color: 'var(--clr-warn)', label: 'Debts' },
    { pct: bankTaxWedgePct, color: 'var(--clr-muted)', label: 'Taxes/Deductions' },
    { pct: bankOtherPct, color: 'var(--clr-success)', label: 'Remaining' },
  ]);

  let currentBar = '';
  let currentSection = '';
  if (hasCurrentSpending) {
    const cRentPct = inp.netMonthly > 0 ? inp.currentRent / inp.netMonthly : 0;
    const cBillsPct = inp.netMonthly > 0 ? inp.monthlyBills / inp.netMonthly : 0;
    const cDebtsPct = inp.netMonthly > 0 ? inp.monthlyDebts / inp.netMonthly : 0;
    const cRemainingPct = Math.max(0, rb.currentRemainingPct);
    const cOverspent = rb.currentRemaining < 0;
    currentBar = stackedBar([
      { pct: Math.min(cRentPct, 1), color: 'var(--clr-primary)', label: 'Rent/Mortgage' },
      { pct: cBillsPct, color: cOverspent ? 'var(--clr-danger)' : 'var(--clr-warn)', label: 'Bills' },
      { pct: cDebtsPct, color: '#d97706', label: 'Debts' },
      { pct: cRemainingPct, color: 'var(--clr-success)', label: 'Remaining' },
    ]);
    currentSection = `
      <div class="reality-block">
        <div class="reality-block-header">
          <span class="reality-block-title">Your Current Budget</span>
          <span class="reality-block-basis">Based on ${fmt(inp.netMonthly)}/mo take-home</span>
        </div>
        ${currentBar}
        <div class="reality-legend">
          ${inp.currentRent > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:var(--clr-primary)"></span>Rent/Mortgage: ${fmt(inp.currentRent)} (${fmtPct(cRentPct)})</span>` : ''}
          ${inp.monthlyBills > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:var(--clr-warn)"></span>Bills: ${fmt(inp.monthlyBills)} (${fmtPct(cBillsPct)})</span>` : ''}
          ${inp.monthlyDebts > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:#d97706"></span>Debts: ${fmt(inp.monthlyDebts)} (${fmtPct(cDebtsPct)})</span>` : ''}
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-success)"></span>Remaining: ${rb.currentRemaining < 0 ? '−' + fmt(Math.abs(rb.currentRemaining)) : fmt(rb.currentRemaining)} (${fmtPct(rb.currentRemainingPct)})</span>
        </div>
      </div>`;
  }

  const pOverspent = rb.projectedRemaining < 0;
  const pHousingPct = inp.netMonthly > 0 ? res.totalHousing / inp.netMonthly : 0;
  const pBillsPct = inp.netMonthly > 0 ? inp.monthlyBills / inp.netMonthly : 0;
  const pBumpPct = inp.netMonthly > 0 ? inp.costBump / inp.netMonthly : 0;
  const pDebtsPct = inp.netMonthly > 0 ? inp.monthlyDebts / inp.netMonthly : 0;
  const pRemainingPct = Math.max(0, rb.projectedRemainingPct);

  const projectedBar = stackedBar([
    { pct: Math.min(pHousingPct, 1), color: 'var(--clr-primary)', label: 'New Housing' },
    { pct: pBillsPct, color: 'var(--clr-warn)', label: 'Bills' },
    { pct: pBumpPct, color: '#e879f9', label: 'Cost Increase' },
    { pct: pDebtsPct, color: '#d97706', label: 'Debts' },
    { pct: pRemainingPct, color: 'var(--clr-success)', label: 'Remaining' },
  ]);

  let projectedVerdict = '';
  if (pOverspent) {
    projectedVerdict = `<div class="reality-verdict reality-verdict-bad">You'd be spending <strong>${fmt(Math.abs(rb.projectedRemaining))}/mo more than you earn</strong>. This home is not affordable on your take-home pay.</div>`;
  } else if (rb.projectedRemainingPct < 0.10) {
    projectedVerdict = `<div class="reality-verdict reality-verdict-bad">Only <strong>${fmtPct(rb.projectedRemainingPct)}</strong> of take-home left. Extremely tight — one unexpected expense could break the budget.</div>`;
  } else if (rb.projectedRemainingPct < 0.20) {
    projectedVerdict = `<div class="reality-verdict reality-verdict-warn">Only <strong>${fmtPct(rb.projectedRemainingPct)}</strong> of take-home left (${fmt(rb.projectedRemaining)}/mo). Manageable, but not much room for savings or surprises.</div>`;
  } else {
    projectedVerdict = `<div class="reality-verdict reality-verdict-good"><strong>${fmtPct(rb.projectedRemainingPct)}</strong> of take-home left (${fmt(rb.projectedRemaining)}/mo). Healthy margin for savings, fun, and the unexpected.</div>`;
  }

  const gapCallout = `
    <div class="reality-gap-callout">
      <strong>The gap banks don't show you:</strong> Your gross is ${fmt(inp.grossMonthly)}/mo but only ${fmt(inp.netMonthly)}/mo hits your account —
      <strong>${fmtPct(rb.taxWedgePct)}</strong> goes to taxes & deductions before you see it.
      The bank's ${fmtPct(rb.bankFrontPct)} DTI is calculated on gross, but in net-income terms your housing alone is
      <strong>${fmtPct(inp.netMonthly > 0 ? res.totalHousing / inp.netMonthly : 0)}</strong> of what you actually take home.
    </div>`;

  const el = $('#realityContent');
  el.innerHTML = `
    <div class="reality-side">
      <h3 class="reality-side-title">🏦 What the Bank Sees</h3>
      <div class="reality-block">
        <div class="reality-block-header">
          <span class="reality-block-title">Gross Income Allocation</span>
          <span class="reality-block-basis">${fmt(inp.grossMonthly)}/mo gross</span>
        </div>
        ${bankBar}
        <div class="reality-legend">
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-primary)"></span>Housing: ${fmt(res.totalHousing)} (${fmtPct(bankHousingPct)})</span>
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-warn)"></span>Debts: ${fmt(inp.monthlyDebts)} (${fmtPct(bankDebtsPct)})</span>
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-muted)"></span>Taxes/Deductions: ${fmt(rb.taxWedge)} (${fmtPct(bankTaxWedgePct)})</span>
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-success)"></span>Remaining: ${fmt(rb.grossUnused)} (${fmtPct(bankOtherPct)})</span>
        </div>
        <div class="reality-dti-badges">
          <span class="reality-dti-badge">Front DTI: <strong>${fmtPct(rb.bankFrontPct)}</strong></span>
          <span class="reality-dti-badge">Back DTI: <strong>${fmtPct(rb.bankBackPct)}</strong></span>
          <span class="reality-dti-badge ${rb.bankBackPct <= 0.36 ? 'badge-ok' : rb.bankBackPct <= 0.43 ? 'badge-warn' : 'badge-bad'}">
            ${rb.bankBackPct <= 0.36 ? '✓ Conventional OK' : rb.bankBackPct <= 0.43 ? '⚠ FHA limit' : '✗ Over limit'}
          </span>
        </div>
      </div>
    </div>

    <div class="reality-side">
      <h3 class="reality-side-title">👤 What You Actually Live On</h3>
      ${currentSection}
      <div class="reality-block ${pOverspent ? 'reality-block-danger' : ''}">
        <div class="reality-block-header">
          <span class="reality-block-title">${hasCurrentSpending ? 'Projected After Buying' : 'After Buying'}</span>
          <span class="reality-block-basis">Based on ${fmt(inp.netMonthly)}/mo take-home</span>
        </div>
        ${projectedBar}
        <div class="reality-legend">
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-primary)"></span>Housing: ${fmt(res.totalHousing)} (${fmtPct(pHousingPct)})</span>
          ${inp.monthlyBills > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:var(--clr-warn)"></span>Bills: ${fmt(inp.monthlyBills)} (${fmtPct(pBillsPct)})</span>` : ''}
          ${inp.costBump > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:#e879f9"></span>Cost Increase: ${fmt(inp.costBump)} (${fmtPct(pBumpPct)})</span>` : ''}
          ${inp.monthlyDebts > 0 ? `<span class="reality-legend-item"><span class="swatch" style="background:#d97706"></span>Debts: ${fmt(inp.monthlyDebts)} (${fmtPct(pDebtsPct)})</span>` : ''}
          <span class="reality-legend-item"><span class="swatch" style="background:var(--clr-success)"></span>Remaining: ${rb.projectedRemaining < 0 ? '−' + fmt(Math.abs(rb.projectedRemaining)) : fmt(rb.projectedRemaining)} (${fmtPct(rb.projectedRemainingPct)})</span>
        </div>
        ${projectedVerdict}
      </div>
    </div>

    ${gapCallout}
    ${!hasCurrentSpending ? '<p class="reality-hint">💡 <strong>Tip:</strong> Enter your current rent/mortgage and monthly bills above to see your full before-and-after budget picture.</p>' : ''}
  `;

  const explainerEl = $('#realityExplainer');
  if (explainerEl) {
    explainerEl.innerHTML = `
      <p><strong>Banks use gross income</strong> to calculate DTI because it's standardized and verifiable (W-2, tax returns).
      But nobody takes home their gross — taxes, health insurance, 401k, etc. are deducted first.</p>
      <p><strong>Your numbers:</strong> Gross ${fmt(inp.grossMonthly)}/mo → Take-home ${fmt(inp.netMonthly)}/mo.
      That's a ${fmtPct(rb.taxWedgePct)} reduction before you can spend a dollar.</p>
      <p><strong>The illusion:</strong> A ${fmtPct(rb.bankFrontPct)} front-end DTI sounds fine, but when you convert housing cost to a share of
      <em>take-home</em> pay it's actually <code>${fmtPct(inp.netMonthly > 0 ? res.totalHousing / inp.netMonthly : 0)}</code>.
      Add in real bills and debts, and the picture changes dramatically.</p>
      <p><strong>Rule of thumb:</strong> If less than 20% of your take-home remains after housing + bills + debts,
      you'll feel the squeeze — regardless of what the bank says you can "afford."</p>
    `;
  }
}

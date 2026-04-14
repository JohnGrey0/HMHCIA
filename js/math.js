/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   How Much House — Core Math Functions
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

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

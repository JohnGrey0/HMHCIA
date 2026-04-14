/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   How Much House — Utility Helpers
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
const fmtPct = (n) => (n * 100).toFixed(1) + '%';
const tip = (text) => `<span class="fof-tip" tabindex="0"><span class="fof-tip-icon">i</span><span class="fof-tip-body">${text}</span></span>`;
const parseNum = (str) => {
  if (!str) return 0;
  return parseFloat(String(str).replace(/[^0-9.\-]/g, '')) || 0;
};

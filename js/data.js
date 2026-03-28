/**
 * State-level property tax and homeowner's insurance data.
 * Sources: U.S. Census Bureau, Tax Foundation, NAIC (rates as of 2025).
 * All rates are effective annual percentages of home value.
 */

const STATE_DATA = {
  AL: { name: "Alabama",              taxRate: 0.0041, insRate: 0.0078 },
  AK: { name: "Alaska",               taxRate: 0.0119, insRate: 0.0072 },
  AZ: { name: "Arizona",              taxRate: 0.0062, insRate: 0.0052 },
  AR: { name: "Arkansas",             taxRate: 0.0062, insRate: 0.0090 },
  CA: { name: "California",           taxRate: 0.0074, insRate: 0.0047 },
  CO: { name: "Colorado",             taxRate: 0.0051, insRate: 0.0065 },
  CT: { name: "Connecticut",          taxRate: 0.0215, insRate: 0.0052 },
  DE: { name: "Delaware",             taxRate: 0.0057, insRate: 0.0042 },
  FL: { name: "Florida",              taxRate: 0.0089, insRate: 0.0130 },
  GA: { name: "Georgia",              taxRate: 0.0092, insRate: 0.0070 },
  HI: { name: "Hawaii",               taxRate: 0.0028, insRate: 0.0035 },
  ID: { name: "Idaho",                taxRate: 0.0069, insRate: 0.0047 },
  IL: { name: "Illinois",             taxRate: 0.0227, insRate: 0.0058 },
  IN: { name: "Indiana",              taxRate: 0.0085, insRate: 0.0048 },
  IA: { name: "Iowa",                 taxRate: 0.0157, insRate: 0.0055 },
  KS: { name: "Kansas",               taxRate: 0.0141, insRate: 0.0085 },
  KY: { name: "Kentucky",             taxRate: 0.0086, insRate: 0.0070 },
  LA: { name: "Louisiana",            taxRate: 0.0055, insRate: 0.0110 },
  ME: { name: "Maine",                taxRate: 0.0136, insRate: 0.0042 },
  MD: { name: "Maryland",             taxRate: 0.0109, insRate: 0.0045 },
  MA: { name: "Massachusetts",        taxRate: 0.0123, insRate: 0.0050 },
  MI: { name: "Michigan",             taxRate: 0.0154, insRate: 0.0052 },
  MN: { name: "Minnesota",            taxRate: 0.0112, insRate: 0.0058 },
  MS: { name: "Mississippi",          taxRate: 0.0081, insRate: 0.0093 },
  MO: { name: "Missouri",             taxRate: 0.0097, insRate: 0.0075 },
  MT: { name: "Montana",              taxRate: 0.0084, insRate: 0.0065 },
  NE: { name: "Nebraska",             taxRate: 0.0173, insRate: 0.0078 },
  NV: { name: "Nevada",               taxRate: 0.0060, insRate: 0.0045 },
  NH: { name: "New Hampshire",        taxRate: 0.0218, insRate: 0.0045 },
  NJ: { name: "New Jersey",           taxRate: 0.0249, insRate: 0.0042 },
  NM: { name: "New Mexico",           taxRate: 0.0080, insRate: 0.0060 },
  NY: { name: "New York",             taxRate: 0.0172, insRate: 0.0048 },
  NC: { name: "North Carolina",       taxRate: 0.0084, insRate: 0.0055 },
  ND: { name: "North Dakota",         taxRate: 0.0098, insRate: 0.0065 },
  OH: { name: "Ohio",                 taxRate: 0.0156, insRate: 0.0048 },
  OK: { name: "Oklahoma",             taxRate: 0.0090, insRate: 0.0120 },
  OR: { name: "Oregon",               taxRate: 0.0097, insRate: 0.0042 },
  PA: { name: "Pennsylvania",         taxRate: 0.0158, insRate: 0.0042 },
  RI: { name: "Rhode Island",         taxRate: 0.0163, insRate: 0.0055 },
  SC: { name: "South Carolina",       taxRate: 0.0057, insRate: 0.0068 },
  SD: { name: "South Dakota",         taxRate: 0.0131, insRate: 0.0073 },
  TN: { name: "Tennessee",            taxRate: 0.0071, insRate: 0.0072 },
  TX: { name: "Texas",                taxRate: 0.0180, insRate: 0.0105 },
  UT: { name: "Utah",                 taxRate: 0.0063, insRate: 0.0042 },
  VT: { name: "Vermont",              taxRate: 0.0190, insRate: 0.0040 },
  VA: { name: "Virginia",             taxRate: 0.0082, insRate: 0.0042 },
  WA: { name: "Washington",           taxRate: 0.0098, insRate: 0.0042 },
  WV: { name: "West Virginia",        taxRate: 0.0058, insRate: 0.0055 },
  WI: { name: "Wisconsin",            taxRate: 0.0185, insRate: 0.0042 },
  WY: { name: "Wyoming",              taxRate: 0.0061, insRate: 0.0052 },
  DC: { name: "District of Columbia", taxRate: 0.0056, insRate: 0.0035 }
};

/** Default assumptions */
const DEFAULTS = {
  interestRate: 0.0685,       // 6.85% — conventional 30-yr fixed (2025 avg)
  loanTermYears: 30,
  closingCostPct: 0.03,       // 3% of purchase price
  pmiRate: 0.007,             // 0.7% of loan amount per year (mid-range)
  pmiThresholdLTV: 0.80,      // PMI drops at 80% LTV
  appreciationRate: 0.03,     // 3% annual appreciation (optional toggle)
  // DTI thresholds
  dtiConservativeFront: 0.25,
  dtiConservativeBack:  0.30,
  dtiModerateFront:     0.28,
  dtiModerateBack:      0.36,
  dtiAggressiveFront:   0.31,
  dtiAggressiveBack:    0.43
};

export type RiskLevel = 'low' | 'medium' | 'high';
export type EmploymentType = 'salaried' | 'business';

export interface FinancialFormData {
  fullName: string;
  email: string;
  phone: string;
  age: number;
  employmentType: EmploymentType;
  married: boolean;
  numKids: number;
  personalGoal: string;
  investRisk: RiskLevel;

  grossIncomePerYear: number;
  basicSalaryPerYear: number;
  takeHomePerMonth: number;
  totalMonthlyExpenses: number;
  otherIncomePerYear: number;

  houseEmiPerMonth: number;
  vehicleEmiPerMonth: number;
  otherEmiPerMonth: number;

  fdMaturedThisYear: number;
  dividendsThisYear: number;
  mfCapitalGainsThisYear: number;

  sgbFutureValue: number;
  fdFutureValue: number;
  mfUnrealizedFuture: number;
  epfCorpus: number;
  ppfCorpus: number;
  npsCorpus: number;
  ssyLicCorpus: number;
  otherFutureCorpus: number;

  selfPropertyValue: number;
  rentalPropertyValue: number;
  plotLandValue: number;
  parentalPropertyValue: number;
  jewelryValue: number;

  lifeTermInsurancePerYear: number;
  medicalInsurancePerYear: number;
  parentsLifeInsurancePerYear: number;
  parentsMedicalInsurancePerYear: number;
  buildingInsurancePerYear: number;

  epfPerYear: number;
  vpfPerYear: number;
  homeLoanPrincipalPerYear: number;
  nps80ccd2PerYear: number;
  childrenTuitionPerYear: number;
  ppfPerYear: number;
  elssPerYear: number;
  ssyPerYear: number;

  nps80ccd1bPerYear: number;
  educationLoanInterestPerYear: number;
  savings80ttaPerYear: number;
  donationsPerYear: number;

  stocksMfPerYear: number;

  targetAmount: number;
  yearsToGoal: number;
}

export interface RecommendationItem {
  description: string;
  currentAmount: number;
  suggestedAmount: number;
  action: string;
  status: 'done' | 'gap' | 'new';
  tier: 'immediate' | 'medium' | 'long';
}

export interface ReportResult {
  netInvestableFundNow: number;
  futureLiquidFunds: number;
  immovableAssets: number;
  total80C: number;
  totalVIA: number;
  totalInsurance: number;
  estInvFund: number;
  invstOpt: string;
  recommendation: string;
  summary: string;
  targetGap: number;
  targetStatus: 'on-track' | 'under-target';
  recommendations: RecommendationItem[];
}

const LIMIT_80C = 150000;
const LIMIT_NPS_VIA = 50000;
const LIMIT_80TTA = 10000;
const LIMIT_MEDICAL_SELF = 25000;
const LIMIT_MEDICAL_PARENTS_SR = 50000;
const EMERGENCY_RESERVE = 100000;

export function calculateReport(data: FinancialFormData): ReportResult {
  // === Est_Inv_Fund calculation chain (Sheet 4) ===
  const takeHomePerYear = data.takeHomePerMonth * 12;
  const totalExpensesPerYear = data.totalMonthlyExpenses * 12;
  const totalLoanEmiPerYear =
    (data.houseEmiPerMonth + data.vehicleEmiPerMonth + data.otherEmiPerMonth) * 12;
  const totalLiquidNow =
    data.fdMaturedThisYear + data.dividendsThisYear + data.mfCapitalGainsThisYear;
  const totalInsurance =
    data.lifeTermInsurancePerYear + data.medicalInsurancePerYear +
    data.parentsLifeInsurancePerYear + data.parentsMedicalInsurancePerYear +
    data.buildingInsurancePerYear;

  // 80C: tuition fee is already part of expenses so NOT re-subtracted from fund
  const total80C =
    data.epfPerYear + data.vpfPerYear + data.homeLoanPrincipalPerYear +
    data.nps80ccd2PerYear + data.ppfPerYear + data.elssPerYear + data.ssyPerYear;

  const totalVIA =
    data.nps80ccd1bPerYear + data.educationLoanInterestPerYear +
    data.savings80ttaPerYear + data.donationsPerYear;

  const netInvestableFundNow =
    takeHomePerYear
    - totalExpensesPerYear
    + data.otherIncomePerYear
    - totalLoanEmiPerYear
    + totalLiquidNow
    - totalInsurance
    - total80C
    - totalVIA
    - data.stocksMfPerYear
    - EMERGENCY_RESERVE;

  const futureLiquidFunds =
    data.sgbFutureValue + data.fdFutureValue + data.mfUnrealizedFuture +
    data.epfCorpus + data.ppfCorpus + data.npsCorpus +
    data.ssyLicCorpus + data.otherFutureCorpus;

  const immovableAssets =
    data.selfPropertyValue + data.rentalPropertyValue + data.plotLandValue +
    data.parentalPropertyValue + data.jewelryValue;

  // === Recommendations ===
  const recs: RecommendationItem[] = [];

  // --- IMMEDIATE: Insurance ---
  recs.push({
    description: 'Life Term Insurance – 80C/yr',
    currentAmount: data.lifeTermInsurancePerYear,
    suggestedAmount: data.lifeTermInsurancePerYear > 0 ? 0 : 15000,
    action: data.lifeTermInsurancePerYear > 0
      ? 'Pure term plan (0 return) — confirm sum assured covers 10–15× annual income; check years remaining'
      : 'Take a pure term insurance for self, spouse and children — 0 return, maximum cover',
    status: data.lifeTermInsurancePerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Medical Insurance – self, spouse, kids (80D)',
    currentAmount: data.medicalInsurancePerYear,
    suggestedAmount: data.medicalInsurancePerYear > 0 ? 0 : 20000,
    action: data.medicalInsurancePerYear > 0
      ? 'Confirm if office policy or personal — personal is must; check unlimited restore and sum assured'
      : 'Take a comprehensive family floater with unlimited restore — min ₹10L sum assured',
    status: data.medicalInsurancePerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Life Insurance for Parents – 80D',
    currentAmount: data.parentsLifeInsurancePerYear,
    suggestedAmount: data.parentsLifeInsurancePerYear > 0 ? 0 : 0,
    action: data.parentsLifeInsurancePerYear > 0
      ? 'Confirm sum assured and years remaining; review coverage'
      : 'Consider life insurance for dependant parents if they have no income source',
    status: data.parentsLifeInsurancePerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Medical Insurance for Parents – 80D',
    currentAmount: data.parentsMedicalInsurancePerYear,
    suggestedAmount: data.parentsMedicalInsurancePerYear > 0 ? 0 : 15000,
    action: data.parentsMedicalInsurancePerYear > 0
      ? 'Senior citizen plan — confirm ₹5L+ coverage with unlimited restore'
      : 'Take a senior citizen health plan for parents; deduction limit ₹50K for senior citizens',
    status: data.parentsMedicalInsurancePerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Building / Property Insurance',
    currentAmount: data.buildingInsurancePerYear,
    suggestedAmount: data.buildingInsurancePerYear > 0 ? 0 : 5000,
    action: data.buildingInsurancePerYear > 0
      ? 'Confirm coverage amount matches current property value; review annually'
      : 'Insure your home/property against fire, flood and structural damage — approx ₹5K/yr for ₹50L cover',
    status: data.buildingInsurancePerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  // --- IMMEDIATE: 80C Investments ---
  recs.push({
    description: 'EPF – Employees Provident Fund (80C)',
    currentAmount: data.epfPerYear,
    suggestedAmount: 0,
    action: data.epfPerYear > 0
      ? `Deducted by employer — confirm current corpus and if contribution > ₹2.5L/yr (interest taxable above that)`
      : 'Ensure employer is deducting EPF; verify contribution is reflected in salary slip',
    status: data.epfPerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  const vpfHeadroom = Math.max(0, LIMIT_80C - data.epfPerYear);
  recs.push({
    description: 'VPF – Voluntary PF (80C)',
    currentAmount: data.vpfPerYear,
    // Only suggest a top-up if VPF is already started; if 0, no gap (Excel: IF(VPF>0, gap, 0))
    suggestedAmount: data.vpfPerYear > 0 ? Math.max(0, vpfHeadroom - data.vpfPerYear) : 0,
    action: data.vpfPerYear > 0
      ? 'Increase VPF to maximize ₹1.5L 80C limit'
      : 'Increase EPF voluntary contribution through employer to utilize the ₹1.5L 80C limit',
    status: data.vpfPerYear >= vpfHeadroom && vpfHeadroom > 0 ? 'done' : data.vpfPerYear > 0 ? 'gap' : 'new',
    tier: 'immediate'
  });

  if (data.employmentType === 'salaried' && data.basicSalaryPerYear > 0) {
    const npsEmployerSuggested = Math.round(data.basicSalaryPerYear * 0.14);
    recs.push({
      description: 'NPS via Employer – 80CCD2 (over & above 80C)',
      currentAmount: data.nps80ccd2PerYear,
      suggestedAmount: data.nps80ccd2PerYear > 0 ? 0 : npsEmployerSuggested,
      action: data.nps80ccd2PerYear > 0
        ? `Deducted by employer (14% of basic = ₹${npsEmployerSuggested.toLocaleString('en-IN')} suggested) — review Tier-1 fund allocation`
        : `Open NPS Tier-1 through employer — 14% of basic salary (₹${npsEmployerSuggested.toLocaleString('en-IN')}/yr) is a deduction over and above the ₹1.5L 80C limit`,
      status: data.nps80ccd2PerYear > 0 ? 'done' : 'new',
      tier: 'immediate'
    });
  }

  recs.push({
    description: 'Home Loan Principal Repayment – 80C',
    currentAmount: data.homeLoanPrincipalPerYear,
    suggestedAmount: data.homeLoanPrincipalPerYear > 0 ? 0 : 150000,
    action: data.homeLoanPrincipalPerYear > 0
      ? 'Already part of EMI — consider SBI/HDFC Max Gain OD account to park surplus and reduce interest outgo'
      : 'Consider taking a home loan — principal repayment up to ₹1.5L qualifies for 80C and interest deduction under 24B',
    status: data.homeLoanPrincipalPerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Home Loan Interest – 24B (self-occupied)',
    currentAmount: data.houseEmiPerMonth > 0 ? 200000 : 0,
    suggestedAmount: data.homeLoanPrincipalPerYear > 0 ? 0 : 200000,
    action: data.homeLoanPrincipalPerYear > 0
      ? 'Claim interest deduction under 24B — max ₹2L/yr for self-occupied property; ensure Form 16 Part B reflects this'
      : 'Home loan interest up to ₹2L/yr is deductible under 24B — reduces taxable income significantly',
    status: data.homeLoanPrincipalPerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  if (data.childrenTuitionPerYear > 0) {
    recs.push({
      description: "Children's Tuition Fees – 80C",
      currentAmount: data.childrenTuitionPerYear,
      suggestedAmount: 0,
      action: 'Included in 80C limit; ensure fee receipts from school/college are retained for ITR',
      status: 'done',
      tier: 'immediate'
    });
  }

  const ppfGap = data.ppfPerYear > 0 ? Math.max(0, LIMIT_80C - data.ppfPerYear) : LIMIT_80C;
  recs.push({
    description: 'PPF – Public Provident Fund (80C)',
    currentAmount: data.ppfPerYear,
    suggestedAmount: ppfGap,
    action: data.ppfPerYear >= LIMIT_80C
      ? 'Maximized — extend in 5-yr blocks after maturity; tax-free compounding'
      : data.ppfPerYear > 0
      ? 'Increase PPF contribution to ₹1.5L/yr; open accounts for spouse and children too'
      : 'Open PPF account for self, spouse and children; invest up to ₹1.5L/yr',
    status: data.ppfPerYear >= LIMIT_80C ? 'done' : data.ppfPerYear > 0 ? 'gap' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'ELSS / Tax-saving MF – 80C (3-yr lock-in)',
    currentAmount: data.elssPerYear,
    suggestedAmount: 0,
    action: data.elssPerYear > 0
      ? 'Review on maturity — reinvest in index funds or balanced advantage funds for continued growth'
      : 'Consider ELSS for remaining 80C headroom; best returns among 80C options with 3-yr lock-in',
    status: data.elssPerYear > 0 ? 'done' : 'new',
    tier: 'immediate'
  });

  recs.push({
    description: 'Sukanya Samriddhi Yojana (SSY) – girl child under 10 yrs',
    currentAmount: data.ssyPerYear,
    suggestedAmount: data.ssyPerYear > 0 ? Math.max(0, LIMIT_80C - data.ssyPerYear) : LIMIT_80C,
    action: data.ssyPerYear > 0
      ? 'Continue — eligible until child turns 21; increase to ₹1.5L/yr to maximize 80C benefit'
      : 'Open SSY account in SBI or any bank if you have a girl child under 10 yrs',
    status: data.ssyPerYear >= LIMIT_80C ? 'done' : data.ssyPerYear > 0 ? 'gap' : 'new',
    // Already invested (gap) → medium term (ongoing); not started → immediate (open now)
    tier: data.ssyPerYear > 0 ? 'medium' : 'immediate'
  });

  // --- IMMEDIATE: VIA Investments ---
  const npsViaGap = data.nps80ccd1bPerYear > 0
    ? Math.max(0, LIMIT_NPS_VIA - data.nps80ccd1bPerYear)
    : LIMIT_NPS_VIA;
  recs.push({
    description: 'NPS Self Contribution – 80CCD1b (extra ₹50K beyond 80C)',
    currentAmount: data.nps80ccd1bPerYear,
    suggestedAmount: npsViaGap,
    action: data.nps80ccd1bPerYear >= LIMIT_NPS_VIA
      ? 'Maximized ₹50K extra deduction — review Tier-1 fund allocation annually'
      : data.nps80ccd1bPerYear > 0
      ? 'Increase to ₹50K for maximum extra tax benefit'
      : 'Open NPS Tier-1 and contribute ₹50K/yr — deduction over and above 80C limit',
    status: data.nps80ccd1bPerYear >= LIMIT_NPS_VIA ? 'done' : data.nps80ccd1bPerYear > 0 ? 'gap' : 'new',
    tier: 'immediate'
  });

  if (data.savings80ttaPerYear > 0) {
    recs.push({
      description: '80TTA – Interest on Savings Account',
      currentAmount: data.savings80ttaPerYear,
      suggestedAmount: 0,
      action: `₹${Math.min(data.savings80ttaPerYear, LIMIT_80TTA).toLocaleString('en-IN')} is deductible (max ₹10K for non-senior citizens); ensure this is claimed in ITR`,
      status: 'done',
      tier: 'immediate'
    });
  }

  if (data.educationLoanInterestPerYear > 0) {
    recs.push({
      description: '80E – Interest on Education Loan',
      currentAmount: data.educationLoanInterestPerYear,
      suggestedAmount: 0,
      action: 'Deductible for up to 8 years from start of repayment; ensure claimed in ITR every year',
      status: 'done',
      tier: 'immediate'
    });
  }

  if (data.donationsPerYear > 0) {
    recs.push({
      description: '80G – Donations',
      currentAmount: data.donationsPerYear,
      suggestedAmount: 0,
      action: 'Retain donation receipts; 50% or 100% deductible depending on the qualifying institution',
      status: 'done',
      tier: 'immediate'
    });
  }

  if (data.stocksMfPerYear > 0) {
    recs.push({
      description: 'Stock Market / Mutual Funds (additional investments)',
      currentAmount: data.stocksMfPerYear,
      suggestedAmount: data.stocksMfPerYear,
      action: 'Review portfolio allocation and rebalance annually; consider moving to index funds for lower cost',
      status: 'done',
      tier: 'immediate'
    });
  }

  // --- MEDIUM TERM ---
  if (data.houseEmiPerMonth > 0) {
    recs.push({
      description: 'Home Loan EMI',
      currentAmount: data.houseEmiPerMonth * 12,
      suggestedAmount: data.houseEmiPerMonth * 12,
      action: 'Convert to Max Gain OD account (SBI/HDFC/BoB) — park monthly surplus to reduce outstanding principal and save interest',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.fdMaturedThisYear > 0) {
    recs.push({
      description: 'FD Matured / Interest Credited This Year',
      currentAmount: data.fdMaturedThisYear,
      suggestedAmount: data.fdMaturedThisYear,
      action: 'Reinvest in higher-yield instruments — debt MF, Sovereign Gold Bonds, or balanced advantage funds',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.dividendsThisYear > 0) {
    recs.push({
      description: 'Dividend Income This Year',
      currentAmount: data.dividendsThisYear,
      suggestedAmount: data.dividendsThisYear,
      action: 'Switch to growth plans in MF to avoid TDS; reinvest dividends in growth-oriented equity',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.mfCapitalGainsThisYear > 0) {
    recs.push({
      description: 'MF/Equity Capital Gains Realized This Year',
      currentAmount: data.mfCapitalGainsThisYear,
      suggestedAmount: data.mfCapitalGainsThisYear,
      action: 'Use LTCG ₹1.25L annual exemption; offset gains with tax-loss harvesting; reinvest in ELSS/PPF',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.sgbFutureValue > 0) {
    recs.push({
      description: 'RBI Sovereign Gold Bond (SGB) – Future Maturity',
      currentAmount: data.sgbFutureValue,
      suggestedAmount: data.sgbFutureValue,
      action: 'Hold to 8-yr maturity for tax-free capital gain; reinvest in equity post-maturity',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.fdFutureValue > 0) {
    recs.push({
      description: 'FD – Maturity Amount (Future)',
      currentAmount: data.fdFutureValue,
      suggestedAmount: data.fdFutureValue,
      action: 'Note maturity year; plan reinvestment in equity or SGB for better post-tax returns',
      status: 'done',
      tier: 'medium'
    });
  }

  if (data.mfUnrealizedFuture > 0) {
    recs.push({
      description: 'MF/Equity – Unrealized / Invested (Future)',
      currentAmount: data.mfUnrealizedFuture,
      suggestedAmount: data.mfUnrealizedFuture,
      action: 'Review fund performance; consider switching underperformers to index funds',
      status: 'done',
      tier: 'medium'
    });
  }

  // --- LONG TERM ---
  if (data.epfCorpus > 0) {
    recs.push({
      description: 'EPF Corpus (Accumulated)',
      currentAmount: data.epfCorpus,
      suggestedAmount: data.epfCorpus,
      action: 'Do not withdraw before retirement — EPF interest (8.25%/yr tax-free) compounds significantly; withdrawal before 5 yrs is taxable',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.ppfCorpus > 0) {
    recs.push({
      description: 'PPF Corpus (Accumulated)',
      currentAmount: data.ppfCorpus,
      suggestedAmount: data.ppfCorpus,
      action: 'Extend PPF in 5-yr blocks after 15-yr maturity; tax-free compounding is ideal for long-term goals',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.npsCorpus > 0) {
    recs.push({
      description: 'NPS Corpus (Accumulated)',
      currentAmount: data.npsCorpus,
      suggestedAmount: data.npsCorpus,
      action: '60% corpus is tax-free at retirement; annuitize 40% for pension income; review Tier-1 asset allocation (equity/debt mix)',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.ssyLicCorpus > 0) {
    recs.push({
      description: 'SSY / LIC / ULIP / Bond / NSC Corpus',
      currentAmount: data.ssyLicCorpus,
      suggestedAmount: data.ssyLicCorpus,
      action: 'Check maturity year and lock-in for each instrument; plan reinvestment strategy on maturity',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.otherFutureCorpus > 0) {
    recs.push({
      description: 'Other Future Corpus',
      currentAmount: data.otherFutureCorpus,
      suggestedAmount: data.otherFutureCorpus,
      action: 'Identify each component; plan maturity reinvestment to avoid idle cash',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.selfPropertyValue > 0) {
    recs.push({
      description: 'Self-Occupied Property',
      currentAmount: data.selfPropertyValue,
      suggestedAmount: data.selfPropertyValue,
      action: 'Link home loan to Max Gain OD to reduce interest; ensure Will and nomination are updated',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.rentalPropertyValue > 0) {
    recs.push({
      description: 'Rental / Investment Property',
      currentAmount: data.rentalPropertyValue,
      suggestedAmount: data.rentalPropertyValue,
      action: 'Optimise rental yield; review if capital redeployment gives better risk-adjusted returns',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.plotLandValue > 0) {
    recs.push({
      description: 'Plot / Land (Investment)',
      currentAmount: data.plotLandValue,
      suggestedAmount: data.plotLandValue,
      action: 'Identify purpose (self-use or investment); consider development or structured sale at right price point',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.parentalPropertyValue > 0) {
    recs.push({
      description: 'Parental Property / Fund',
      currentAmount: data.parentalPropertyValue,
      suggestedAmount: data.parentalPropertyValue,
      action: 'Plan inheritance structure — update Will, nomination and consider HUF structure for tax efficiency',
      status: 'done',
      tier: 'long'
    });
  }

  if (data.jewelryValue > 0) {
    recs.push({
      description: 'Jewellery / Ornaments',
      currentAmount: data.jewelryValue,
      suggestedAmount: data.jewelryValue,
      action: 'Keep for personal use; for investment exposure to gold, prefer SGB over physical gold',
      status: 'done',
      tier: 'long'
    });
  }

  const invstOpt = netInvestableFundNow > 200000
    ? 'Deploy surplus into NPS, PPF and equity funds for optimal tax efficiency and long-term growth'
    : netInvestableFundNow > 0
    ? 'Start SIP in index funds; maximize 80C and VIA deductions to build wealth systematically'
    : 'Reduce discretionary expenses and loan obligations before allocating to new investments';

  const recommendation = netInvestableFundNow > 0
    ? `Your net investable fund for this year is ₹${netInvestableFundNow.toLocaleString('en-IN')}. ${invstOpt}.`
    : `After all obligations you have a deficit of ₹${Math.abs(netInvestableFundNow).toLocaleString('en-IN')}. Prioritise reducing EMIs and discretionary expenses first.`;

  const targetGap = data.targetAmount - netInvestableFundNow;
  const targetStatus: 'on-track' | 'under-target' = targetGap <= 0 ? 'on-track' : 'under-target';

  return {
    netInvestableFundNow,
    futureLiquidFunds,
    immovableAssets,
    total80C,
    totalVIA,
    totalInsurance,
    estInvFund: netInvestableFundNow,
    invstOpt,
    recommendation,
    summary: `Investable now: ₹${netInvestableFundNow.toLocaleString('en-IN')} | Future corpus: ₹${futureLiquidFunds.toLocaleString('en-IN')} | Assets: ₹${immovableAssets.toLocaleString('en-IN')}`,
    targetGap,
    targetStatus,
    recommendations: recs
  };
}

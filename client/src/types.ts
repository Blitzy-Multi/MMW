export type RiskLevel = 'low' | 'medium' | 'high';
export type EmploymentType = 'salaried' | 'business';

export interface FinancialFormData {
  // Step 1: Personal
  fullName: string;
  email: string;
  phone: string;
  age: number;
  employmentType: EmploymentType;
  married: boolean;
  numKids: number;
  personalGoal: string;
  investRisk: RiskLevel;

  // Step 2: Income & expenses (basic_financial)
  grossIncomePerYear: number;
  basicSalaryPerYear: number;       // manual — used for NPS 80CCD2 suggestion
  takeHomePerMonth: number;
  totalMonthlyExpenses: number;
  otherIncomePerYear: number;

  // Step 3a: Loans
  houseEmiPerMonth: number;
  vehicleEmiPerMonth: number;
  otherEmiPerMonth: number;

  // Step 3b: Liquid funds this year (basic_financial §5)
  fdMaturedThisYear: number;
  dividendsThisYear: number;
  mfCapitalGainsThisYear: number;

  // Step 3c: Future blocked funds (basic_financial §6)
  sgbFutureValue: number;
  fdFutureValue: number;             // 6.3
  mfUnrealizedFuture: number;        // 6.4 unrealized MF/equity
  epfCorpus: number;                 // 6.6
  ppfCorpus: number;                 // 6.7
  npsCorpus: number;                 // 6.8
  ssyLicCorpus: number;              // 6.9 SSY/LIC/ULIP/Bond/NSC
  otherFutureCorpus: number;         // 6.10

  // Step 3d: Immovable assets (basic_financial §7)
  selfPropertyValue: number;         // 7.1
  rentalPropertyValue: number;       // 7.2
  plotLandValue: number;             // 7.3
  parentalPropertyValue: number;     // 7.4
  jewelryValue: number;              // 7.5

  // Step 4a: Insurance (current_Invst_Risk §1)
  lifeTermInsurancePerYear: number;
  medicalInsurancePerYear: number;
  parentsLifeInsurancePerYear: number;
  parentsMedicalInsurancePerYear: number;
  buildingInsurancePerYear: number;

  // Step 4b: 80C investments (current_Invst_Risk §2 + §3)
  epfPerYear: number;
  vpfPerYear: number;
  homeLoanPrincipalPerYear: number;
  nps80ccd2PerYear: number;
  childrenTuitionPerYear: number;    // 3.1 — 80C; already in expenses, not re-deducted
  ppfPerYear: number;
  elssPerYear: number;
  ssyPerYear: number;

  // Step 4c: VIA investments (current_Invst_Risk §4)
  nps80ccd1bPerYear: number;
  educationLoanInterestPerYear: number; // 4.2 — 80E
  savings80ttaPerYear: number;          // 4.3 — savings a/c interest
  donationsPerYear: number;             // 4.5 — 80G

  // Step 4d: Additional investments
  stocksMfPerYear: number;

  // Financial goal
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

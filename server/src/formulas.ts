export type RiskLevel = 'low' | 'medium' | 'high';

export interface FinancialFormData {
  fullName: string;
  email: string;
  phone: string;
  personalGoal: string;
  investRisk: RiskLevel;
  currentSavings: number;
  monthlyContribution: number;
  targetAmount: number;
  yearsToGoal: number;
}

export interface ReportResult {
  estInvFund: number;
  invstOpt: string;
  recommendation: string;
  summary: string;
  targetGap: number;
  targetStatus: 'on-track' | 'under-target';
}

const round = (value: number) => Math.round(value * 100) / 100;

const getAnnualReturnRate = (risk: RiskLevel): number => {
  switch (risk) {
    case 'high':
      return 0.12; // Aggressive growth assumption
    case 'medium':
      return 0.08; // Balanced growth assumption
    case 'low':
    default:
      return 0.05; // Conservative growth assumption
  }
};

const estimateInvestmentFund = (
  currentSavings: number,
  monthlyContribution: number,
  annualRate: number,
  years: number
): number => {
  const months = Math.max(1, Math.round(years * 12));
  const monthlyRate = annualRate / 12;

  const savingsFuture = currentSavings * Math.pow(1 + monthlyRate, months);
  const contributionFuture = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);

  return round(savingsFuture + contributionFuture);
};

const chooseInvestmentOption = (risk: RiskLevel, yearsToGoal: number): string => {
  if (risk === 'high') {
    return yearsToGoal >= 10
      ? 'Equity-heavy growth portfolio with long-term wealth creation focus'
      : 'Growth-oriented equity portfolio with higher volatility tolerance';
  }

  if (risk === 'medium') {
    return yearsToGoal >= 10
      ? 'Balanced portfolio with mix of growth and stability'
      : 'Moderate allocation portfolio with a blend of equity and debt instruments';
  }

  return yearsToGoal >= 10
    ? 'Conservative portfolio with steady income and capital preservation'
    : 'Income-focused defensive portfolio with low volatility';
};

const buildRecommendation = (
  targetAmount: number,
  estInvFund: number,
  personalGoal: string,
  risk: RiskLevel
): string => {
  const gap = targetAmount - estInvFund;

  if (gap <= 0) {
    return `Your plan is currently on track to reach ${personalGoal}. Continue contributing regularly and review your investments every year.`;
  }

  const increaseContribution = gap > 0 ? `increase your monthly contribution or extend the timeline` : '';
  const riskMessage =
    risk === 'low'
      ? 'If your comfort allows, consider a slightly higher-risk allocation for better growth potential.'
      : 'Continue with disciplined investing and revisit your asset allocation annually.';

  return `Your current plan is under target by ₹${round(gap)}. To improve the chance of reaching ${personalGoal}, ${increaseContribution} and ${riskMessage}`;
};

export const calculateReport = (data: FinancialFormData): ReportResult => {
  const {
    currentSavings,
    monthlyContribution,
    yearsToGoal,
    targetAmount,
    investRisk,
    personalGoal
  } = data;

  const annualRate = getAnnualReturnRate(investRisk);
  const estInvFund = estimateInvestmentFund(currentSavings, monthlyContribution, annualRate, yearsToGoal);
  const invstOpt = chooseInvestmentOption(investRisk, yearsToGoal);
  const recommendation = buildRecommendation(targetAmount, estInvFund, personalGoal, investRisk);
  const gap = round(targetAmount - estInvFund);
  const targetStatus = gap <= 0 ? 'on-track' : 'under-target';

  return {
    estInvFund,
    invstOpt,
    recommendation,
    targetGap: gap,
    targetStatus,
    summary: `Assuming a ${Math.round(annualRate * 100)}% annual return, your estimated fund after ${Math.max(1, yearsToGoal)} year(s) is ₹${estInvFund}.`
  };
};

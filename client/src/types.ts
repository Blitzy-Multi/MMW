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

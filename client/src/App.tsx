import { useState } from 'react';
import axios from 'axios';
import { FinancialFormData, ReportResult, RiskLevel, EmploymentType } from './types';
import './App.css';

type FieldErrors = Partial<Record<keyof FinancialFormData, string>>;

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMIT_80C = 150000;

function validateStep(step: number, data: FinancialFormData): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 0) {
    if (!data.fullName.trim()) errors.fullName = 'Full name is required.';
    else if (!/^[a-zA-Z\s.'-]{2,}$/.test(data.fullName.trim())) errors.fullName = 'Enter a valid name.';
    if (!data.email.trim()) errors.email = 'Email is required.';
    else if (!EMAIL_RE.test(data.email.trim())) errors.email = 'Enter a valid email address.';
    const phone = data.phone.replace(/\s/g, '');
    if (!phone) errors.phone = 'Phone number is required.';
    else if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    if (!data.personalGoal.trim()) errors.personalGoal = 'Please describe your financial goal.';
    if (!data.age || data.age < 18 || data.age > 80) errors.age = 'Enter age between 18 and 80.';
  }
  if (step === 1) {
    if (!data.takeHomePerMonth || data.takeHomePerMonth <= 0)
      errors.takeHomePerMonth = 'Take-home salary is required.';
    if (!data.totalMonthlyExpenses || data.totalMonthlyExpenses <= 0)
      errors.totalMonthlyExpenses = 'Monthly expenses are required.';
    if (data.totalMonthlyExpenses > data.takeHomePerMonth)
      errors.totalMonthlyExpenses = 'Expenses cannot exceed take-home salary.';
  }
  return errors;
}

const defaultData: FinancialFormData = {
  fullName: '', email: '', phone: '', age: 0,
  employmentType: 'salaried', married: false, numKids: 0,
  personalGoal: '', investRisk: 'medium',
  grossIncomePerYear: 0, basicSalaryPerYear: 0,
  takeHomePerMonth: 0, totalMonthlyExpenses: 0, otherIncomePerYear: 0,
  houseEmiPerMonth: 0, vehicleEmiPerMonth: 0, otherEmiPerMonth: 0,
  fdMaturedThisYear: 0, dividendsThisYear: 0, mfCapitalGainsThisYear: 0,
  sgbFutureValue: 0, fdFutureValue: 0, mfUnrealizedFuture: 0,
  epfCorpus: 0, ppfCorpus: 0, npsCorpus: 0, ssyLicCorpus: 0, otherFutureCorpus: 0,
  selfPropertyValue: 0, rentalPropertyValue: 0, plotLandValue: 0,
  parentalPropertyValue: 0, jewelryValue: 0,
  lifeTermInsurancePerYear: 0, medicalInsurancePerYear: 0,
  parentsLifeInsurancePerYear: 0, parentsMedicalInsurancePerYear: 0,
  buildingInsurancePerYear: 0,
  epfPerYear: 0, vpfPerYear: 0, homeLoanPrincipalPerYear: 0, nps80ccd2PerYear: 0,
  childrenTuitionPerYear: 0, ppfPerYear: 0, elssPerYear: 0, ssyPerYear: 0,
  nps80ccd1bPerYear: 0, educationLoanInterestPerYear: 0,
  savings80ttaPerYear: 0, donationsPerYear: 0,
  stocksMfPerYear: 0,
  targetAmount: 0, yearsToGoal: 10,
};

const steps = [
  { title: 'About you',            description: 'Personal details and your primary financial goal.',         fields: ['personal'] },
  { title: 'Income & expenses',    description: 'Salary, take-home and monthly spending.',                   fields: ['income'] },
  { title: 'Loans & assets',       description: 'Liabilities, liquid funds, future corpus, and property.',   fields: ['loans'] },
  { title: 'Insurance & investments', description: 'Insurance coverage and tax-saving investments.',         fields: ['investments'] },
  { title: 'Review & submit',      description: 'Confirm your details and generate your personalised report.', fields: ['review'] },
];

const INR = (n: number) => n !== 0 ? `₹${Math.abs(n).toLocaleString('en-IN')}` : '—';

export default function App() {
  const [formData, setFormData] = useState<FinancialFormData>(defaultData);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const currentStep = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);
  const toggleTheme = () => setTheme(c => c === 'dark' ? 'light' : 'dark');

  const handleChange = (field: keyof FinancialFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  };

  const num = (field: keyof FinancialFormData) => (formData[field] as number) || '';

  const nextStep = () => {
    const errors = validateStep(step, formData);
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prevStep = () => { setFieldErrors({}); if (step > 0) setStep(step - 1); };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step < steps.length - 1) { nextStep(); return; }
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/api/submit', formData);
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
      setError('Unable to submit the form. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Live calculations
  const live80C = formData.epfPerYear + formData.vpfPerYear + formData.homeLoanPrincipalPerYear +
    formData.nps80ccd2PerYear + formData.ppfPerYear + formData.elssPerYear + formData.ssyPerYear;
  const liveVIA = formData.nps80ccd1bPerYear + formData.educationLoanInterestPerYear +
    formData.savings80ttaPerYear + formData.donationsPerYear;
  const liveInsurance = formData.lifeTermInsurancePerYear + formData.medicalInsurancePerYear +
    formData.parentsLifeInsurancePerYear + formData.parentsMedicalInsurancePerYear +
    formData.buildingInsurancePerYear;
  const liveNetFund = formData.takeHomePerMonth > 0
    ? (formData.takeHomePerMonth * 12)
      - (formData.totalMonthlyExpenses * 12)
      + formData.otherIncomePerYear
      - ((formData.houseEmiPerMonth + formData.vehicleEmiPerMonth + formData.otherEmiPerMonth) * 12)
      + formData.fdMaturedThisYear + formData.dividendsThisYear + formData.mfCapitalGainsThisYear
      - liveInsurance - live80C - liveVIA - formData.stocksMfPerYear - 100000
    : 0;
  const pct80C = Math.min(100, Math.round((live80C / LIMIT_80C) * 100));

  if (report) {
    const tierLabel: Record<string, string> = {
      immediate: 'Immediate Actions',
      medium: 'Medium Term (1–3 Years)',
      long: 'Long Term (3+ Years)',
    };
    return (
      <main className={`app-shell theme-${theme}`}>
        <div className="page-shell report-layout">
          <div className="panel report-panel">
            <div className="top-header">
              <div className="brand-banner">
                <div className="brand-icon">✦</div>
                <div className="brand-text">
                  <span className="brand-name">Multiply</span>
                  <span className="brand-sub">MY WEALTH</span>
                </div>
              </div>
              <button type="button" className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            <div className="status-badge">✓</div>
            <h1>Financial review complete</h1>
            <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.75 }}>
              The PDF report has been sent to the Multiply My Wealth team. They will connect with you shortly.
            </p>

            <div className="metrics-grid">
              <div className="metric-card metric-accent">
                <span>Investable Fund (This Year)</span>
                <strong className={report.netInvestableFundNow < 0 ? 'text-danger' : ''}>
                  {INR(report.netInvestableFundNow)}
                  {report.netInvestableFundNow < 0 && <small> deficit</small>}
                </strong>
              </div>
              <div className="metric-card">
                <span>Future Corpus</span>
                <strong>{INR(report.futureLiquidFunds)}</strong>
              </div>
              <div className="metric-card">
                <span>Immovable Assets</span>
                <strong>{INR(report.immovableAssets)}</strong>
              </div>
              <div className="metric-card">
                <span>80C Deployed / Limit</span>
                <strong style={{ color: report.total80C >= LIMIT_80C ? 'var(--accent)' : 'var(--accent-violet)' }}>
                  {INR(report.total80C)} <small>/ ₹1,50,000</small>
                </strong>
              </div>
            </div>

            <p className="report-copy">{report.recommendation}</p>

            {(['immediate', 'medium', 'long'] as const).map(tier => {
              const items = report.recommendations.filter(r => r.tier === tier);
              if (!items.length) return null;
              return (
                <div key={tier} className="rec-section">
                  <h3 className="rec-title">{tierLabel[tier]}</h3>
                  <div className="rec-list">
                    {items.map((item, i) => (
                      <div key={i} className={`rec-item rec-${item.status}`}>
                        <div className="rec-item-header">
                          <span className="rec-dot" />
                          <span className="rec-description">{item.description}</span>
                          {item.currentAmount > 0 && (
                            <span className="rec-amount">{INR(item.currentAmount)}</span>
                          )}
                        </div>
                        <div className="rec-action">{item.action}</div>
                        {item.status !== 'done' && item.suggestedAmount > 0 && (
                          <div className="rec-suggested">Suggested: {INR(item.suggestedAmount)}/yr</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="thank-you-actions" style={{ marginTop: '2rem' }}>
              <button type="button" className="secondary-button"
                onClick={() => { setReport(null); setStep(0); setFormData(defaultData); }}>
                Start new review
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={`app-shell theme-${theme}`}>
      <div className="page-shell">
        <section className="panel form-panel">
          <div className="top-header">
            <div className="brand-banner">
              <div className="brand-icon">✦</div>
              <div className="brand-text">
                <span className="brand-name">Multiply</span>
                <span className="brand-sub">MY WEALTH</span>
              </div>
            </div>
            <button type="button" className="theme-toggle" onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>

          <div className="step-header">
            <div className="step-progress-row">
              <span className="step-badge">STEP {step + 1} OF {steps.length}</span>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="step-title">{currentStep.title}</div>
            <div className="step-copy">{currentStep.description}</div>
          </div>

          <form onSubmit={handleSubmit}>

            {/* ── STEP 1: Personal ──────────────────────────────────── */}
            {currentStep.fields.includes('personal') && (<>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Full name</div>
                  <input type="text" placeholder="Rahul Sharma"
                    value={formData.fullName} onChange={e => handleChange('fullName', e.target.value)}
                    aria-invalid={!!fieldErrors.fullName} />
                  {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                </div>
                <div className="field-group">
                  <div className="field-label">Email address</div>
                  <input type="email" placeholder="rahul@example.com"
                    value={formData.email} onChange={e => handleChange('email', e.target.value)}
                    aria-invalid={!!fieldErrors.email} />
                  {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                </div>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Mobile number</div>
                  <input type="tel" placeholder="+91 98765 43210"
                    value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                    aria-invalid={!!fieldErrors.phone} />
                  {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                </div>
                <div className="field-group">
                  <div className="field-label">Age <span>18–80</span></div>
                  <input type="number" placeholder="35"
                    value={num('age')} onChange={e => handleChange('age', Number(e.target.value))}
                    min={18} max={80} aria-invalid={!!fieldErrors.age} />
                  {fieldErrors.age && <span className="field-error">{fieldErrors.age}</span>}
                </div>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Employment type</div>
                  <select value={formData.employmentType}
                    onChange={e => handleChange('employmentType', e.target.value as EmploymentType)}>
                    <option value="salaried">Salaried</option>
                    <option value="business">Business / Self-employed</option>
                  </select>
                </div>
                <div className="field-group">
                  <div className="field-label">Married?</div>
                  <select value={formData.married ? 'yes' : 'no'}
                    onChange={e => handleChange('married', e.target.value === 'yes')}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Number of children</div>
                  <input type="number" placeholder="0"
                    value={num('numKids')} onChange={e => handleChange('numKids', Number(e.target.value))}
                    min={0} max={10} />
                </div>
                <div className="field-group">
                  <div className="field-label">Risk profile</div>
                  <select value={formData.investRisk}
                    onChange={e => handleChange('investRisk', e.target.value as RiskLevel)}>
                    <option value="low">Low – Capital preservation</option>
                    <option value="medium">Medium – Balanced growth</option>
                    <option value="high">High – Aggressive growth</option>
                  </select>
                </div>
              </div>
              <div className="field-group">
                <div className="field-label">Primary financial goal</div>
                <input type="text" placeholder="Retirement planning, children's education, dream home…"
                  value={formData.personalGoal} onChange={e => handleChange('personalGoal', e.target.value)}
                  aria-invalid={!!fieldErrors.personalGoal} />
                {fieldErrors.personalGoal && <span className="field-error">{fieldErrors.personalGoal}</span>}
              </div>
            </>)}

            {/* ── STEP 2: Income & Expenses ─────────────────────────── */}
            {currentStep.fields.includes('income') && (<>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Gross income / year <span>₹</span></div>
                  <input type="number" placeholder="0"
                    value={num('grossIncomePerYear')} onChange={e => handleChange('grossIncomePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Basic salary / year <span>₹ — for NPS calc</span></div>
                  <input type="number" placeholder="0"
                    value={num('basicSalaryPerYear')} onChange={e => handleChange('basicSalaryPerYear', Number(e.target.value))} min={0} />
                </div>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Take-home salary / month <span>₹ *</span></div>
                  <input type="number" placeholder="0"
                    value={num('takeHomePerMonth')} onChange={e => handleChange('takeHomePerMonth', Number(e.target.value))}
                    min={0} aria-invalid={!!fieldErrors.takeHomePerMonth} />
                  {fieldErrors.takeHomePerMonth && <span className="field-error">{fieldErrors.takeHomePerMonth}</span>}
                </div>
                <div className="field-group">
                  <div className="field-label">Total monthly expenses <span>₹ * (rent+food+utilities+school+parents)</span></div>
                  <input type="number" placeholder="0"
                    value={num('totalMonthlyExpenses')} onChange={e => handleChange('totalMonthlyExpenses', Number(e.target.value))}
                    min={0} aria-invalid={!!fieldErrors.totalMonthlyExpenses} />
                  {fieldErrors.totalMonthlyExpenses && <span className="field-error">{fieldErrors.totalMonthlyExpenses}</span>}
                </div>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Other income / year <span>₹ rent, freelance…</span></div>
                  <input type="number" placeholder="0"
                    value={num('otherIncomePerYear')} onChange={e => handleChange('otherIncomePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Target corpus <span>₹</span></div>
                  <input type="number" placeholder="0"
                    value={num('targetAmount')} onChange={e => handleChange('targetAmount', Number(e.target.value))} min={0} />
                </div>
              </div>
            </>)}

            {/* ── STEP 3: Loans & Assets ────────────────────────────── */}
            {currentStep.fields.includes('loans') && (<>
              <div className="section-label">Loan EMIs / month</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Home loan EMI <span>₹/mo</span></div>
                  <input type="number" placeholder="0" value={num('houseEmiPerMonth')}
                    onChange={e => handleChange('houseEmiPerMonth', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Vehicle loan EMI <span>₹/mo</span></div>
                  <input type="number" placeholder="0" value={num('vehicleEmiPerMonth')}
                    onChange={e => handleChange('vehicleEmiPerMonth', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Other EMIs <span>₹/mo (education, personal…)</span></div>
                  <input type="number" placeholder="0" value={num('otherEmiPerMonth')}
                    onChange={e => handleChange('otherEmiPerMonth', Number(e.target.value))} min={0} />
                </div>
              </div>

              <div className="section-label">Liquid funds available this year</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">FD matured / interest received <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('fdMaturedThisYear')}
                    onChange={e => handleChange('fdMaturedThisYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Dividends received <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('dividendsThisYear')}
                    onChange={e => handleChange('dividendsThisYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">MF/equity capital gains realized <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('mfCapitalGainsThisYear')}
                    onChange={e => handleChange('mfCapitalGainsThisYear', Number(e.target.value))} min={0} />
                </div>
              </div>

              <div className="section-label">Future blocked funds (will be available later)</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">SGB – Sovereign Gold Bond <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('sgbFutureValue')}
                    onChange={e => handleChange('sgbFutureValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">FD – future maturity amount <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('fdFutureValue')}
                    onChange={e => handleChange('fdFutureValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">MF/equity – unrealized value <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('mfUnrealizedFuture')}
                    onChange={e => handleChange('mfUnrealizedFuture', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">EPF corpus (accumulated) <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('epfCorpus')}
                    onChange={e => handleChange('epfCorpus', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">PPF corpus (accumulated) <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('ppfCorpus')}
                    onChange={e => handleChange('ppfCorpus', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">NPS corpus (accumulated) <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('npsCorpus')}
                    onChange={e => handleChange('npsCorpus', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">SSY / LIC / ULIP / Bond / NSC corpus <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('ssyLicCorpus')}
                    onChange={e => handleChange('ssyLicCorpus', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Other future corpus <span>₹ (spouse investments etc.)</span></div>
                  <input type="number" placeholder="0" value={num('otherFutureCorpus')}
                    onChange={e => handleChange('otherFutureCorpus', Number(e.target.value))} min={0} />
                </div>
              </div>

              <div className="section-label">Immovable assets (not for reinvestment)</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Self-occupied property <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('selfPropertyValue')}
                    onChange={e => handleChange('selfPropertyValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Rental / investment property <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('rentalPropertyValue')}
                    onChange={e => handleChange('rentalPropertyValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Plot / land <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('plotLandValue')}
                    onChange={e => handleChange('plotLandValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Parental property / fund <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('parentalPropertyValue')}
                    onChange={e => handleChange('parentalPropertyValue', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Jewellery / ornaments <span>₹</span></div>
                  <input type="number" placeholder="0" value={num('jewelryValue')}
                    onChange={e => handleChange('jewelryValue', Number(e.target.value))} min={0} />
                </div>
              </div>
            </>)}

            {/* ── STEP 4: Insurance & Investments ──────────────────────── */}
            {currentStep.fields.includes('investments') && (<>
              <div className="section-label">Insurance premiums / year</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Life term insurance <span>₹/yr (80C)</span></div>
                  <input type="number" placeholder="0" value={num('lifeTermInsurancePerYear')}
                    onChange={e => handleChange('lifeTermInsurancePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Medical insurance – self/family <span>₹/yr (80D)</span></div>
                  <input type="number" placeholder="0" value={num('medicalInsurancePerYear')}
                    onChange={e => handleChange('medicalInsurancePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Life insurance for parents <span>₹/yr (80D)</span></div>
                  <input type="number" placeholder="0" value={num('parentsLifeInsurancePerYear')}
                    onChange={e => handleChange('parentsLifeInsurancePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Medical insurance for parents <span>₹/yr (80D)</span></div>
                  <input type="number" placeholder="0" value={num('parentsMedicalInsurancePerYear')}
                    onChange={e => handleChange('parentsMedicalInsurancePerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Building / property insurance <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('buildingInsurancePerYear')}
                    onChange={e => handleChange('buildingInsurancePerYear', Number(e.target.value))} min={0} />
                </div>
              </div>

              <div className="section-label">
                80C investments / year <span className="section-limit">Limit ₹1,50,000</span>
              </div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">EPF (employer deducted) <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('epfPerYear')}
                    onChange={e => handleChange('epfPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">VPF (voluntary PF) <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('vpfPerYear')}
                    onChange={e => handleChange('vpfPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">PPF <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('ppfPerYear')}
                    onChange={e => handleChange('ppfPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Sukanya Samriddhi (SSY) <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('ssyPerYear')}
                    onChange={e => handleChange('ssyPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">ELSS / tax-saving MF <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('elssPerYear')}
                    onChange={e => handleChange('elssPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Home loan principal <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('homeLoanPrincipalPerYear')}
                    onChange={e => handleChange('homeLoanPrincipalPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">Children's tuition fees <span>₹/yr (80C — already in expenses)</span></div>
                  <input type="number" placeholder="0" value={num('childrenTuitionPerYear')}
                    onChange={e => handleChange('childrenTuitionPerYear', Number(e.target.value))} min={0} />
                </div>
              </div>

              {formData.employmentType === 'salaried' && (
                <div className="field-grid">
                  <div className="field-group">
                    <div className="field-label">NPS via employer – 80CCD2 <span>₹/yr (over 80C limit)</span></div>
                    <input type="number" placeholder="0" value={num('nps80ccd2PerYear')}
                      onChange={e => handleChange('nps80ccd2PerYear', Number(e.target.value))} min={0} />
                  </div>
                </div>
              )}

              <div className="section-label">VIA deductions / year</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">NPS self – 80CCD1b <span>₹/yr (extra ₹50K)</span></div>
                  <input type="number" placeholder="0" value={num('nps80ccd1bPerYear')}
                    onChange={e => handleChange('nps80ccd1bPerYear', Number(e.target.value))} min={0} max={50000} />
                </div>
                <div className="field-group">
                  <div className="field-label">80TTA – savings a/c interest <span>₹/yr (max ₹10K)</span></div>
                  <input type="number" placeholder="0" value={num('savings80ttaPerYear')}
                    onChange={e => handleChange('savings80ttaPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">80E – education loan interest <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('educationLoanInterestPerYear')}
                    onChange={e => handleChange('educationLoanInterestPerYear', Number(e.target.value))} min={0} />
                </div>
                <div className="field-group">
                  <div className="field-label">80G – donations <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('donationsPerYear')}
                    onChange={e => handleChange('donationsPerYear', Number(e.target.value))} min={0} />
                </div>
              </div>

              <div className="section-label">Additional investments / year</div>
              <div className="field-grid">
                <div className="field-group">
                  <div className="field-label">Stocks / Mutual funds (non-80C) <span>₹/yr</span></div>
                  <input type="number" placeholder="0" value={num('stocksMfPerYear')}
                    onChange={e => handleChange('stocksMfPerYear', Number(e.target.value))} min={0} />
                </div>
              </div>
            </>)}

            {/* ── STEP 5: Review ────────────────────────────────────── */}
            {currentStep.fields.includes('review') && (
              <div className="review-card">
                <div className="review-row"><span>Name / Age</span><strong>{formData.fullName}, {formData.age} yrs</strong></div>
                <div className="review-row"><span>Employment</span><strong>{formData.employmentType}{formData.married ? ', Married' : ''}, {formData.numKids} kid(s)</strong></div>
                <div className="review-row"><span>Goal / Risk</span><strong>{formData.personalGoal} · {formData.investRisk}</strong></div>
                <div className="review-row"><span>Take-home / month</span><strong>₹{formData.takeHomePerMonth.toLocaleString('en-IN')}</strong></div>
                <div className="review-row"><span>Monthly expenses</span><strong>₹{formData.totalMonthlyExpenses.toLocaleString('en-IN')}</strong></div>
                <div className="review-row"><span>Total EMIs / month</span><strong>₹{(formData.houseEmiPerMonth + formData.vehicleEmiPerMonth + formData.otherEmiPerMonth).toLocaleString('en-IN')}</strong></div>
                <div className="review-row"><span>80C invested / yr</span><strong>₹{live80C.toLocaleString('en-IN')} / ₹1,50,000</strong></div>
                <div className="review-row"><span>VIA deductions / yr</span><strong>₹{liveVIA.toLocaleString('en-IN')}</strong></div>
                <div className="review-row"><span>Insurance / yr</span><strong>₹{liveInsurance.toLocaleString('en-IN')}</strong></div>
                <div className="review-row">
                  <span>Est. investable fund</span>
                  <strong style={{ color: liveNetFund >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                    ₹{liveNetFund.toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={prevStep}
                disabled={step === 0 || loading}>Back</button>
              <button type="submit" className="primary-button" disabled={loading}>
                {step === steps.length - 1
                  ? loading ? 'Generating…' : 'Generate report'
                  : 'Continue'}
              </button>
            </div>
          </form>
        </section>

        <aside className="summary-panel">
          <div className="summary-card">
            <div className="summary-label">Live snapshot</div>
            <p className="summary-copy">Updates as you fill the form.</p>
            <div className="summary-list">
              <div className="summary-item">
                <span>Investable fund</span>
                <strong style={{ color: liveNetFund < 0 ? 'var(--danger)' : 'var(--text)' }}>
                  {formData.takeHomePerMonth > 0 ? `₹${liveNetFund.toLocaleString('en-IN')}` : '—'}
                </strong>
              </div>
              <div className="summary-item">
                <span>80C deployed</span>
                <strong>{live80C > 0 ? `₹${live80C.toLocaleString('en-IN')} / ₹1,50,000` : '—'}</strong>
              </div>
              <div className="summary-item">
                <span>Insurance / yr</span>
                <strong>{liveInsurance > 0 ? `₹${liveInsurance.toLocaleString('en-IN')}` : '—'}</strong>
              </div>
            </div>
            {live80C > 0 && (
              <div className="deduction-bar-wrap">
                <div className="deduction-bar-header">
                  <span>80C utilisation</span><span>{pct80C}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct80C}%` }} />
                </div>
              </div>
            )}
            <div className="summary-highlight">
              <div>
                <p>Annual surplus</p>
                <strong>
                  {formData.takeHomePerMonth > 0
                    ? `₹${liveNetFund.toLocaleString('en-IN')}`
                    : '₹— / yr'}
                </strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

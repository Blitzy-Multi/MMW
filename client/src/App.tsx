import { useState } from 'react';
import axios from 'axios';
import { FinancialFormData, ReportResult, RiskLevel } from './types';
import './App.css';

type FieldErrors = Partial<Record<keyof FinancialFormData, string>>;

const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep(step: number, data: FinancialFormData): FieldErrors {
  const errors: FieldErrors = {};

  if (step === 0) {
    if (!data.fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (!/^[a-zA-Z\s.'-]{2,}$/.test(data.fullName.trim())) {
      errors.fullName = 'Enter a valid name (letters only).';
    }

    if (!data.email.trim()) {
      errors.email = 'Email is required.';
    } else if (!EMAIL_RE.test(data.email.trim())) {
      errors.email = 'Enter a valid email address.';
    }

    const phone = data.phone.replace(/\s/g, '');
    if (!phone) {
      errors.phone = 'Phone number is required.';
    } else if (!PHONE_RE.test(phone)) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }

    if (!data.personalGoal.trim()) {
      errors.personalGoal = 'Please describe your goal.';
    }
  }

  if (step === 1) {
    if (data.currentSavings < 0) {
      errors.currentSavings = 'Cannot be negative.';
    }
    if (data.monthlyContribution < 0) {
      errors.monthlyContribution = 'Cannot be negative.';
    }
    if (!data.targetAmount || data.targetAmount <= 0) {
      errors.targetAmount = 'Target amount must be greater than 0.';
    }
    if (!data.yearsToGoal || data.yearsToGoal < 1) {
      errors.yearsToGoal = 'Minimum 1 year.';
    } else if (data.yearsToGoal > 50) {
      errors.yearsToGoal = 'Maximum 50 years.';
    }
  }

  return errors;
}

const defaultData: FinancialFormData = {
  fullName: '',
  email: '',
  phone: '',
  personalGoal: '',
  investRisk: 'medium',
  currentSavings: 0,
  monthlyContribution: 0,
  targetAmount: 0,
  yearsToGoal: 5
};

const steps = [
  {
    title: 'About you',
    description: 'Tell us who you are and what your financial goal is.',
    fields: ['personal']
  },
  {
    title: 'Your finances',
    description: 'Enter your current savings and contribution details.',
    fields: ['finance']
  },
  {
    title: 'Review & submit',
    description: 'Confirm your details and generate your report.',
    fields: ['review']
  }
];

function App() {
  const [formData, setFormData] = useState<FinancialFormData>(defaultData);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const currentStep = steps[step];
  const progress = Math.round(((step + 1) / steps.length) * 100);

  const toggleTheme = () => {
    setTheme(current => (current === 'dark' ? 'light' : 'dark'));
  };

  const handleChange = (field: keyof FinancialFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const nextStep = () => {
    const errors = validateStep(step, formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setFieldErrors({});
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (step < steps.length - 1) {
      nextStep();
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/submit', formData);
      setReport(response.data.report);
    } catch (err) {
      console.error(err);
      setError('Unable to submit the form. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const summaryItems = [
    { label: 'Estimated fund', value: report ? `₹${report.estInvFund.toLocaleString()}` : '—' },
    { label: 'Investment option', value: report ? report.invstOpt : '—' },
    { label: 'Target status', value: report ? (report.targetStatus === 'on-track' ? 'On track' : 'Under target') : '—' }
  ];

  if (report) {
    return (
      <main className="app-shell">
        <div className="page-shell thank-you-layout">
          <div className="panel thank-you-card">
            <div className="status-badge">✓</div>
            <h1>Your wealth plan is on its way</h1>
            <p>We’ve received your details and will email your personalised report shortly. Our wealth team will connect with you soon.</p>

            <div className="detail-list">
              <div className="detail-card">
                <span>Estimated fund</span>
                <strong>₹{report.estInvFund.toLocaleString()}</strong>
              </div>
              <div className="detail-card">
                <span>Investment option</span>
                <strong>{report.invstOpt}</strong>
              </div>
              <div className="detail-card">
                <span>Status</span>
                <strong>{report.targetStatus === 'on-track' ? 'On track' : 'Under target'}</strong>
              </div>
            </div>

            <div className="thank-you-actions">
              <button type="button">View my report</button>
              <div className="secondary-button">Download PDF</div>
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
            <div className="brand-banner">✦ Multiply My Wealth</div>
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
          <div className="step-header">
            <div className="step-badge">STEP {step + 1} OF {steps.length}</div>
            <div className="step-title">{currentStep.title}</div>
            <div className="step-copy">{currentStep.description}</div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {currentStep.fields.includes('personal') && (
              <>
                <div className="field-grid">
                  <div className="field-group">
                    <div className="field-label">Full name</div>
                    <input
                      type="text"
                      placeholder="Rahul Sharma"
                      value={formData.fullName}
                      onChange={e => handleChange('fullName', e.target.value)}
                      aria-invalid={!!fieldErrors.fullName}
                    />
                    {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                  </div>
                  <div className="field-group">
                    <div className="field-label">Email address</div>
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      aria-invalid={!!fieldErrors.email}
                    />
                    {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                  </div>
                </div>
                <div className="field-grid">
                  <div className="field-group">
                    <div className="field-label">Mobile number</div>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      aria-invalid={!!fieldErrors.phone}
                    />
                    {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
                  </div>
                  <div className="field-group">
                    <div className="field-label">Personal goal</div>
                    <input
                      type="text"
                      placeholder="Retirement planning or dream home"
                      value={formData.personalGoal}
                      onChange={e => handleChange('personalGoal', e.target.value)}
                      aria-invalid={!!fieldErrors.personalGoal}
                    />
                    {fieldErrors.personalGoal && <span className="field-error">{fieldErrors.personalGoal}</span>}
                  </div>
                </div>
                <div className="field-group">
                  <div className="field-label">Investment risk profile</div>
                  <select
                    value={formData.investRisk}
                    onChange={e => handleChange('investRisk', e.target.value as RiskLevel)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </>
            )}

            {currentStep.fields.includes('finance') && (
              <>
                <div className="field-grid">
                  <div className="field-group">
                    <div className="field-label">Current savings <span>₹</span></div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.currentSavings || ''}
                      onChange={e => handleChange('currentSavings', Number(e.target.value))}
                      min={0}
                      aria-invalid={!!fieldErrors.currentSavings}
                    />
                    {fieldErrors.currentSavings && <span className="field-error">{fieldErrors.currentSavings}</span>}
                  </div>
                  <div className="field-group">
                    <div className="field-label">Monthly contribution <span>₹</span></div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.monthlyContribution || ''}
                      onChange={e => handleChange('monthlyContribution', Number(e.target.value))}
                      min={0}
                      aria-invalid={!!fieldErrors.monthlyContribution}
                    />
                    {fieldErrors.monthlyContribution && <span className="field-error">{fieldErrors.monthlyContribution}</span>}
                  </div>
                </div>
                <div className="field-grid">
                  <div className="field-group">
                    <div className="field-label">Target amount <span>₹</span></div>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.targetAmount || ''}
                      onChange={e => handleChange('targetAmount', Number(e.target.value))}
                      min={1}
                      aria-invalid={!!fieldErrors.targetAmount}
                    />
                    {fieldErrors.targetAmount && <span className="field-error">{fieldErrors.targetAmount}</span>}
                  </div>
                  <div className="field-group">
                    <div className="field-label">Years to goal <span>1–50</span></div>
                    <input
                      type="number"
                      placeholder="5"
                      value={formData.yearsToGoal || ''}
                      onChange={e => handleChange('yearsToGoal', Number(e.target.value))}
                      min={1}
                      max={50}
                      aria-invalid={!!fieldErrors.yearsToGoal}
                    />
                    {fieldErrors.yearsToGoal && <span className="field-error">{fieldErrors.yearsToGoal}</span>}
                  </div>
                </div>
              </>
            )}

            {currentStep.fields.includes('review') && (
              <div className="review-card">
                <div className="review-row">
                  <span>Personal goal</span>
                  <strong>{formData.personalGoal || '—'}</strong>
                </div>
                <div className="review-row">
                  <span>Risk profile</span>
                  <strong>{formData.investRisk}</strong>
                </div>
                <div className="review-row">
                  <span>Current savings</span>
                  <strong>₹{formData.currentSavings.toLocaleString()}</strong>
                </div>
                <div className="review-row">
                  <span>Monthly contribution</span>
                  <strong>₹{formData.monthlyContribution.toLocaleString()}</strong>
                </div>
                <div className="review-row">
                  <span>Target amount</span>
                  <strong>₹{formData.targetAmount.toLocaleString()}</strong>
                </div>
                <div className="review-row">
                  <span>Years to goal</span>
                  <strong>{formData.yearsToGoal}</strong>
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={prevStep} disabled={step === 0 || loading}>
                Back
              </button>
              <button type="submit" className="primary-button" disabled={loading}>
                {step === steps.length - 1 ? loading ? 'Submitting...' : 'Generate report' : 'Continue'}
              </button>
            </div>
          </form>
        </section>

        <aside className="summary-panel">
          <div className="summary-card">
            <div className="summary-label">Monthly snapshot</div>
            <p className="summary-copy">The plan updates as you complete the form.</p>
            <div className="summary-list">
              {summaryItems.map(item => (
                <div key={item.label} className="summary-item">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="summary-highlight">
              <div>
                <p>Investable surplus</p>
                <strong>₹40,000 /mo</strong>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default App;

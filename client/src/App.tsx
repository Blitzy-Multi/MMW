import { useState } from 'react';
import axios from 'axios';
import { FinancialFormData, ReportResult, RiskLevel } from './types';
import './App.css';

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

function App() {
  const [formData, setFormData] = useState<FinancialFormData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');

  const handleChange = (field: keyof FinancialFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/submit', formData);
      setReport(response.data.report);
      setFormData(defaultData);
    } catch (err) {
      console.error(err);
      setError('Unable to submit the form. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (report) {
    return (
      <main className="app-shell">
        <section className="thank-you-card">
          <h1>Thank you!</h1>
          <p>Your information has been received, and our team will get back to you soon.</p>
          <div className="report-block">
            <h2>Report summary</h2>
            <p>{report.summary}</p>
            <p><strong>Investment option:</strong> {report.invstOpt}</p>
            <p><strong>Recommendation:</strong> {report.recommendation}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="form-card">
        <h1>Financial Planning Submission</h1>
        <p>Enter your details and we will calculate a preliminary investment report.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              type="text"
              value={formData.fullName}
              onChange={e => handleChange('fullName', e.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              value={formData.email}
              onChange={e => handleChange('email', e.target.value)}
              required
            />
          </label>

          <label>
            Phone
            <input
              type="tel"
              value={formData.phone}
              onChange={e => handleChange('phone', e.target.value)}
              required
            />
          </label>

          <label>
            Personal goal
            <input
              type="text"
              value={formData.personalGoal}
              onChange={e => handleChange('personalGoal', e.target.value)}
              required
            />
          </label>

          <label>
            Investment risk profile
            <select
              value={formData.investRisk}
              onChange={e => handleChange('investRisk', e.target.value as RiskLevel)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label>
            Current savings amount
            <input
              type="number"
              value={formData.currentSavings}
              onChange={e => handleChange('currentSavings', Number(e.target.value))}
              min={0}
              required
            />
          </label>

          <label>
            Monthly contribution
            <input
              type="number"
              value={formData.monthlyContribution}
              onChange={e => handleChange('monthlyContribution', Number(e.target.value))}
              min={0}
              required
            />
          </label>

          <label>
            Target amount
            <input
              type="number"
              value={formData.targetAmount}
              onChange={e => handleChange('targetAmount', Number(e.target.value))}
              min={0}
              required
            />
          </label>

          <label>
            Years to goal
            <input
              type="number"
              value={formData.yearsToGoal}
              onChange={e => handleChange('yearsToGoal', Number(e.target.value))}
              min={1}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;

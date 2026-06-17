import nodemailer from 'nodemailer';
import { FinancialFormData, ReportResult } from './formulas';

const getTransporter = () => {
  const service = process.env.EMAIL_SERVICE;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!service || !user || !pass) {
    throw new Error('Email configuration is missing. Set EMAIL_SERVICE, EMAIL_USER, and EMAIL_PASS.');
  }

  return nodemailer.createTransport({
    service,
    auth: {
      user,
      pass
    }
  });
};

const buildMessage = (formData: FinancialFormData, report: ReportResult) => {
  return {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: `New finance form submission from ${formData.fullName}`,
    text: `New financial planning submission:\n\nName: ${formData.fullName}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nGoal: ${formData.personalGoal}\nRisk profile: ${formData.investRisk}\nCurrent savings: ₹${formData.currentSavings}\nMonthly contribution: ₹${formData.monthlyContribution}\nTarget amount: ₹${formData.targetAmount}\nYears to goal: ${formData.yearsToGoal}\n\nEstimated fund: ₹${report.estInvFund}\nInvestment option: ${report.invstOpt}\nRecommendation: ${report.recommendation}\nSummary: ${report.summary}\n`,
    html: `<h2>New finance form submission</h2>
      <p><strong>Name:</strong> ${formData.fullName}</p>
      <p><strong>Email:</strong> ${formData.email}</p>
      <p><strong>Phone:</strong> ${formData.phone}</p>
      <p><strong>Goal:</strong> ${formData.personalGoal}</p>
      <p><strong>Risk profile:</strong> ${formData.investRisk}</p>
      <p><strong>Current savings:</strong> ₹${formData.currentSavings}</p>
      <p><strong>Monthly contribution:</strong> ₹${formData.monthlyContribution}</p>
      <p><strong>Target amount:</strong> ₹${formData.targetAmount}</p>
      <p><strong>Years to goal:</strong> ${formData.yearsToGoal}</p>
      <hr />
      <p><strong>Estimated investment fund:</strong> ₹${report.estInvFund}</p>
      <p><strong>Investment option:</strong> ${report.invstOpt}</p>
      <p><strong>Recommendation:</strong> ${report.recommendation}</p>
      <p><strong>Summary:</strong> ${report.summary}</p>`
  };
};

export const sendReportEmail = async (formData: FinancialFormData, report: ReportResult) => {
  const transporter = getTransporter();
  const message = buildMessage(formData, report);

  await transporter.sendMail(message);
};

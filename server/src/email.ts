import nodemailer from 'nodemailer';
import { FinancialFormData, ReportResult } from './formulas';
import { generateReportPdf } from './generatePdf';

const REPORT_RECIPIENT = 'mmwforfinance@gmail.com';

const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error('Email configuration missing. Set EMAIL_USER and EMAIL_PASS in server/.env');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
};

const INR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const recRow = (r: { tier: string; description: string; currentAmount: number; action: string; status: string; suggestedAmount: number }) => {
  const dotColor = r.status === 'done' ? '#10b6a0' : r.status === 'gap' ? '#7c3aed' : '#e5484d';
  return `<tr style="border-bottom:1px solid #f0f0f0">
    <td style="padding:6px 8px;color:#6b7280;font-size:12px;text-transform:capitalize">${r.tier}</td>
    <td style="padding:6px 8px;font-size:12px">
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};margin-right:6px;vertical-align:middle"></span>
      <strong>${r.description}</strong>
    </td>
    <td style="padding:6px 8px;font-size:12px;text-align:right;white-space:nowrap">${r.currentAmount > 0 ? INR(r.currentAmount) : '—'}</td>
    <td style="padding:6px 8px;font-size:12px;color:#6b7280">${r.action}${r.status !== 'done' && r.suggestedAmount > 0 ? ` <span style="color:#10b6a0;font-weight:600">Suggested: ${INR(r.suggestedAmount)}/yr</span>` : ''}</td>
  </tr>`;
};

export const sendReportEmail = async (formData: FinancialFormData, report: ReportResult) => {
  const transporter = getTransporter();

  // Generate PDF
  const pdfBuffer = await generateReportPdf(formData, report);
  const pdfName = `MMW_Report_${formData.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f5f7fa;color:#15181e">
  <div style="max-width:700px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#10b6a0;padding:28px 36px">
      <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.02em">Multiply My Wealth</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:4px">Finance Review Report · ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>

    <div style="padding:28px 36px">

      <!-- Client info -->
      <h2 style="color:#10b6a0;font-size:15px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em">Client Profile</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px;width:200px">Name</td><td style="font-size:13px;font-weight:700">${formData.fullName}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Email / Phone</td><td style="font-size:13px">${formData.email} · ${formData.phone}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Age / Employment</td><td style="font-size:13px">${formData.age} yrs, ${formData.employmentType}${formData.married ? ', Married' : ''}, ${formData.numKids} kid(s)</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Financial Goal</td><td style="font-size:13px">${formData.personalGoal}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Risk Profile</td><td style="font-size:13px;text-transform:capitalize">${formData.investRisk}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Gross Income / Year</td><td style="font-size:13px">${INR(formData.grossIncomePerYear)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Take-home / Month</td><td style="font-size:13px">${INR(formData.takeHomePerMonth)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Monthly Expenses</td><td style="font-size:13px">${INR(formData.totalMonthlyExpenses)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;font-size:13px">Total EMIs / Month</td><td style="font-size:13px">${INR(formData.houseEmiPerMonth + formData.vehicleEmiPerMonth + formData.otherEmiPerMonth)}</td></tr>
      </table>

      <!-- Key metrics -->
      <h2 style="color:#10b6a0;font-size:15px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em">Key Financial Metrics</h2>
      <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;margin-bottom:24px">
        <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">Net Investable Fund (This Year)</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:800;text-align:right;color:${report.netInvestableFundNow < 0 ? '#e5484d' : '#10b6a0'}">${INR(report.netInvestableFundNow)}</td></tr>
        <tr style="background:#f0fdf9"><td style="padding:10px 16px;color:#6b7280;font-size:13px">Future Corpus (Blocked Funds)</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right">${INR(report.futureLiquidFunds)}</td></tr>
        <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">Immovable Assets</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right">${INR(report.immovableAssets)}</td></tr>
        <tr style="background:#f0fdf9"><td style="padding:10px 16px;color:#6b7280;font-size:13px">Total 80C Deployed / Limit</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right;color:${report.total80C >= 150000 ? '#10b6a0' : '#7c3aed'}">${INR(report.total80C)} / ₹1,50,000</td></tr>
        <tr><td style="padding:10px 16px;color:#6b7280;font-size:13px">VIA Deductions</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right">${INR(report.totalVIA)}</td></tr>
        <tr style="background:#f0fdf9"><td style="padding:10px 16px;color:#6b7280;font-size:13px">Insurance Premiums / Year</td>
            <td style="padding:10px 16px;font-size:14px;font-weight:700;text-align:right">${INR(report.totalInsurance)}</td></tr>
      </table>

      <!-- Recommendation summary -->
      <div style="background:#f0fdf9;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-bottom:24px;font-size:13px;line-height:1.6">
        ${report.recommendation}
      </div>

      <!-- Action plan -->
      <h2 style="color:#10b6a0;font-size:15px;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.06em">Action Plan</h2>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:12px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:8px 8px;text-align:left;color:#6b7280;font-weight:600;white-space:nowrap">Tier</th>
              <th style="padding:8px 8px;text-align:left;color:#6b7280;font-weight:600">Category</th>
              <th style="padding:8px 8px;text-align:right;color:#6b7280;font-weight:600;white-space:nowrap">Amount</th>
              <th style="padding:8px 8px;text-align:left;color:#6b7280;font-weight:600">Action / Recommendation</th>
            </tr>
          </thead>
          <tbody>
            ${report.recommendations.map(recRow).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e5e7eb;text-align:center;font-size:11px;color:#9ca3af">
      This report is for discussion purposes only and does not constitute financial advice. · Multiply My Wealth
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Multiply My Wealth" <${process.env.EMAIL_USER}>`,
    to: REPORT_RECIPIENT,
    subject: `Financial Investment report for ${formData.fullName}`,
    html,
    attachments: [
      {
        filename: pdfName,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  });
  console.log(`Email sent: Finance Review for ${formData.fullName} → ${REPORT_RECIPIENT}`);
};

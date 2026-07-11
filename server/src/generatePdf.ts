import PDFDocument from 'pdfkit';
import { FinancialFormData, ReportResult } from './formulas';

const INR = (n: number) => `Rs.${n.toLocaleString('en-IN')}`;
const TEAL = '#10b6a0';
const DARK = '#15181e';
const GREY = '#6b7280';
const RED = '#e5484d';
const PURPLE = '#7c3aed';

export function generateReportPdf(formData: FinancialFormData, report: ReportResult): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width - 96; // usable width

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 72).fill(TEAL);
    doc.fillColor('#ffffff')
      .fontSize(20).font('Helvetica-Bold')
      .text('Multiply My Wealth', 48, 20);
    doc.fontSize(10).font('Helvetica')
      .text('Finance Review Report  —  Building Financial Discipline Through Real Life Experience', 48, 46);

    doc.fillColor(DARK).moveDown(2);

    // ── Client info ──────────────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor(TEAL)
      .text('Client Profile', 48, doc.y);
    doc.moveTo(48, doc.y + 2).lineTo(48 + W, doc.y + 2).strokeColor(TEAL).lineWidth(1).stroke();
    doc.moveDown(0.5);

    const infoRows = [
      ['Name', formData.fullName],
      ['Age / Employment', `${formData.age} yrs, ${formData.employmentType}${formData.married ? ', Married' : ''}`],
      ['Financial Goal', formData.personalGoal],
      ['Risk Profile', formData.investRisk.charAt(0).toUpperCase() + formData.investRisk.slice(1)],
      ['Gross Income / Year', INR(formData.grossIncomePerYear)],
      ['Take-home / Month', INR(formData.takeHomePerMonth)],
      ['Monthly Expenses', INR(formData.totalMonthlyExpenses)],
    ];

    doc.fontSize(9).font('Helvetica');
    infoRows.forEach(([label, value]) => {
      doc.fillColor(GREY).text(label, 48, doc.y, { continued: true, width: 180 });
      doc.fillColor(DARK).text(value, { align: 'left' });
    });

    doc.moveDown(1);

    // ── Key metrics ──────────────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor(TEAL).text('Key Financial Metrics');
    doc.moveTo(48, doc.y + 2).lineTo(48 + W, doc.y + 2).strokeColor(TEAL).lineWidth(1).stroke();
    doc.moveDown(0.5);

    const metricColor = report.netInvestableFundNow < 0 ? RED : TEAL;
    const metrics = [
      ['Net Investable Fund (This Year)', INR(report.netInvestableFundNow), metricColor],
      ['Future Corpus (Blocked Funds)', INR(report.futureLiquidFunds), DARK],
      ['Immovable Assets', INR(report.immovableAssets), DARK],
      ['Total 80C Deployed / Limit', `${INR(report.total80C)} / Rs.1,50,000`, report.total80C >= 150000 ? TEAL : PURPLE],
      ['Total VIA Deductions', INR(report.totalVIA), DARK],
      ['Total Insurance Premiums / Year', INR(report.totalInsurance), DARK],
    ];

    metrics.forEach(([label, value, color]) => {
      doc.fontSize(9).font('Helvetica').fillColor(GREY)
        .text(label, 48, doc.y, { continued: true, width: 260 });
      doc.font('Helvetica-Bold').fillColor(color as string).text(value);
    });

    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor(DARK)
      .text(report.recommendation, 48, doc.y, { width: W });
    doc.moveDown(1);

    // ── Recommendations ──────────────────────────────────────────────────────
    const tierConfig: Record<string, { label: string; color: string }> = {
      immediate: { label: 'Immediate Actions (within 6 months to 1 year)', color: RED },
      medium:    { label: 'Medium Term Actions (1 to 3 years)',              color: PURPLE },
      long:      { label: 'Long Term Actions (3 years and beyond)',          color: TEAL },
    };

    const statusDot: Record<string, string> = { done: TEAL, gap: PURPLE, new: RED };

    (['immediate', 'medium', 'long'] as const).forEach(tier => {
      const items = report.recommendations.filter(r => r.tier === tier);
      if (!items.length) return;

      // Check page space
      if (doc.y > doc.page.height - 160) doc.addPage();

      const cfg = tierConfig[tier];
      doc.fontSize(12).font('Helvetica-Bold').fillColor(cfg.color).text(cfg.label);
      doc.moveTo(48, doc.y + 2).lineTo(48 + W, doc.y + 2).strokeColor(cfg.color).lineWidth(0.5).stroke();
      doc.moveDown(0.4);

      items.forEach(item => {
        if (doc.y > doc.page.height - 120) doc.addPage();

        const dotColor = statusDot[item.status] || TEAL;
        // dot
        doc.circle(55, doc.y + 5, 3).fill(dotColor);

        // description + amount
        doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
          .text(item.description, 64, doc.y, { continued: item.currentAmount > 0, width: W - 80 });
        if (item.currentAmount > 0) {
          doc.font('Helvetica').fillColor(GREY).text(`  ${INR(item.currentAmount)}`);
        } else {
          doc.text('');
        }

        // action
        doc.fontSize(8).font('Helvetica').fillColor(GREY)
          .text(item.action, 64, doc.y, { width: W - 16 });

        // suggested amount
        if (item.status !== 'done' && item.suggestedAmount > 0) {
          doc.fontSize(8).font('Helvetica-Bold').fillColor(cfg.color)
            .text(`Suggested: ${INR(item.suggestedAmount)}/yr`, 64, doc.y);
        }

        doc.moveDown(0.35);
      });

      doc.moveDown(0.5);
    });

    // ── Footer ───────────────────────────────────────────────────────────────
    const footerY = doc.page.height - 40;
    doc.fontSize(7).font('Helvetica').fillColor(GREY)
      .text(
        `Generated by Multiply My Wealth  •  ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}  •  This report is for discussion purposes only and does not constitute financial advice.`,
        48, footerY, { width: W, align: 'center' }
      );

    doc.end();
  });
}

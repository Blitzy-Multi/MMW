import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { calculateReport, FinancialFormData, ReportResult } from './formulas';
import { sendReportEmail } from './email';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.post('/api/submit', async (req, res) => {
  try {
    const formData = req.body as FinancialFormData;
    const report = calculateReport(formData);

    // Respond immediately — email is best-effort and must not block the user
    res.status(200).json({
      status: 'success',
      report,
      message: 'Form processed successfully.'
    });

    sendReportEmail(formData, report).catch((err) => {
      console.error('Email sending failed (non-fatal):', err);
    });
  } catch (error: unknown) {
    console.error('Submit error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Unable to process the form. Please try again later.'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../client/dist'));
  app.get('*', (_req, res) => {
    res.sendFile('index.html', { root: '../client/dist' });
  });
}

if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Finance backend listening on http://localhost:${port}`);
  });
}

export default app;

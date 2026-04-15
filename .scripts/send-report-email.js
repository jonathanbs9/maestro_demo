import 'dotenv/config';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const REPORT_DIR = path.join(process.cwd(), 'test-report');

// Format: DD-MM-YYYY_HH:MM
const now = new Date();
const timestamp =
  [
    String(now.getDate()).padStart(2, '0'),
    String(now.getMonth() + 1).padStart(2, '0'),
    now.getFullYear(),
  ].join('-') +
  '_' +
  [String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0')].join(':');

// Find the archive file
const files = fs.readdirSync(REPORT_DIR).filter(f => f.endsWith('.zip'));
if (!files.length) {
  console.error('❌ No archive found in test-report/');
  process.exit(1);
}
const archivePath = path.join(REPORT_DIR, files[0]);

const RECIPIENTS = [process.env.MANAGER_EMAIL, process.env.LEAD_EMAIL];

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

for (const recipient of RECIPIENTS) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `Your Maestro Test Report Is Ready ${timestamp}`,
      text: 'Please find the test report archive attached.',
      attachments: [{ path: archivePath }],
    });
    console.log(`✅ Email sent to ${recipient}`);
  } catch (err) {
    console.error(`❌ Failed to send to ${recipient}:`, err.message);
  }
}
console.log(`📎 Attached: ${path.basename(archivePath)}`);

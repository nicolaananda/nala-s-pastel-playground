import pg from 'pg';
import nodemailer from 'nodemailer';
import { enqueueMemberReminders, deliverMemberReminders } from '../server/member-reminders.js';

const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) throw Error(`Missing runtime configuration: ${missing.join(', ')}`);
const dryRun = process.argv.includes('--dry-run');
const unknown = process.argv.slice(2).filter(arg => arg !== '--dry-run');
if (unknown.length) throw Error(`Unknown argument: ${unknown.join(', ')}`);
const pool = new pg.Pool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false });
try {
  if (dryRun) {
    const due = await pool.query("SELECT count(*)::int AS count FROM member_accounts WHERE renewal_emails_enabled AND suspended_at IS NULL AND membership_expires_at BETWEEN now()-interval '1 day' AND now()+interval '4 days'");
    const queued = await pool.query("SELECT count(*)::int AS count FROM member_reminder_outbox WHERE status IN ('pending','sending')");
    console.log(JSON.stringify({ dryRun: true, due: due.rows[0].count, queued: queued.rows[0].count }));
  } else {
    const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    if (process.env.SMTP_USER && !pass) throw Error('Missing runtime configuration: SMTP_PASS (or SMTP_PASSWORD alias)');
    const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === 'true', auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass } : undefined });
    const sendMail = ({ to, reminderKey, expiresAt }) => transport.sendMail({ from: process.env.SMTP_FROM, to, subject: 'Pengingat masa aktif member Nala', text: `Masa aktif member Nala ${reminderKey === 'expired' ? 'telah berakhir' : 'akan berakhir'} pada ${new Date(expiresAt).toISOString()}. Perpanjang melalui ${(process.env.MEMBER_PORTAL_URL || 'https://member.artstudionala.com').replace(/\/$/, '')}/portal.` });
    const enqueued = await enqueueMemberReminders(pool);
    const delivered = await deliverMemberReminders(pool, sendMail);
    console.log(JSON.stringify({ enqueued, delivered }));
  }
} finally {
  await pool.end();
}

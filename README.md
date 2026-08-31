# JobLedger

Contractor job-costing and customer billing, local only. This is a new project. It is not FieldCore and it is not PunchClock.

No production deploy, paid OCR, or live mailbox OAuth until authorized.

## Run locally

You need Node.js 20+ and Docker.

```bash
git clone https://github.com/mjacquot82-svg/jobledger.git
cd jobledger
git checkout milestone-1
cp .env.example .env
npm install
npm run db:up
npm run db:push
npm run db:seed
npm run dev
```

If you already seeded earlier, run `npm install` and `npm run db:push` again so new tables exist. Seed will not overwrite existing demo data.

Open [http://localhost:3000](http://localhost:3000).

Demo login:

- Email: `demo@jobledger.local`
- Password: `DemoPass123!`

Change `BETTER_AUTH_SECRET` in `.env` to any long random string before sharing the machine.

## What works now

- Sign in, jobs, customers, dashboard
- Upload supplier PDFs. Job tag in the file name, email subject, or PDF text auto-matches (exact one tag only; two tags go to Needs review; no silent guess)
- Duplicate detection by file hash, supplier invoice number, and email message id
- Manual job costs on the job screen
- Bill customer from job costs (draft → issued → paid). Nothing is emailed
- Optional markup % in Settings
- Reports: costs vs billed per job
- Provider-neutral inbound webhook for forwarded invoice mail (local proof)
- Settings: unique forwarding address, Connect Email shown as coming soon

Seed includes **Smith Garage** (`SMITH-001`) for John Smith and a Home Depot supplier. Try `fixtures/SMITH-001-home-depot.txt` printed to PDF, or any PDF named with `SMITH-001`.

## Prove forwarding locally

The webhook is what Postmark/SES/CloudMailin would call later. Same pipeline as upload.

1. Sign in, open Settings, copy the Forward invoices address.
2. Put `INBOUND_WEBHOOK_SECRET=dev-inbound-secret` in `.env`.
3. With the app running:

```bash
curl -X POST http://localhost:3000/api/inbound/email \
  -H "Authorization: Bearer dev-inbound-secret" \
  -F "to=PASTE_INBOUND_ADDRESS_HERE" \
  -F "from=supplier@example.com" \
  -F "subject=Invoice SMITH-001" \
  -F "file=@./your-invoice.pdf"
```

A job tag in the subject, file name, or PDF text matches. No tag, or two tags, goes to Needs review.

Connect Email (Gmail / Outlook / Hotmail / Microsoft 365, platform-owned OAuth) is not live yet.

## What is still off until you say so

- Live Connect Email OAuth
- A real inbound domain / MX (forwarding from a real mailbox)
- Paid OCR (needed for photo attachments)
- Production hosting
- PunchClock labour sync

## Tests

```bash
npm test
```

## Stack

Next.js App Router, TypeScript, Postgres, Drizzle, Better Auth, Tailwind. Money is stored as integer cents. Every row is scoped by `business_id`. Canadian English (`labour`), CAD, America/Toronto.

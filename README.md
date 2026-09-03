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
- Job name is required. Job number/tag is optional (`104`, `SMITH-001`, or blank). New-job form suggests the next unused number starting at 101
- Upload supplier PDFs. A job tag or number in the file name, email subject, or PDF text auto-matches (exact one tag only; two tags go to Needs review; no silent guess). Numeric tags ignore dollar amounts like `$104.00`
- Duplicate detection by file hash, supplier invoice number, and email message id
- Manual job costs on the job screen
- Bill customer from job costs (draft → issued → paid). Nothing is emailed
- Optional markup % in Settings
- Reports: costs vs billed per job
- CloudMailin Multipart–Normalized inbound webhook for forwarded invoice mail
- Settings: unique forwarding address, Connect Email shown as coming soon

Seed includes **Smith Garage** (`SMITH-001`) for John Smith and a Home Depot supplier. Try `fixtures/SMITH-001-home-depot.txt` printed to PDF, or any PDF named with `SMITH-001`.

## CloudMailin forwarding

CloudMailin posts Multipart–Normalized messages to `/api/inbound/email`. The
target must use HTTPS and an Authorization header generated from the same Basic
Authentication username/password held in `CLOUDMAILIN_BASIC_USERNAME` and
`CLOUDMAILIN_BASIC_PASSWORD`.

For Railway staging:

1. Mount a persistent volume at `/data/invoices` and set
   `INVOICE_STORAGE_ROOT=/data/invoices`.
2. Set `STAGING_INBOUND_ADDRESS` to the CloudMailin receiving address.
3. Set both CloudMailin Basic Authentication variables only in Railway.
4. Set CloudMailin's HTTPS target to the Railway URL plus `/api/inbound/email`.

The free-plan limit is 512 KB for the entire message, including the attachment
and email body. Keep test PDFs comfortably smaller. Only text-based PDFs are
processed; paid OCR remains disabled.

A job tag or number in the subject, file name, or PDF text matches. No tag, or two tags, goes to Needs review. Jobs with no tag stay unmatched until you assign them.

Connect Email (Gmail / Outlook / Hotmail / Microsoft 365, platform-owned OAuth) is not live yet.

## What is still off until you say so

- Live Connect Email OAuth
- Paid CloudMailin capacity above the free staging limit
- Paid OCR (needed for photo attachments)
- Production hosting
- PunchClock labour sync

## Tests

```bash
npm test
```

## Stack

Next.js App Router, TypeScript, Postgres, Drizzle, Better Auth, Tailwind. Money is stored as integer cents. Every row is scoped by `business_id`. Canadian English (`labour`), CAD, America/Toronto.

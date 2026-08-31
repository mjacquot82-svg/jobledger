# JobLedger

Contractor job-costing and customer billing, local only. This is a new project. It is not FieldCore and it is not PunchClock.

No production deploy, paid OCR, or real mailbox until authorized.

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

If you already seeded Milestone 1, run `npm install` and `npm run db:push` again so invoice and bill tables exist. Seed will not overwrite existing demo data.

Open [http://localhost:3000](http://localhost:3000).

Demo login:

- Email: `demo@jobledger.local`
- Password: `DemoPass123!`

Change `BETTER_AUTH_SECRET` in `.env` to any long random string before sharing the machine.

## What works now

- Sign in, jobs, customers, dashboard
- Upload supplier PDFs. Job tag in the file name or PDF text auto-matches (exact one tag only; two tags go to Needs review; no silent guess)
- Duplicate detection by file hash and by supplier invoice number
- Manual job costs on the job screen
- Bill customer from job costs (draft → issued → paid). Nothing is emailed
- Optional markup % in Settings
- Reports: costs vs billed per job
- Settings shows a unique inbound address stub and local-PDF OCR only

Seed includes **Smith Garage** (`SMITH-001`) for John Smith and a Home Depot supplier. Try `fixtures/SMITH-001-home-depot.txt` printed to PDF, or any PDF named with `SMITH-001`.

## What is still off until you say so

- Gmail / Microsoft 365 inbox ingest
- Paid OCR
- Production hosting
- PunchClock labour sync

## Tests

```bash
npm test
```

## Stack

Next.js App Router, TypeScript, Postgres, Drizzle, Better Auth, Tailwind. Money is stored as integer cents. Every row is scoped by `business_id`. Canadian English (`labour`), CAD, America/Toronto.

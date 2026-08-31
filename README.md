# JobLedger

Contractor job-costing app. Milestone 1 is a seeded local UI: sign in, jobs, customers, dashboard. No email ingest, OCR, invoices, or production deploy yet.

This is a new project. It is not FieldCore and it is not PunchClock.

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

Open [http://localhost:3000](http://localhost:3000).

Demo login:

- Email: `demo@jobledger.local`
- Password: `DemoPass123!`

Change `BETTER_AUTH_SECRET` in `.env` to any long random string before sharing the machine.

## What you should see

- Dashboard for **Jacquot Demo Contracting** with Needs review at 0 and two active jobs
- **Smith Garage** (`SMITH-001`) for John Smith at 123 Example Road, with cost categories at $0.00
- Wilson Kitchen and Chen Deck as extra seed jobs
- Jobs and customers you can add and edit
- Settings with CAD and America/Toronto

## Tests

```bash
npm test
```

## Stack

Next.js App Router, TypeScript, Postgres, Drizzle, Better Auth, Tailwind. Money is stored as integer cents. Every row is scoped by `business_id`.

import Link from "next/link";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customerInvoices, jobCosts, jobs } from "@/db/schema";
import { formatCad } from "@/lib/money";
import { requireBusinessId } from "@/lib/queries";
import { requireSession } from "@/lib/session";

async function jobProfitability(businessId: string) {
  const id = requireBusinessId(businessId);
  const jobRows = await db
    .select({
      id: jobs.id,
      name: jobs.name,
      jobTag: jobs.jobTag,
      status: jobs.status,
    })
    .from(jobs)
    .where(eq(jobs.businessId, id));

  const costRows = await db
    .select({
      jobId: jobCosts.jobId,
      totalCents: sql<number>`coalesce(sum(${jobCosts.amountCents}), 0)`,
    })
    .from(jobCosts)
    .where(eq(jobCosts.businessId, id))
    .groupBy(jobCosts.jobId);

  const billedRows = await db
    .select({
      jobId: customerInvoices.jobId,
      totalCents: sql<number>`coalesce(sum(${customerInvoices.totalCents}), 0)`,
    })
    .from(customerInvoices)
    .where(
      and(
        eq(customerInvoices.businessId, id),
        inArray(customerInvoices.status, ["issued", "paid"]),
      ),
    )
    .groupBy(customerInvoices.jobId);

  const costs = new Map(
    costRows.map((row) => [row.jobId, Number(row.totalCents)]),
  );
  const billed = new Map(
    billedRows.map((row) => [row.jobId, Number(row.totalCents)]),
  );

  return jobRows.map((job) => {
    const costCents = costs.get(job.id) ?? 0;
    const billedCents = billed.get(job.id) ?? 0;
    return {
      ...job,
      costCents,
      billedCents,
      marginCents: billedCents - costCents,
    };
  });
}

export default async function ReportsPage() {
  const session = await requireSession();
  const rows = await jobProfitability(session.user.businessId);
  const costTotal = rows.reduce((sum, row) => sum + row.costCents, 0);
  const billedTotal = rows.reduce((sum, row) => sum + row.billedCents, 0);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-stone-600">
          Costs vs issued or paid customer bills.
        </p>
      </div>
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Job costs</p>
          <p className="mt-2 text-2xl font-semibold">{formatCad(costTotal)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Billed</p>
          <p className="mt-2 text-2xl font-semibold">{formatCad(billedTotal)}</p>
        </div>
      </section>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {rows.map((row) => (
          <li key={row.id}>
            <Link className="block px-4 py-3" href={`/jobs/${row.id}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{row.name}</p>
                <p className="tabular-nums text-sm">
                  {formatCad(row.marginCents)}
                </p>
              </div>
              <p className="text-sm text-stone-500">
                {row.jobTag} · costs {formatCad(row.costCents)} · billed{" "}
                {formatCad(row.billedCents)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

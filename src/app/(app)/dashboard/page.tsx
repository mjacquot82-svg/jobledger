import Link from "next/link";
import { listBills } from "@/lib/billing";
import {
  countActiveJobs,
  countNeedsReview,
  getBusiness,
  listInvoices,
  listJobs,
} from "@/lib/queries";
import { formatCad } from "@/lib/money";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const businessId = session.user.businessId;
  const [business, activeCount, needsReview, jobs, invoices, bills] =
    await Promise.all([
      getBusiness(businessId),
      countActiveJobs(businessId),
      countNeedsReview(businessId),
      listJobs(businessId),
      listInvoices(businessId),
      listBills(businessId),
    ]);

  const recentJobs = jobs.slice(0, 5);
  const reviewQueue = invoices
    .filter((invoice) =>
      ["needs_review", "unmatched", "duplicate", "failed"].includes(
        invoice.status,
      ),
    )
    .slice(0, 5);
  const unpaid = bills.filter((bill) => bill.status === "issued").length;

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">Signed in as {session.user.email}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {business?.name ?? "JobLedger"}
        </h1>
      </div>
      <section className="grid grid-cols-2 gap-3">
        <Link
          href="/invoices"
          className="rounded-xl border border-stone-200 bg-white p-4"
        >
          <p className="text-sm text-stone-500">Needs review</p>
          <p className="mt-2 text-3xl font-semibold">{needsReview}</p>
        </Link>
        <Link href="/jobs" className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Active jobs</p>
          <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
        </Link>
        <Link href="/bills" className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Issued bills</p>
          <p className="mt-2 text-3xl font-semibold">{unpaid}</p>
        </Link>
        <Link
          href="/reports"
          className="rounded-xl border border-stone-200 bg-white p-4"
        >
          <p className="text-sm text-stone-500">Reports</p>
          <p className="mt-2 text-lg font-semibold">Costs vs billed</p>
        </Link>
      </section>
      {reviewQueue.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Review queue</h2>
            <Link className="text-sm text-amber-800" href="/invoices">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {reviewQueue.map((invoice) => (
              <li key={invoice.id}>
                <Link className="block px-4 py-3" href={`/invoices/${invoice.id}`}>
                  <p className="font-medium">{invoice.originalFilename}</p>
                  <p className="text-sm text-stone-500">
                    {invoice.matchReason ?? invoice.status.replaceAll("_", " ")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {bills.length > 0 ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium">Recent bills</h2>
            <Link className="text-sm text-amber-800" href="/bills">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {bills.slice(0, 5).map((bill) => (
              <li key={bill.id}>
                <Link className="block px-4 py-3" href={`/bills/${bill.id}`}>
                  <p className="font-medium">{bill.number}</p>
                  <p className="text-sm text-stone-500">
                    {bill.customerName} · {bill.status} · {formatCad(bill.totalCents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Recent jobs</h2>
          <Link className="text-sm text-amber-800" href="/jobs">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {recentJobs.map((job) => (
            <li key={job.id}>
              <Link className="block px-4 py-3" href={`/jobs/${job.id}`}>
                <p className="font-medium">{job.name}</p>
                <p className="text-sm text-stone-500">
                  {job.jobTag} · {job.customerName}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

import Link from "next/link";
import {
  countActiveJobs,
  countNeedsReview,
  getBusiness,
  listInvoices,
  listJobs,
} from "@/lib/queries";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const businessId = session.user.businessId;
  const [business, activeCount, needsReview, jobs, invoices] = await Promise.all([
    getBusiness(businessId),
    countActiveJobs(businessId),
    countNeedsReview(businessId),
    listJobs(businessId),
    listInvoices(businessId),
  ]);

  const recentJobs = jobs.slice(0, 5);
  const reviewQueue = invoices.filter((invoice) =>
    ["needs_review", "unmatched", "duplicate", "failed"].includes(invoice.status),
  ).slice(0, 5);

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">Signed in as {session.user.email}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {business?.name ?? "JobLedger"}
        </h1>
      </div>
      <section className="grid grid-cols-2 gap-3">
        <Link href="/invoices" className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Needs review</p>
          <p className="mt-2 text-3xl font-semibold">{needsReview}</p>
        </Link>
        <Link href="/jobs" className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Active jobs</p>
          <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
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

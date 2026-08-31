import Link from "next/link";
import { countActiveJobs, getBusiness, listJobs } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireSession();
  const businessId = session.user.businessId;
  const [business, activeCount, jobs] = await Promise.all([
    getBusiness(businessId),
    countActiveJobs(businessId),
    listJobs(businessId),
  ]);

  const recent = jobs.slice(0, 5);

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">Signed in as {session.user.email}</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {business?.name ?? "JobLedger"}
        </h1>
      </div>
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Needs review</p>
          <p className="mt-2 text-3xl font-semibold">0</p>
          <p className="mt-1 text-xs text-stone-500">
            Invoices land here in a later milestone.
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm text-stone-500">Active jobs</p>
          <p className="mt-2 text-3xl font-semibold">{activeCount}</p>
        </div>
      </section>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">Recent jobs</h2>
          <Link className="text-sm text-amber-800" href="/jobs">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {recent.map((job) => (
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

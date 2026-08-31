import Link from "next/link";
import { listJobs } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export default async function JobsPage() {
  const session = await requireSession();
  const jobs = await listJobs(session.user.businessId);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Jobs</h1>
        <Link
          className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white"
          href="/jobs/new"
        >
          New job
        </Link>
      </div>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {jobs.map((job) => (
          <li key={job.id}>
            <Link className="block px-4 py-3" href={`/jobs/${job.id}`}>
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-medium">{job.name}</p>
                <p className="text-xs uppercase text-stone-500">{job.status}</p>
              </div>
              <p className="text-sm text-stone-500">
                {job.jobTag} · {job.customerName}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

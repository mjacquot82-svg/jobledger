import Link from "next/link";
import { notFound } from "next/navigation";
import { getJob, jobCategoryTotals, listJobInvoices } from "@/lib/queries";
import { formatCad } from "@/lib/money";
import { requireSession } from "@/lib/session";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const job = await getJob(session.user.businessId, id);
  if (!job) notFound();
  const [categories, invoices] = await Promise.all([
    jobCategoryTotals(session.user.businessId, id),
    listJobInvoices(session.user.businessId, id),
  ]);
  const total = categories.reduce((sum, row) => sum + row.totalCents, 0);

  return (
    <main className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">{job.jobTag}</p>
          <h1 className="text-2xl font-semibold">{job.name}</h1>
          <p className="mt-1 text-stone-600">
            {job.customerName}
            {job.addressLine1 ? ` · ${job.addressLine1}` : ""}
          </p>
          <p className="mt-1 text-xs uppercase text-stone-500">{job.status}</p>
        </div>
        <Link className="text-sm text-amber-800" href={`/jobs/${job.id}/edit`}>
          Edit
        </Link>
      </div>
      {job.notes ? (
        <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-700">
          {job.notes}
        </p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-medium">Job costs</h2>
          <p className="font-medium">{formatCad(total)}</p>
        </div>
        <ul className="divide-y divide-stone-200">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span>{category.name}</span>
              <span className="tabular-nums">{formatCad(category.totalCents)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-medium">Invoices</h2>
          <Link className="text-sm text-amber-800" href="/invoices/new">
            Upload
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p className="px-4 py-3 text-sm text-stone-500">None matched yet.</p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <Link className="flex items-center justify-between px-4 py-3" href={`/invoices/${invoice.id}`}>
                  <span>{invoice.invoiceNumber ?? invoice.originalFilename}</span>
                  <span className="text-sm tabular-nums text-stone-600">
                    {invoice.totalCents != null ? formatCad(invoice.totalCents) : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

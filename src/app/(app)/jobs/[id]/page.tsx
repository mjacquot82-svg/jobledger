import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addManualCostAction,
  createBillFromJobAction,
} from "@/app/(app)/bills/actions";
import { listJobCosts } from "@/lib/job-costs";
import { formatCad } from "@/lib/money";
import {
  getJob,
  jobCategoryTotals,
  listCostCategories,
  listJobInvoices,
} from "@/lib/queries";
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
  const [categories, invoices, costs, costCategories] = await Promise.all([
    jobCategoryTotals(session.user.businessId, id),
    listJobInvoices(session.user.businessId, id),
    listJobCosts(session.user.businessId, id),
    listCostCategories(session.user.businessId),
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
        <div className="flex flex-col items-end gap-2">
          <Link className="text-sm text-amber-800" href={`/jobs/${job.id}/edit`}>
            Edit
          </Link>
          <form action={createBillFromJobAction.bind(null, job.id)}>
            <button className="text-sm text-amber-800" type="submit">
              Bill customer
            </button>
          </form>
        </div>
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
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">Add a cost</h2>
        <form
          action={addManualCostAction.bind(null, job.id)}
          className="mt-3 grid gap-3 sm:grid-cols-3"
        >
          <label className="text-sm">
            Category
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              name="categoryId"
              required
            >
              {costCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Amount (CAD)
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              name="amount"
              inputMode="decimal"
              placeholder="0.00"
              required
            />
          </label>
          <label className="text-sm sm:col-span-3">
            Notes
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              name="notes"
              placeholder="Optional"
            />
          </label>
          <button
            className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white sm:col-span-3"
            type="submit"
          >
            Add cost
          </button>
        </form>
        {costs.length ? (
          <ul className="mt-4 divide-y divide-stone-200 border-t border-stone-200">
            {costs.map((cost) => (
              <li
                key={cost.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div>
                  <p>{cost.categoryName}</p>
                  <p className="text-stone-500">
                    {cost.sourceType}
                    {cost.notes ? ` · ${cost.notes}` : ""}
                  </p>
                </div>
                <span className="tabular-nums">{formatCad(cost.amountCents)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="rounded-xl border border-stone-200 bg-white">
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <h2 className="font-medium">Supplier invoices</h2>
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
                <Link
                  className="flex items-center justify-between px-4 py-3"
                  href={`/invoices/${invoice.id}`}
                >
                  <span>{invoice.invoiceNumber ?? invoice.originalFilename}</span>
                  <span className="text-sm tabular-nums text-stone-600">
                    {invoice.totalCents != null
                      ? formatCad(invoice.totalCents)
                      : ""}
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

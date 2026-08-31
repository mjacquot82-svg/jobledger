import Link from "next/link";
import { formatCad } from "@/lib/money";
import { listInvoices } from "@/lib/queries";
import { requireSession } from "@/lib/session";

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

export default async function InvoicesPage() {
  const session = await requireSession();
  const invoices = await listInvoices(session.user.businessId);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Invoices</h1>
        <Link
          className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white"
          href="/invoices/new"
        >
          Upload
        </Link>
      </div>
      {invoices.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
          No supplier invoices yet. Upload a PDF. If it contains a job tag like
          SMITH-001 it will match that job. Otherwise it waits in Needs review.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link className="block px-4 py-3" href={`/invoices/${invoice.id}`}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">
                    {invoice.supplierName ?? invoice.originalFilename}
                  </p>
                  <p className="text-xs uppercase text-stone-500">
                    {statusLabel(invoice.status)}
                  </p>
                </div>
                <p className="text-sm text-stone-500">
                  {invoice.jobTag ?? "No job yet"}
                  {invoice.totalCents != null
                    ? ` · ${formatCad(invoice.totalCents)}`
                    : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

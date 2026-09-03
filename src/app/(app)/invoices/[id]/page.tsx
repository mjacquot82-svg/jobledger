import Link from "next/link";
import { notFound } from "next/navigation";
import { formatCad } from "@/lib/money";
import { getInvoice, listJobs } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { assignInvoiceAction } from "../actions";

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireSession();
  const invoice = await getInvoice(session.user.businessId, id);
  if (!invoice) notFound();
  const jobs = await listJobs(session.user.businessId);
  const assign = assignInvoiceAction.bind(null, invoice.id);
  const needsHuman =
    invoice.status === "needs_review" ||
    invoice.status === "unmatched" ||
    invoice.status === "failed";

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm uppercase text-stone-500">
          {invoice.status.replaceAll("_", " ")}
        </p>
        <h1 className="text-2xl font-semibold">
          {invoice.supplierName ?? invoice.originalFilename}
        </h1>
        <p className="mt-1 text-sm text-stone-600">{invoice.originalFilename}</p>
        <a
          className="mt-2 inline-block text-sm font-medium text-amber-800"
          href={`/api/invoices/${invoice.id}/file`}
          target="_blank"
        >
          Open original PDF
        </a>
      </div>
      {query.duplicate === "1" ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
          This file was already uploaded. Opening the original instead of creating
          a second invoice.
        </p>
      ) : null}
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Invoice #</dt>
            <dd>{invoice.invoiceNumber ?? "Not found"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Total</dt>
            <dd>
              {invoice.totalCents != null
                ? formatCad(invoice.totalCents)
                : "Not found"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Job</dt>
            <dd>
              {invoice.jobId ? (
                <Link className="text-amber-800" href={`/jobs/${invoice.jobId}`}>
                  {invoice.jobName} ({invoice.jobTag})
                </Link>
              ) : (
                "Unassigned"
              )}
            </dd>
          </div>
        </dl>
        {invoice.matchReason ? (
          <p className="mt-4 text-stone-600">{invoice.matchReason}</p>
        ) : null}
      </section>
      {needsHuman ? (
        <form action={assign} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
          <p className="font-medium">Assign to a job</p>
          <p className="text-sm text-stone-600">
            JobLedger will not guess. Pick the job if you know it.
          </p>
          <select
            className="w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="jobId"
            required
          >
            <option value="">Select a job</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.jobTag} · {job.name}
              </option>
            ))}
          </select>
          <button
            className="w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
            type="submit"
          >
            Assign job
          </button>
        </form>
      ) : null}
      {invoice.extractedText ? (
        <section className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="font-medium">Extracted text</h2>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs text-stone-600">
            {invoice.extractedText}
          </pre>
        </section>
      ) : null}
    </main>
  );
}

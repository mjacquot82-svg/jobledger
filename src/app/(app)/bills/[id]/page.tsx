import Link from "next/link";
import { notFound } from "next/navigation";
import { setBillStatusAction } from "@/app/(app)/bills/actions";
import { getBill } from "@/lib/billing";
import { formatCad } from "@/lib/money";
import { requireSession } from "@/lib/session";

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const bill = await getBill(session.user.businessId, id);
  if (!bill) notFound();

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">
          <Link href="/bills">Bills</Link>
        </p>
        <h1 className="text-2xl font-semibold">{bill.number}</h1>
        <p className="mt-1 text-stone-600">
          {bill.customerName}
          {bill.jobTag ? ` · ${bill.jobName} (${bill.jobTag})` : ""}
        </p>
        <p className="mt-1 text-xs uppercase text-stone-500">{bill.status}</p>
      </div>
      <section className="rounded-xl border border-stone-200 bg-white">
        <ul className="divide-y divide-stone-200">
          {bill.lines.map((line) => (
            <li
              key={line.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <span>{line.description}</span>
              <span className="tabular-nums">{formatCad(line.amountCents)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 font-medium">
          <span>Total</span>
          <span className="tabular-nums">{formatCad(bill.totalCents)}</span>
        </div>
      </section>
      <form action={setBillStatusAction.bind(null, bill.id)} className="flex gap-2">
        {bill.status === "draft" ? (
          <button
            className="flex-1 rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
            name="status"
            type="submit"
            value="issued"
          >
            Mark issued
          </button>
        ) : null}
        {bill.status === "issued" ? (
          <button
            className="flex-1 rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
            name="status"
            type="submit"
            value="paid"
          >
            Mark paid
          </button>
        ) : null}
        {bill.status === "paid" ? (
          <p className="text-sm text-stone-500">Paid. Nothing is emailed from here.</p>
        ) : null}
      </form>
    </main>
  );
}

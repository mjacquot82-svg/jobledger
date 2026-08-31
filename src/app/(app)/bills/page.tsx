import Link from "next/link";
import { listBills } from "@/lib/billing";
import { formatCad } from "@/lib/money";
import { requireSession } from "@/lib/session";

export default async function BillsPage() {
  const session = await requireSession();
  const bills = await listBills(session.user.businessId);

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Customer bills</h1>
        <p className="mt-1 text-sm text-stone-600">
          Drafts stay local. Nothing is emailed.
        </p>
      </div>
      {bills.length === 0 ? (
        <p className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-500">
          No bills yet. Open a job and tap Bill customer.
        </p>
      ) : (
        <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {bills.map((bill) => (
            <li key={bill.id}>
              <Link className="block px-4 py-3" href={`/bills/${bill.id}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{bill.number}</p>
                  <p className="tabular-nums">{formatCad(bill.totalCents)}</p>
                </div>
                <p className="text-sm text-stone-500">
                  {bill.customerName}
                  {bill.jobTag ? ` · ${bill.jobTag}` : ""} · {bill.status}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

import Link from "next/link";
import { listCustomers } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export default async function CustomersPage() {
  const session = await requireSession();
  const customers = await listCustomers(session.user.businessId);

  return (
    <main>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <Link
          className="rounded-lg bg-amber-800 px-3 py-2 text-sm font-medium text-white"
          href="/customers/new"
        >
          New customer
        </Link>
      </div>
      <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
        {customers.map((customer) => (
          <li key={customer.id}>
            <Link className="block px-4 py-3" href={`/customers/${customer.id}`}>
              <p className="font-medium">{customer.name}</p>
              <p className="text-sm text-stone-500">
                {customer.addressLine1 ?? "No address yet"}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

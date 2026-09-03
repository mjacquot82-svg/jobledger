import { CustomerForm } from "@/components/customer-form";
import { requireSession } from "@/lib/session";
import { createCustomerAction } from "../../actions";

export default async function NewCustomerPage() {
  await requireSession();
  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">New customer</h1>
      <CustomerForm action={createCustomerAction} />
    </main>
  );
}

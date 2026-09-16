import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { getCustomer } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { updateCustomerAction } from "../../actions";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const customer = await getCustomer(session.user.businessId, id);
  if (!customer) notFound();

  const action = updateCustomerAction.bind(null, customer.id);

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">{customer.name}</h1>
      <CustomerForm
        action={action}
        defaultValues={{
          name: customer.name,
          addressLine1: customer.addressLine1 ?? "",
          city: customer.city ?? "",
          region: customer.region ?? "",
          postalCode: customer.postalCode ?? "",
          phone: customer.phone ?? "",
          email: customer.email ?? "",
        }}
      />
    </main>
  );
}

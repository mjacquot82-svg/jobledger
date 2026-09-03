import { JobForm } from "@/components/job-form";
import { nextJobNumber } from "@/lib/job-numbers";
import { listCustomers } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { createJobAction } from "../../actions";

export default async function NewJobPage() {
  const session = await requireSession();
  const [customers, suggestedNumber] = await Promise.all([
    listCustomers(session.user.businessId),
    nextJobNumber(session.user.businessId),
  ]);

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">New job</h1>
      <JobForm
        customers={customers}
        action={createJobAction}
        suggestedNumber={suggestedNumber}
      />
    </main>
  );
}

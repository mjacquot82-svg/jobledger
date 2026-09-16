import { notFound } from "next/navigation";
import { JobForm } from "@/components/job-form";
import { getJob, listCustomers } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { updateJobAction } from "../../../actions";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const [job, customers] = await Promise.all([
    getJob(session.user.businessId, id),
    listCustomers(session.user.businessId),
  ]);
  if (!job) notFound();

  const action = updateJobAction.bind(null, job.id);

  return (
    <main>
      <h1 className="mb-4 text-2xl font-semibold">Edit job</h1>
      <JobForm
        customers={customers}
        action={action}
        defaultValues={{
          name: job.name,
          jobTag: job.jobTag,
          customerId: job.customerId,
          status: job.status,
          addressLine1: job.addressLine1 ?? "",
          notes: job.notes ?? "",
        }}
      />
    </main>
  );
}

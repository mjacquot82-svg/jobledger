type CustomerOption = {
  id: string;
  name: string;
};

type JobValues = {
  name?: string;
  jobTag?: string;
  customerId?: string;
  status?: string;
  addressLine1?: string;
  notes?: string;
};

export function JobForm({
  customers,
  action,
  defaultValues,
}: {
  customers: CustomerOption[];
  action: (formData: FormData) => Promise<void>;
  defaultValues?: JobValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Job name</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="name"
          defaultValue={defaultValues?.name}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Job tag</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="jobTag"
          defaultValue={defaultValues?.jobTag}
          placeholder="SMITH-001"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Customer</span>
        <select
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="customerId"
          defaultValue={defaultValues?.customerId}
          required
        >
          <option value="">Select a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Status</span>
        <select
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">Site address</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="addressLine1"
          defaultValue={defaultValues?.addressLine1}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes}
        />
      </label>
      <button
        className="w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
        type="submit"
      >
        Save job
      </button>
    </form>
  );
}

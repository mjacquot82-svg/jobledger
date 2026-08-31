type CustomerValues = {
  name?: string;
  addressLine1?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
};

export function CustomerForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => Promise<void>;
  defaultValues?: CustomerValues;
}) {
  return (
    <form action={action} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Name</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="name"
          defaultValue={defaultValues?.name}
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Address</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="addressLine1"
          defaultValue={defaultValues?.addressLine1}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm font-medium">City</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="city"
            defaultValue={defaultValues?.city}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Province</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="region"
            defaultValue={defaultValues?.region}
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium">Postal code</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="postalCode"
          defaultValue={defaultValues?.postalCode}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Phone</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="phone"
          defaultValue={defaultValues?.phone}
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">Email</span>
        <input
          className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
          name="email"
          type="email"
          defaultValue={defaultValues?.email}
        />
      </label>
      <button
        className="w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
        type="submit"
      >
        Save customer
      </button>
    </form>
  );
}

import { getBusiness } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { signOutAction } from "../actions";

export default async function SettingsPage() {
  const session = await requireSession();
  const business = await getBusiness(session.user.businessId);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">Business</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Name</dt>
            <dd>{business?.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Currency</dt>
            <dd>{business?.currency}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Timezone</dt>
            <dd>{business?.timezone}</dd>
          </div>
        </dl>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <h2 className="font-medium text-stone-900">Milestone 1</h2>
        <p className="mt-2">
          Email ingest, invoice matching, and OCR are not in this build. Needs
          review stays at 0 until that work is authorized.
        </p>
      </section>
      <form action={signOutAction}>
        <button
          className="w-full rounded-lg border border-stone-300 px-4 py-3 font-medium"
          type="submit"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}

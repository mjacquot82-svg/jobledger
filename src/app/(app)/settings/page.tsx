import { emailIngestStatus, inboundAddressFor } from "@/lib/email-ingest";
import { getBusiness } from "@/lib/queries";
import { requireSession } from "@/lib/session";
import { signOutAction } from "../actions";
import { updateSettingsAction } from "./actions";

export default async function SettingsPage() {
  const session = await requireSession();
  const business = await getBusiness(session.user.businessId);
  const inbound =
    business?.inboundAddress ?? inboundAddressFor(session.user.businessId);
  const email = emailIngestStatus();
  const markupPercent = ((business?.markupBps ?? 0) / 100).toFixed(2);

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
      <section className="rounded-xl border border-stone-200 bg-white p-4">
        <h2 className="font-medium">Customer billing markup</h2>
        <p className="mt-2 text-sm text-stone-600">
          Applied when you bill a customer from job costs. 0 means bill costs as-is.
        </p>
        <form action={updateSettingsAction} className="mt-3 flex gap-3">
          <label className="flex-1 text-sm">
            Markup %
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              defaultValue={markupPercent}
              inputMode="decimal"
              name="markupPercent"
            />
          </label>
          <button
            className="mt-6 rounded-lg bg-amber-800 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Save
          </button>
        </form>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Connect Email</h2>
        <p className="mt-2 text-stone-600">
          Recommended. One tap to connect Gmail, Outlook, Hotmail, or Microsoft
          365. JobLedger owns the connection. Coming soon.
        </p>
        <button
          className="mt-3 w-full rounded-lg border border-stone-300 px-4 py-3 font-medium text-stone-400"
          disabled
          type="button"
        >
          Connect Email
        </button>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Forward invoices</h2>
        <p className="mt-2 break-all font-mono text-stone-800">{inbound}</p>
        <p className="mt-2 text-stone-600">{email.reason}</p>
      </section>
      <section className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
        <h2 className="font-medium text-stone-900">OCR</h2>
        <p className="mt-2">
          Provider: {business?.ocrProvider ?? "local_pdf"}. Local PDF text only.
          Paid OCR is wired as an adapter and stays off until you authorize it.
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

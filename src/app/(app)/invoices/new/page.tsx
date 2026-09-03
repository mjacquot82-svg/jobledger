import { uploadInvoiceAction } from "../actions";

export default function NewInvoicePage() {
  return (
    <main>
      <h1 className="mb-2 text-2xl font-semibold">Upload invoice</h1>
      <p className="mb-6 text-sm text-stone-600">
        PDF only. Put the job tag in the file name or the PDF text, for example
        SMITH-001. Job assignment is never guessed.
      </p>
      <form action={uploadInvoiceAction} className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">PDF file</span>
          <input
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-3"
            name="file"
            type="file"
            accept="application/pdf,.pdf"
            required
          />
        </label>
        <button
          className="w-full rounded-lg bg-amber-800 px-4 py-3 font-medium text-white"
          type="submit"
        >
          Upload and match
        </button>
      </form>
    </main>
  );
}

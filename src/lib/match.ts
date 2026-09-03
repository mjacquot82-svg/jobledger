export type JobTag = { id: string; jobTag: string | null };

export type MatchResult =
  | { status: "matched"; jobId: string; jobTag: string; reason: string }
  | { status: "needs_review"; jobIds: string[]; tags: string[]; reason: string }
  | { status: "unmatched"; reason: string };

function tagPattern(tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (/^\d+$/.test(tag)) {
    return new RegExp(
      `(^|[^A-Za-z0-9$])(?:#|job\\s*#?)?${escaped}(?![0-9.])`,
      "i",
    );
  }
  return new RegExp(`(^|[^A-Za-z0-9])${escaped}([^A-Za-z0-9]|$)`, "i");
}

export function matchJobs(haystack: string, jobs: JobTag[]): MatchResult {
  const hits = jobs.filter((job) => {
    const tag = job.jobTag?.trim() ?? "";
    if (tag.length < 3) return false;
    return tagPattern(tag).test(haystack);
  });

  const unique = [...new Map(hits.map((job) => [job.id, job])).values()];

  if (unique.length === 1) {
    return {
      status: "matched",
      jobId: unique[0].id,
      jobTag: unique[0].jobTag as string,
      reason: `Found job tag ${unique[0].jobTag}`,
    };
  }

  if (unique.length > 1) {
    const tags = unique.map((job) => job.jobTag).filter(Boolean) as string[];
    return {
      status: "needs_review",
      jobIds: unique.map((job) => job.id),
      tags,
      reason: `Found multiple job tags: ${tags.join(", ")}`,
    };
  }

  return {
    status: "unmatched",
    reason: "No job tag found in the file name, email, or PDF text",
  };
}

export function extractInvoiceFields(text: string) {
  const invoiceNumber =
    text.match(/inv(?:oice)?\s*#?\s*([A-Z0-9][A-Z0-9\-]{1,24})/i)?.[1] ?? null;

  const totalRaw = text.match(
    /total[^\n$0-9]{0,20}\$?\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})|[0-9]+\.[0-9]{2})/i,
  )?.[1];
  const totalCents = totalRaw
    ? Math.round(Number(totalRaw.replace(/,/g, "")) * 100)
    : null;

  const dateRaw = text.match(
    /(?:invoice\s+)?date\s*:?\s*(\d{4}-\d{2}-\d{2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
  )?.[1];
  let invoiceDate: string | null = null;
  if (dateRaw) {
    const iso = dateRaw.match(/^\d{4}-\d{2}-\d{2}$/);
    if (iso) {
      invoiceDate = dateRaw;
    } else {
      const [month, day, rawYear] = dateRaw.split(/[\/-]/).map(Number);
      const year = rawYear < 100 ? 2000 + rawYear : rawYear;
      const candidate = new Date(Date.UTC(year, month - 1, day));
      if (
        candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCDate() === day
      ) {
        invoiceDate = `${year.toString().padStart(4, "0")}-${month
          .toString()
          .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      }
    }
  }

  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 2);

  return {
    invoiceNumber,
    invoiceDate,
    totalCents: totalCents !== null && Number.isFinite(totalCents) ? totalCents : null,
    supplierNameGuess: firstLine ?? null,
  };
}

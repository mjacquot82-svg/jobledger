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

  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.length > 2);

  return {
    invoiceNumber,
    totalCents: totalCents !== null && Number.isFinite(totalCents) ? totalCents : null,
    supplierNameGuess: firstLine ?? null,
  };
}

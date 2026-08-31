"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireSession } from "@/lib/session";

export async function updateSettingsAction(formData: FormData) {
  const session = await requireSession();
  const percent = Number(formData.get("markupPercent") ?? 0);
  const markupBps = Number.isFinite(percent)
    ? Math.max(0, Math.round(percent * 100))
    : 0;
  await db
    .update(businesses)
    .set({ markupBps })
    .where(eq(businesses.id, session.user.businessId));
  revalidatePath("/settings");
  revalidatePath("/jobs");
  redirect("/settings");
}

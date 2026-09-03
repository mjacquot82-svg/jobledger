"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { customers, jobs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { requireSession } from "@/lib/session";

const jobSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  jobTag: z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length ? trimmed : undefined;
    },
    z
      .string()
      .min(3, "Use at least 3 characters so it can auto-match")
      .optional(),
  ),
  customerId: z.string().uuid(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
  addressLine1: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  addressLine1: z.string().trim().optional(),
  city: z.string().trim().optional(),
  region: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
});

function emptyToUndefined(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : undefined;
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

export async function createJobAction(formData: FormData) {
  const session = await requireSession();
  const parsed = jobSchema.parse({
    name: formData.get("name"),
    jobTag: formData.get("jobTag"),
    customerId: formData.get("customerId"),
    status: formData.get("status") || "active",
    addressLine1: emptyToUndefined(formData.get("addressLine1")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  const [job] = await db
    .insert(jobs)
    .values({
      name: parsed.name,
      jobTag: parsed.jobTag ?? null,
      customerId: parsed.customerId,
      status: parsed.status,
      addressLine1: parsed.addressLine1,
      notes: parsed.notes,
      businessId: session.user.businessId,
    })
    .returning();

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobAction(jobId: string, formData: FormData) {
  const session = await requireSession();
  const parsed = jobSchema.parse({
    name: formData.get("name"),
    jobTag: formData.get("jobTag"),
    customerId: formData.get("customerId"),
    status: formData.get("status") || "active",
    addressLine1: emptyToUndefined(formData.get("addressLine1")),
    notes: emptyToUndefined(formData.get("notes")),
  });

  await db
    .update(jobs)
    .set({
      name: parsed.name,
      jobTag: parsed.jobTag ?? null,
      customerId: parsed.customerId,
      status: parsed.status,
      addressLine1: parsed.addressLine1,
      notes: parsed.notes,
    })
    .where(
      and(eq(jobs.id, jobId), eq(jobs.businessId, session.user.businessId)),
    );

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function createCustomerAction(formData: FormData) {
  const session = await requireSession();
  const parsed = customerSchema.parse({
    name: formData.get("name"),
    addressLine1: emptyToUndefined(formData.get("addressLine1")),
    city: emptyToUndefined(formData.get("city")),
    region: emptyToUndefined(formData.get("region")),
    postalCode: emptyToUndefined(formData.get("postalCode")),
    phone: emptyToUndefined(formData.get("phone")),
    email: emptyToUndefined(formData.get("email")) ?? "",
  });

  const [customer] = await db
    .insert(customers)
    .values({
      name: parsed.name,
      addressLine1: parsed.addressLine1,
      city: parsed.city,
      region: parsed.region,
      postalCode: parsed.postalCode,
      phone: parsed.phone,
      email: parsed.email || null,
      businessId: session.user.businessId,
    })
    .returning();

  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
) {
  const session = await requireSession();
  const parsed = customerSchema.parse({
    name: formData.get("name"),
    addressLine1: emptyToUndefined(formData.get("addressLine1")),
    city: emptyToUndefined(formData.get("city")),
    region: emptyToUndefined(formData.get("region")),
    postalCode: emptyToUndefined(formData.get("postalCode")),
    phone: emptyToUndefined(formData.get("phone")),
    email: emptyToUndefined(formData.get("email")) ?? "",
  });

  await db
    .update(customers)
    .set({
      name: parsed.name,
      addressLine1: parsed.addressLine1,
      city: parsed.city,
      region: parsed.region,
      postalCode: parsed.postalCode,
      phone: parsed.phone,
      email: parsed.email || null,
    })
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.businessId, session.user.businessId),
      ),
    );

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  redirect(`/customers/${customerId}`);
}

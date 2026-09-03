import "dotenv/config";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./";
import {
  account,
  businesses,
  costCategories,
  customers,
  jobs,
  suppliers,
  user,
} from "./schema";
import { inboundAddressFor } from "@/lib/email-ingest";

const DEMO_EMAIL = "demo@jobledger.local";
const DEMO_PASSWORD = "DemoPass123!";

const DEFAULT_CATEGORIES = [
  { name: "Materials", sortOrder: 1 },
  { name: "Labour", sortOrder: 2 },
  { name: "Subcontract", sortOrder: 3 },
  { name: "Equipment", sortOrder: 4 },
  { name: "Other", sortOrder: 5 },
];

async function ensureDemoCredential(userId: string) {
  const password = await hashPassword(DEMO_PASSWORD);
  const [existingAccount] = await db
    .select()
    .from(account)
    .where(
      and(eq(account.userId, userId), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (existingAccount) {
    await db
      .update(account)
      .set({ password, updatedAt: new Date() })
      .where(eq(account.id, existingAccount.id));
    return;
  }

  const now = new Date();
  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password,
    createdAt: now,
    updatedAt: now,
  });
}

async function ensureDemoCatalog(businessId: string) {
  const existingCategories = await db
    .select()
    .from(costCategories)
    .where(eq(costCategories.businessId, businessId))
    .limit(1);
  if (!existingCategories[0]) {
    await db.insert(costCategories).values(
      DEFAULT_CATEGORIES.map((category) => ({
        businessId,
        name: category.name,
        sortOrder: category.sortOrder,
      })),
    );
  }

  const existingSupplier = await db
    .select()
    .from(suppliers)
    .where(
      and(eq(suppliers.businessId, businessId), eq(suppliers.name, "Home Depot")),
    )
    .limit(1);
  if (!existingSupplier[0]) {
    await db.insert(suppliers).values({
      businessId,
      name: "Home Depot",
    });
  }

  const existingJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.businessId, businessId))
    .limit(1);
  if (existingJobs[0]) return;

  const [smith] = await db
    .insert(customers)
    .values({
      businessId,
      name: "John Smith",
      addressLine1: "123 Example Road",
      city: "Toronto",
      region: "ON",
    })
    .returning();

  const [wilson] = await db
    .insert(customers)
    .values({
      businessId,
      name: "Amy Wilson",
      addressLine1: "45 Maple Street",
      city: "Mississauga",
      region: "ON",
    })
    .returning();

  const [chen] = await db
    .insert(customers)
    .values({
      businessId,
      name: "David Chen",
      addressLine1: "88 Harbour Drive",
      city: "Oakville",
      region: "ON",
    })
    .returning();

  await db.insert(jobs).values([
    {
      businessId,
      customerId: smith.id,
      name: "Smith Garage",
      jobTag: "SMITH-001",
      status: "active",
      addressLine1: "123 Example Road",
      notes:
        "Detached garage rebuild. Put SMITH-001 on supplier invoices to auto-match.",
    },
    {
      businessId,
      customerId: wilson.id,
      name: "Wilson Kitchen",
      jobTag: "WILSON-002",
      status: "active",
      addressLine1: "45 Maple Street",
    },
    {
      businessId,
      customerId: chen.id,
      name: "Chen Deck",
      jobTag: "CHEN-003",
      status: "completed",
      addressLine1: "88 Harbour Drive",
    },
  ]);
}

async function main() {
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, DEMO_EMAIL))
    .limit(1);

  if (existing[0]?.businessId) {
    await ensureDemoCredential(existing[0].id);
    await ensureDemoCatalog(existing[0].businessId);
    console.log("Demo user repaired; password refreshed and catalog ensured.");
    console.log(`Sign in: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
    process.exit(0);
  }

  const [business] = await db
    .insert(businesses)
    .values({
      name: "Jacquot Demo Contracting",
      currency: "CAD",
      timezone: "America/Toronto",
    })
    .returning();

  await db
    .update(businesses)
    .set({ inboundAddress: inboundAddressFor(business.id) })
    .where(eq(businesses.id, business.id));

  const userId = crypto.randomUUID();
  const now = new Date();

  await db.insert(user).values({
    id: userId,
    name: "Demo Owner",
    email: DEMO_EMAIL,
    emailVerified: true,
    businessId: business.id,
    createdAt: now,
    updatedAt: now,
  });

  await ensureDemoCredential(userId);
  await ensureDemoCatalog(business.id);

  console.log("Seeded Jacquot Demo Contracting.");
  console.log(`Sign in: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

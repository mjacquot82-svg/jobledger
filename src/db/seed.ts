import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "./";
import {
  account,
  businesses,
  costCategories,
  customers,
  jobs,
  user,
} from "./schema";

const DEMO_EMAIL = "demo@jobledger.local";
const DEMO_PASSWORD = "DemoPass123!";

const DEFAULT_CATEGORIES = [
  { name: "Materials", sortOrder: 1 },
  { name: "Labour", sortOrder: 2 },
  { name: "Subcontract", sortOrder: 3 },
  { name: "Equipment", sortOrder: 4 },
  { name: "Other", sortOrder: 5 },
];

async function main() {
  const existing = await db
    .select()
    .from(user)
    .where(eq(user.email, DEMO_EMAIL))
    .limit(1);

  if (existing[0]?.businessId) {
    console.log("Demo data already present. Sign in with");
    console.log(`  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
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

  await db.insert(account).values({
    id: crypto.randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: await hashPassword(DEMO_PASSWORD),
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(costCategories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      businessId: business.id,
      name: category.name,
      sortOrder: category.sortOrder,
    })),
  );

  const [smith] = await db
    .insert(customers)
    .values({
      businessId: business.id,
      name: "John Smith",
      addressLine1: "123 Example Road",
      city: "Toronto",
      region: "ON",
    })
    .returning();

  const [wilson] = await db
    .insert(customers)
    .values({
      businessId: business.id,
      name: "Amy Wilson",
      addressLine1: "45 Maple Street",
      city: "Mississauga",
      region: "ON",
    })
    .returning();

  const [chen] = await db
    .insert(customers)
    .values({
      businessId: business.id,
      name: "David Chen",
      addressLine1: "88 Harbour Drive",
      city: "Oakville",
      region: "ON",
    })
    .returning();

  await db.insert(jobs).values([
    {
      businessId: business.id,
      customerId: smith.id,
      name: "Smith Garage",
      jobTag: "SMITH-001",
      status: "active",
      addressLine1: "123 Example Road",
      notes: "Detached garage rebuild. Seed job for Milestone 1.",
    },
    {
      businessId: business.id,
      customerId: wilson.id,
      name: "Wilson Kitchen",
      jobTag: "WILSON-002",
      status: "active",
      addressLine1: "45 Maple Street",
    },
    {
      businessId: business.id,
      customerId: chen.id,
      name: "Chen Deck",
      jobTag: "CHEN-003",
      status: "completed",
      addressLine1: "88 Harbour Drive",
    },
  ]);

  console.log("Seeded Jacquot Demo Contracting.");
  console.log(`Sign in: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

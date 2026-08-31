import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const jobStatusEnum = pgEnum("job_status", [
  "active",
  "completed",
  "archived",
]);

export const costSourceEnum = pgEnum("cost_source", [
  "manual",
  "invoice",
  "punchclock",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "processing",
  "matched",
  "needs_review",
  "unmatched",
  "duplicate",
  "failed",
]);

export const invoiceSourceEnum = pgEnum("invoice_source", ["upload", "email"]);

export const mailboxProviderEnum = pgEnum("mailbox_provider", [
  "google",
  "microsoft",
  "forwarding",
  "other",
]);

export const billStatusEnum = pgEnum("bill_status", ["draft", "issued", "paid"]);

export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("CAD"),
  timezone: text("timezone").notNull().default("America/Toronto"),
  inboundAddress: text("inbound_address"),
  ocrProvider: text("ocr_provider").notNull().default("local_pdf"),
  markupBps: integer("markup_bps").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  businessId: uuid("business_id").references(() => businesses.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt", {
    withTimezone: true,
  }),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", {
    withTimezone: true,
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow(),
});

export const mailboxConnections = pgTable(
  "mailbox_connections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    provider: mailboxProviderEnum("provider").notNull(),
    status: text("status").notNull().default("disconnected"),
    externalAccount: text("external_account"),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
    watchExpiresAt: timestamp("watch_expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("mailbox_connections_business_provider_idx").on(
      table.businessId,
      table.provider,
    ),
  ],
);

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    addressLine1: text("address_line1"),
    city: text("city"),
    region: text("region"),
    postalCode: text("postal_code"),
    phone: text("phone"),
    email: text("email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("customers_business_id_id_idx").on(table.businessId, table.id),
  ],
);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    jobTag: text("job_tag"),
    status: jobStatusEnum("status").notNull().default("active"),
    addressLine1: text("address_line1"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("jobs_business_job_tag_idx").on(table.businessId, table.jobTag),
  ],
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("suppliers_business_name_idx").on(table.businessId, table.name),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    status: invoiceStatusEnum("status").notNull().default("processing"),
    source: invoiceSourceEnum("source").notNull().default("upload"),
    provider: text("provider"),
    providerMessageId: text("provider_message_id"),
    emailSubject: text("email_subject"),
    emailFrom: text("email_from"),
    invoiceNumber: text("invoice_number"),
    totalCents: integer("total_cents"),
    currency: text("currency").notNull().default("CAD"),
    originalFilename: text("original_filename").notNull(),
    storedPath: text("stored_path").notNull(),
    contentHash: text("content_hash").notNull(),
    extractedText: text("extracted_text"),
    matchReason: text("match_reason"),
    supplierNameGuess: text("supplier_name_guess"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("invoices_business_hash_idx").on(
      table.businessId,
      table.contentHash,
    ),
    uniqueIndex("invoices_business_provider_msgid_idx").on(
      table.businessId,
      table.provider,
      table.providerMessageId,
    ),
  ],
);

export const costCategories = pgTable(
  "cost_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("cost_categories_business_name_idx").on(
      table.businessId,
      table.name,
    ),
  ],
);

export const jobCosts = pgTable("job_costs", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  jobId: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => costCategories.id, { onDelete: "restrict" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, {
    onDelete: "set null",
  }),
  amountCents: integer("amount_cents").notNull().default(0),
  sourceType: costSourceEnum("source_type").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const customerInvoices = pgTable(
  "customer_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    jobId: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    number: text("number").notNull(),
    status: billStatusEnum("status").notNull().default("draft"),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    markupCents: integer("markup_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("customer_invoices_business_number_idx").on(
      table.businessId,
      table.number,
    ),
  ],
);

export const customerInvoiceLines = pgTable("customer_invoice_lines", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  customerInvoiceId: uuid("customer_invoice_id")
    .notNull()
    .references(() => customerInvoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
});

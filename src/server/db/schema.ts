import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  boolean,
  timestamp,
  date,
  integer,
  pgEnum,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "SUPERADMIN",
  "ORG_ADMIN",
  "BILLING_CASHIER",
  "INVENTORY_MANAGER",
  "ACCOUNTANT",
]);

export const invoiceTypeEnum = pgEnum("invoice_type", [
  "TAX_INVOICE",
  "RETAIL_BILL",
  "PROFORMA",
  "QUOTATION",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "DRAFT",
  "ISSUED",
  "PARTIALLY_PAID",
  "PAID",
  "CANCELLED",
  "REFUNDED",
]);

export const paymentModeEnum = pgEnum("payment_mode", [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CHEQUE",
  "CARD",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "PURCHASE_INWARD",
  "SALE_INVOICE",
  "SALES_RETURN",
  "DAMAGE_WASTE",
  "AUDIT_ADJUSTMENT",
]);

// 1. Organizations (Tenants / Businesses - replaces legacy company.php)
export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull(),
  tradeName: varchar("trade_name", { length: 255 }),
  gstin: varchar("gstin", { length: 15 }).unique(),
  pan: varchar("pan", { length: 10 }),
  email: varchar("email", { length: 255 }),
  phonePrimary: varchar("phone_primary", { length: 20 }).notNull(),
  phoneSecondary: varchar("phone_secondary", { length: 20 }),
  upiVpa: varchar("upi_vpa", { length: 100 }), // e.g. merchant@upi for dynamic QR
  addressLine: text("address_line").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  stateCode: varchar("state_code", { length: 2 }).notNull(), // e.g. '33' for TN
  pinCode: varchar("pin_code", { length: 10 }).notNull(),
  invoicePrefix: varchar("invoice_prefix", { length: 10 }).default("INV-"),
  nextInvoiceNumber: integer("next_invoice_number").default(1),
  thermalHeader: text("thermal_header"),
  thermalFooter: text("thermal_footer").default("Thank you for your business!"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Users & Cashiers (replaces legacy users.php)
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).unique().notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: userRoleEnum("role").default("BILLING_CASHIER").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Customers & Khata (Credit) Ledger (replaces legacy cusomer table)
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 200 }).notNull(),
    companyName: varchar("company_name", { length: 200 }),
    gstin: varchar("gstin", { length: 15 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    email: varchar("email", { length: 255 }),
    billingAddress: text("billing_address").notNull(),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 100 }),
    stateCode: varchar("state_code", { length: 2 }),
    pinCode: varchar("pin_code", { length: 10 }),
    creditLimit: numeric("credit_limit", { precision: 14, scale: 2 }).default("0.00"),
    currentBalance: numeric("current_balance", { precision: 14, scale: 2 }).default("0.00"), // Positive = owes money
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_customers_org_phone").on(table.organizationId, table.phone),
    index("idx_customers_org_name").on(table.organizationId, table.name),
  ]
);

// 4. Suppliers / Vendors (for P2P Procurement)
export const suppliers = pgTable("suppliers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  supplierName: varchar("supplier_name", { length: 255 }).notNull(),
  contactPerson: varchar("contact_person", { length: 150 }),
  gstin: varchar("gstin", { length: 15 }),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 100 }),
  stateCode: varchar("state_code", { length: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Products & Inventory (replaces legacy stock table)
export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    barcode: varchar("barcode", { length: 100 }),
    sku: varchar("sku", { length: 100 }),
    name: varchar("name", { length: 255 }).notNull(),
    hsnSac: varchar("hsn_sac", { length: 20 }).default("9999").notNull(),
    unitOfMeasure: varchar("unit_of_measure", { length: 20 }).default("PCS").notNull(),
    purchasePrice: numeric("purchase_price", { precision: 14, scale: 2 }).default("0.00").notNull(),
    sellingPrice: numeric("selling_price", { precision: 14, scale: 2 }).notNull(),
    minSellingPrice: numeric("min_selling_price", { precision: 14, scale: 2 }),
    taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).default("0.00").notNull(),
    isTaxInclusive: boolean("is_tax_inclusive").default(false).notNull(),
    currentStock: numeric("current_stock", { precision: 12, scale: 2 }).default("0.00").notNull(),
    minStockAlert: numeric("min_stock_alert", { precision: 12, scale: 2 }).default("5.00").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_products_org_barcode").on(table.organizationId, table.barcode),
    index("idx_products_org_name").on(table.organizationId, table.name),
  ]
);

// 6. Stock Movements (Double-entry Inventory Ledger)
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
    movementType: movementTypeEnum("movement_type").notNull(),
    referenceId: uuid("reference_id"),
    quantityDelta: numeric("quantity_delta", { precision: 12, scale: 2 }).notNull(),
    unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull(),
    balanceAfterMovement: numeric("balance_after_movement", { precision: 12, scale: 2 }).notNull(),
    notes: text("notes"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_stock_mv_product").on(table.productId, table.createdAt),
  ]
);

// 7. Invoices (Core Sales Event - Persisted!)
export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }).notNull(),
    invoiceType: invoiceTypeEnum("invoice_type").default("TAX_INVOICE").notNull(),
    invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
    invoiceDate: date("invoice_date").notNull(),
    dueDate: date("due_date"),
    status: invoiceStatusEnum("status").default("ISSUED").notNull(),
    
    // Snapshots at time of sale
    customerSnapshot: jsonb("customer_snapshot").notNull(),
    sellerSnapshot: jsonb("seller_snapshot").notNull(),

    // Financial calculations
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
    taxableAmount: numeric("taxable_amount", { precision: 14, scale: 2 }).notNull(),
    cgstAmount: numeric("cgst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
    sgstAmount: numeric("sgst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
    igstAmount: numeric("igst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
    totalTaxAmount: numeric("total_tax_amount", { precision: 14, scale: 2 }).notNull(),
    roundOff: numeric("round_off", { precision: 6, scale: 2 }).default("0.00").notNull(),
    grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull(),
    paidAmount: numeric("paid_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
    balanceAmount: numeric("balance_amount", { precision: 14, scale: 2 }).notNull(),

    // Dynamic UPI Payment QR Link
    upiPaymentUrl: text("upi_payment_url"),

    notes: text("notes"),
    termsConditions: text("terms_conditions"),
    createdBy: uuid("created_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_invoices_org_date").on(table.organizationId, table.invoiceDate),
    index("idx_invoices_status").on(table.organizationId, table.status),
    index("idx_invoices_customer").on(table.customerId),
  ]
);

// 8. Invoice Line Items
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "cascade" }).notNull(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }).notNull(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  hsnSac: varchar("hsn_sac", { length: 20 }).notNull(),
  unitOfMeasure: varchar("unit_of_measure", { length: 20 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 14, scale: 2 }).notNull(), // for gross profit margin
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 }).default("0.00").notNull(),
  discountAmount: numeric("discount_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
  taxableValue: numeric("taxable_value", { precision: 14, scale: 2 }).notNull(),
  taxPercent: numeric("tax_percent", { precision: 5, scale: 2 }).notNull(),
  cgstRate: numeric("cgst_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  cgstAmount: numeric("cgst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
  sgstRate: numeric("sgst_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  sgstAmount: numeric("sgst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
  igstRate: numeric("igst_rate", { precision: 5, scale: 2 }).default("0.00").notNull(),
  igstAmount: numeric("igst_amount", { precision: 14, scale: 2 }).default("0.00").notNull(),
  totalAmount: numeric("total_amount", { precision: 14, scale: 2 }).notNull(),
});

// 9. Payments (REA Economic Duality: Cash Inflow balancing the invoice)
export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").references(() => invoices.id, { onDelete: "restrict" }),
  customerId: uuid("customer_id").references(() => customers.id, { onDelete: "restrict" }).notNull(),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  paymentMode: paymentModeEnum("payment_mode").notNull(),
  transactionReference: varchar("transaction_reference", { length: 100 }),
  notes: text("notes"),
  receivedBy: uuid("received_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 10. Cash Registers (Day-End Shift Closing / Z-Report)
export const cashRegisters = pgTable("cash_registers", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  cashierId: uuid("cashier_id").references(() => users.id, { onDelete: "restrict" }).notNull(),
  shiftDate: date("shift_date").notNull(),
  openingCash: numeric("opening_cash", { precision: 14, scale: 2 }).notNull(),
  cashSales: numeric("cash_sales", { precision: 14, scale: 2 }).default("0.00").notNull(),
  cashInflows: numeric("cash_inflows", { precision: 14, scale: 2 }).default("0.00").notNull(),
  cashOutflows: numeric("cash_outflows", { precision: 14, scale: 2 }).default("0.00").notNull(),
  expectedCash: numeric("expected_cash", { precision: 14, scale: 2 }).notNull(),
  actualCountedCash: numeric("actual_counted_cash", { precision: 14, scale: 2 }),
  cashVariance: numeric("cash_variance", { precision: 14, scale: 2 }),
  isClosed: boolean("is_closed").default(false).notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

// Drizzle Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

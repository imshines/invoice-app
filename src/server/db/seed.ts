import { db } from "./index";
import {
  organizations,
  users,
  customers,
  products,
  stockMovements,
  invoices,
  invoiceItems,
  payments,
} from "./schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("=== 1. CLEANING UP ALL EXISTING DATA IN DATABASE ===");

  // Clean truncate with CASCADE to clear all tables cleanly
  await db.execute(sql`
    TRUNCATE TABLE 
      invoice_items, 
      payments, 
      invoices, 
      stock_movements, 
      products, 
      customers, 
      users, 
      organizations 
    CASCADE;
  `);

  console.log("All existing data truncated successfully.");

  console.log("\n=== 2. SEEDING GENERIC BUSINESS ORGANIZATION ===");
  const [org] = await db
    .insert(organizations)
    .values({
      legalName: "Metro Supermarket & Wholesale Hub Pvt Ltd",
      tradeName: "Metro Supermarket & Wholesale",
      gstin: "33AAACM1234M1Z5",
      pan: "AAACM1234M",
      email: "contact@metrosupermarket.com",
      phonePrimary: "9876501234",
      phoneSecondary: "9843209876",
      upiVpa: "metrosupermarket@okaxis",
      addressLine: "45 Commercial Boulevard, Central Market",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641001",
      invoicePrefix: "MSM-2026-",
      nextInvoiceNumber: 1001,
      thermalHeader: "METRO SUPERMARKET & WHOLESALE\n45 Commercial Blvd, Central Market\nGSTIN: 33AAACM1234M1Z5\nPhone: 9876501234",
      thermalFooter: "Thank you for shopping at Metro Supermarket!\nFor support / returns, contact support@metrosupermarket.com\nGoods once sold cannot be returned without original bill.",
    })
    .returning();

  console.log(`Created Organization: ${org.tradeName} (${org.id})`);

  console.log("\n=== 3. SEEDING AUTH USERS (ADMIN & CASHIER) ===");
  const passwordHash = await bcrypt.hash("admin123", 10);

  const [adminUser] = await db
    .insert(users)
    .values([
      {
        organizationId: org.id,
        email: "admin@srihari.com",
        fullName: "System Admin (Dhamodharan)",
        phone: "9876501234",
        passwordHash,
        role: "ORG_ADMIN",
      },
      {
        organizationId: org.id,
        email: "cashier@srihari.com",
        fullName: "Ramesh (Billing Cashier)",
        phone: "9876501235",
        passwordHash,
        role: "BILLING_CASHIER",
      },
      {
        organizationId: org.id,
        email: "admin@metro.com",
        fullName: "Store Manager (Alex)",
        phone: "9876501236",
        passwordHash,
        role: "ORG_ADMIN",
      },
      {
        organizationId: org.id,
        email: "cashier@metro.com",
        fullName: "Priya (Counter Cashier)",
        phone: "9876501237",
        passwordHash,
        role: "BILLING_CASHIER",
      },
    ])
    .returning();

  console.log("Created 4 Auth Users:");
  console.log("  - admin@srihari.com / admin123 (ORG_ADMIN)");
  console.log("  - cashier@srihari.com / admin123 (BILLING_CASHIER)");
  console.log("  - admin@metro.com / admin123 (ORG_ADMIN)");
  console.log("  - cashier@metro.com / admin123 (BILLING_CASHIER)");

  console.log("\n=== 4. SEEDING GENERIC CUSTOMERS & KHATA LEDGER ===");
  const customerRecords = [
    {
      organizationId: org.id,
      customerCode: "CUST-001",
      name: "Walk-in Customer",
      area: "Counter Sale",
      phone: "Walk-in",
      billingAddress: "Counter Walk-in Sale",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      creditLimit: "0.00",
      currentBalance: "0.00",
    },
    {
      organizationId: org.id,
      customerCode: "CUST-002",
      name: "Sharma Kirana & General Store",
      companyName: "Sharma Trading Co.",
      area: "Market Yard",
      phone: "9845012345",
      email: "sharma.kirana@gmail.com",
      gstin: "33AAAAA1111A1Z1",
      billingAddress: "12 Grain Market Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641002",
      creditLimit: "50000.00",
      currentBalance: "14200.00", // Khata balance
    },
    {
      organizationId: org.id,
      customerCode: "CUST-003",
      name: "Priya Departmental Store",
      companyName: "Priya Retailers",
      area: "R.S. Puram",
      phone: "9876543210",
      email: "priya.retail@outlook.com",
      gstin: "33BBBBB2222B1Z2",
      billingAddress: "88 West Club Road, R.S. Puram",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641002",
      creditLimit: "75000.00",
      currentBalance: "6500.00",
    },
    {
      organizationId: org.id,
      customerCode: "CUST-004",
      name: "Kavitha Bakery & Sweets",
      companyName: "Kavitha Food Products",
      area: "Town Hall",
      phone: "9894123456",
      email: "kavitha.bakes@yahoo.com",
      billingAddress: "24 Oppanakara Street",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641001",
      creditLimit: "30000.00",
      currentBalance: "2800.00",
    },
    {
      organizationId: org.id,
      customerCode: "CUST-005",
      name: "Rajesh Kumar (Loyalty Member)",
      area: "Gandhipuram",
      phone: "9789123456",
      email: "rajesh.k@gmail.com",
      billingAddress: "5th Street, Cross Cut Road",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641012",
      creditLimit: "10000.00",
      currentBalance: "0.00",
    },
    {
      organizationId: org.id,
      customerCode: "CUST-006",
      name: "Anitha Swaminathan",
      area: "Peelamedu",
      phone: "9944012345",
      email: "anitha.swami@gmail.com",
      billingAddress: "Avinashi Road, Peelamedu",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641004",
      creditLimit: "5000.00",
      currentBalance: "450.00",
    },
    {
      organizationId: org.id,
      customerCode: "CUST-007",
      name: "Suresh Commercial Enterprises",
      companyName: "Suresh Enterprises LLP",
      area: "SIDCO Industrial Estate",
      phone: "9842112233",
      email: "accounts@sureshenterprises.in",
      gstin: "33CCCCC3333C1Z3",
      billingAddress: "Plot 42, SIDCO Industrial Estate, Kurichi",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641021",
      creditLimit: "100000.00",
      currentBalance: "28900.00",
    },
  ];

  const insertedCustomers = await db.insert(customers).values(customerRecords).returning();
  console.log(`Created ${insertedCustomers.length} generic customers with diverse Khata balances.`);

  console.log("\n=== 5. SEEDING GENERIC PRODUCT CATALOG & STOCK LEDGER ===");
  const productRecords = [
    // --- Grains & Staples ---
    {
      organizationId: org.id,
      barcode: "8901030382910",
      sku: "RICE-BAS-05KG",
      name: "Basmati Classic Biryani Rice 5kg",
      hsnSac: "1006",
      unitOfMeasure: "BAG",
      purchasePrice: "390.00",
      sellingPrice: "480.00",
      taxPercent: "5.00",
      currentStock: "50.00",
      minStockAlert: "10.00",
    },
    {
      organizationId: org.id,
      barcode: "8906677889900",
      sku: "ATTA-CHAKKI-10KG",
      name: "Aashirvaad Whole Wheat Atta 10kg",
      hsnSac: "1101",
      unitOfMeasure: "BAG",
      purchasePrice: "370.00",
      sellingPrice: "445.00",
      taxPercent: "5.00",
      currentStock: "40.00",
      minStockAlert: "10.00",
    },
    {
      organizationId: org.id,
      barcode: "8909876543210",
      sku: "SUGAR-CRYSTAL-1KG",
      name: "Premium White Crystal Sugar 1kg",
      hsnSac: "1701",
      unitOfMeasure: "KG",
      purchasePrice: "38.00",
      sellingPrice: "48.00",
      taxPercent: "5.00",
      currentStock: "120.00",
      minStockAlert: "25.00",
    },
    {
      organizationId: org.id,
      barcode: "8905544332211",
      sku: "DAL-TOOR-01KG",
      name: "Toor Dal Grade-A Unpolished 1kg",
      hsnSac: "0713",
      unitOfMeasure: "KG",
      purchasePrice: "135.00",
      sellingPrice: "165.00",
      taxPercent: "0.00", // Exempt pulse
      currentStock: "65.00",
      minStockAlert: "15.00",
    },
    {
      organizationId: org.id,
      barcode: "8901234567890",
      sku: "OIL-SUN-01L",
      name: "Gold Winner Sunflower Cooking Oil 1L",
      hsnSac: "1512",
      unitOfMeasure: "LTR",
      purchasePrice: "118.00",
      sellingPrice: "142.00",
      taxPercent: "5.00",
      currentStock: "90.00",
      minStockAlert: "20.00",
    },

    // --- Dairy, Beverages & Snacks ---
    {
      organizationId: org.id,
      barcode: "8901058852331",
      sku: "TEA-TATA-500G",
      name: "Tata Tea Gold Premium Blend 500g",
      hsnSac: "0902",
      unitOfMeasure: "PACK",
      purchasePrice: "260.00",
      sellingPrice: "320.00",
      taxPercent: "5.00",
      currentStock: "35.00",
      minStockAlert: "8.00",
    },
    {
      organizationId: org.id,
      barcode: "8901058000411",
      sku: "COF-NESC-100G",
      name: "Nescafe Classic Instant Coffee 100g",
      hsnSac: "2101",
      unitOfMeasure: "BOTTLE",
      purchasePrice: "240.00",
      sellingPrice: "295.00",
      taxPercent: "18.00",
      currentStock: "25.00",
      minStockAlert: "6.00",
    },
    {
      organizationId: org.id,
      barcode: "8901233024842",
      sku: "CHOC-SILK-150G",
      name: "Cadbury Dairy Milk Silk Chocolate 150g",
      hsnSac: "1806",
      unitOfMeasure: "PCS",
      purchasePrice: "140.00",
      sellingPrice: "175.00",
      taxPercent: "18.00",
      currentStock: "45.00",
      minStockAlert: "10.00",
    },
    {
      organizationId: org.id,
      barcode: "8901063142211",
      sku: "BIS-GOOD-600G",
      name: "Britannia Good Day Butter Cookies 600g",
      hsnSac: "1905",
      unitOfMeasure: "PACK",
      purchasePrice: "95.00",
      sellingPrice: "120.00",
      taxPercent: "18.00",
      currentStock: "4.00", // LOW STOCK TEST (< 5)
      minStockAlert: "5.00",
    },
    {
      organizationId: org.id,
      barcode: "8901491101830",
      sku: "SNK-LAYS-50G",
      name: "Lay's Classic Salted Potato Chips 50g",
      hsnSac: "2005",
      unitOfMeasure: "PACK",
      purchasePrice: "15.00",
      sellingPrice: "20.00",
      taxPercent: "12.00",
      currentStock: "80.00",
      minStockAlert: "15.00",
    },

    // --- Personal Care & Hygiene ---
    {
      organizationId: org.id,
      barcode: "8901030004111",
      sku: "SOAP-DOVE-100G",
      name: "Dove Deep Moisture Bathing Bar 100g",
      hsnSac: "3401",
      unitOfMeasure: "PCS",
      purchasePrice: "52.00",
      sellingPrice: "65.00",
      taxPercent: "18.00",
      currentStock: "60.00",
      minStockAlert: "12.00",
    },
    {
      organizationId: org.id,
      barcode: "8901030383125",
      sku: "SOAP-LUX-100G",
      name: "Lux Velvet Touch Rose Beauty Soap 100g",
      hsnSac: "3401",
      unitOfMeasure: "PCS",
      purchasePrice: "32.00",
      sellingPrice: "40.00",
      taxPercent: "18.00",
      currentStock: "15.00", // MODERATE STOCK (Test adding up to 15)
      minStockAlert: "5.00",
    },
    {
      organizationId: org.id,
      barcode: "8901117001012",
      sku: "HYG-DETT-250ML",
      name: "Dettol Antiseptic Liquid 250ml",
      hsnSac: "3004",
      unitOfMeasure: "BOTTLE",
      purchasePrice: "108.00",
      sellingPrice: "135.00",
      taxPercent: "12.00",
      currentStock: "30.00",
      minStockAlert: "6.00",
    },
    {
      organizationId: org.id,
      barcode: "8901314010321",
      sku: "ORAL-COLG-150G",
      name: "Colgate MaxFresh Spicy Fresh Gel 150g",
      hsnSac: "3306",
      unitOfMeasure: "PCS",
      purchasePrice: "88.00",
      sellingPrice: "110.00",
      taxPercent: "18.00",
      currentStock: "55.00",
      minStockAlert: "10.00",
    },

    // --- Cleaning & Household ---
    {
      organizationId: org.id,
      barcode: "8901030612111",
      sku: "DET-SURF-02KG",
      name: "Surf Excel Matic Front Load Detergent 2kg",
      hsnSac: "3402",
      unitOfMeasure: "PACK",
      purchasePrice: "345.00",
      sellingPrice: "430.00",
      taxPercent: "18.00",
      currentStock: "20.00",
      minStockAlert: "5.00",
    },
    {
      organizationId: org.id,
      barcode: "8901030365111",
      sku: "CLN-VIM-750ML",
      name: "Vim Dishwash Gel Lemon 750ml",
      hsnSac: "3402",
      unitOfMeasure: "BOTTLE",
      purchasePrice: "124.00",
      sellingPrice: "155.00",
      taxPercent: "18.00",
      currentStock: "40.00",
      minStockAlert: "8.00",
    },
    {
      organizationId: org.id,
      barcode: "8901030882199",
      sku: "DET-ARIL-POD18",
      name: "Ariel 3-in-1 Detergent Pods 18ct",
      hsnSac: "3402",
      unitOfMeasure: "BOX",
      purchasePrice: "399.00",
      sellingPrice: "499.00",
      taxPercent: "18.00",
      currentStock: "0.00", // OUT OF STOCK TEST (0 stock, strictly blocked from billing)
      minStockAlert: "5.00",
    },
    {
      organizationId: org.id,
      barcode: "8901023011122",
      sku: "AIR-GODR-10G",
      name: "Godrej Aer Pocket Bathroom Fragrance 10g",
      hsnSac: "3307",
      unitOfMeasure: "PCS",
      purchasePrice: "42.00",
      sellingPrice: "55.00",
      taxPercent: "18.00",
      currentStock: "50.00",
      minStockAlert: "10.00",
    },
  ];

  const insertedProducts = await db.insert(products).values(productRecords).returning();

  for (const prod of insertedProducts) {
    if (Number(prod.currentStock) > 0) {
      await db.insert(stockMovements).values({
        organizationId: org.id,
        productId: prod.id,
        movementType: "PURCHASE_INWARD",
        quantityDelta: prod.currentStock,
        unitCost: prod.purchasePrice,
        balanceAfterMovement: prod.currentStock,
        notes: "Opening inventory stock inward",
        createdBy: adminUser.id,
      });
    }
  }

  console.log(`Created ${insertedProducts.length} generic products across all retail categories:`);
  console.log("  - Out-of-Stock test product: 'Ariel 3-in-1 Detergent Pods 18ct' (0 stock)");
  console.log("  - Low-Stock test product: 'Britannia Good Day Butter Cookies 600g' (4 stock)");
  console.log("  - Standard test product: 'Lux Velvet Touch Rose Beauty Soap 100g' (15 stock)");

  console.log("\n=== 6. SEEDING SAMPLE INVOICES & PAYMENTS FOR DASHBOARD & REPORTS ===");
  const walkInCust = insertedCustomers.find((c) => c.customerCode === "CUST-001")!;
  const sharmaCust = insertedCustomers.find((c) => c.customerCode === "CUST-002")!;
  const priyaCust = insertedCustomers.find((c) => c.customerCode === "CUST-003")!;

  const basmatiProd = insertedProducts.find((p) => p.sku === "RICE-BAS-05KG")!;
  const attaProd = insertedProducts.find((p) => p.sku === "ATTA-CHAKKI-10KG")!;
  const teaProd = insertedProducts.find((p) => p.sku === "TEA-TATA-500G")!;
  const doveProd = insertedProducts.find((p) => p.sku === "SOAP-DOVE-100G")!;

  const today = new Date().toISOString().split("T")[0];

  // Sample Invoice 1: Counter Walk-in Sale (Paid in Full, Cash)
  const [inv1] = await db
    .insert(invoices)
    .values({
      organizationId: org.id,
      customerId: walkInCust.id,
      invoiceType: "TAX_INVOICE",
      invoiceNumber: "MSM-2026-1001",
      invoiceDate: today,
      status: "PAID",
      customerSnapshot: walkInCust,
      sellerSnapshot: org,
      subtotal: "471.18",
      discountAmount: "0.00",
      taxableAmount: "471.18",
      cgstAmount: "29.41",
      sgstAmount: "29.41",
      igstAmount: "0.00",
      totalTaxAmount: "58.82",
      roundOff: "0.00",
      grandTotal: "530.00",
      paidAmount: "530.00",
      balanceAmount: "0.00",
      notes: "Walk-in counter sale",
    })
    .returning();

  await db.insert(invoiceItems).values([
    {
      invoiceId: inv1.id,
      productId: teaProd.id,
      itemName: teaProd.name,
      hsnSac: teaProd.hsnSac,
      unitOfMeasure: teaProd.unitOfMeasure,
      quantity: "1.00",
      unitCost: teaProd.purchasePrice,
      unitPrice: teaProd.sellingPrice,
      discountPercent: "0.00",
      discountAmount: "0.00",
      taxableValue: "304.76",
      taxPercent: "5.00",
      cgstRate: "2.50",
      cgstAmount: "7.62",
      sgstRate: "2.50",
      sgstAmount: "7.62",
      igstRate: "0.00",
      igstAmount: "0.00",
      totalAmount: "320.00",
    },
    {
      invoiceId: inv1.id,
      productId: doveProd.id,
      itemName: doveProd.name,
      hsnSac: doveProd.hsnSac,
      unitOfMeasure: doveProd.unitOfMeasure,
      quantity: "3.00",
      unitCost: doveProd.purchasePrice,
      unitPrice: doveProd.sellingPrice,
      discountPercent: "0.00",
      discountAmount: "0.00",
      taxableValue: "165.25",
      taxPercent: "18.00",
      cgstRate: "9.00",
      cgstAmount: "14.87",
      sgstRate: "9.00",
      sgstAmount: "14.87",
      igstRate: "0.00",
      igstAmount: "0.00",
      totalAmount: "195.00",
    },
  ]);

  await db.insert(payments).values({
    organizationId: org.id,
    invoiceId: inv1.id,
    customerId: walkInCust.id,
    paymentNumber: "PAY-MSM-2026-1001",
    paymentDate: today,
    amount: "530.00",
    paymentMode: "CASH",
    notes: "Counter cash payment",
  });

  // Sample Invoice 2: Wholesale B2B to Sharma Kirana (Partially Paid with Khata Balance)
  const [inv2] = await db
    .insert(invoices)
    .values({
      organizationId: org.id,
      customerId: sharmaCust.id,
      invoiceType: "TAX_INVOICE",
      invoiceNumber: "MSM-2026-1002",
      invoiceDate: today,
      status: "PARTIALLY_PAID",
      customerSnapshot: sharmaCust,
      sellerSnapshot: org,
      subtotal: "4471.43",
      discountAmount: "0.00",
      taxableAmount: "4471.43",
      cgstAmount: "111.79",
      sgstAmount: "111.79",
      igstAmount: "0.00",
      totalTaxAmount: "223.57",
      roundOff: "0.00",
      grandTotal: "4695.00",
      paidAmount: "2000.00",
      balanceAmount: "2695.00",
      notes: "Wholesale delivery with credit terms",
    })
    .returning();

  await db.insert(invoiceItems).values([
    {
      invoiceId: inv2.id,
      productId: basmatiProd.id,
      itemName: basmatiProd.name,
      hsnSac: basmatiProd.hsnSac,
      unitOfMeasure: basmatiProd.unitOfMeasure,
      quantity: "5.00",
      unitCost: basmatiProd.purchasePrice,
      unitPrice: basmatiProd.sellingPrice,
      discountPercent: "0.00",
      discountAmount: "0.00",
      taxableValue: "2285.71",
      taxPercent: "5.00",
      cgstRate: "2.50",
      cgstAmount: "57.14",
      sgstRate: "2.50",
      sgstAmount: "57.14",
      igstRate: "0.00",
      igstAmount: "0.00",
      totalAmount: "2400.00",
    },
    {
      invoiceId: inv2.id,
      productId: attaProd.id,
      itemName: attaProd.name,
      hsnSac: attaProd.hsnSac,
      unitOfMeasure: attaProd.unitOfMeasure,
      quantity: "5.00",
      unitCost: attaProd.purchasePrice,
      unitPrice: attaProd.sellingPrice,
      discountPercent: "0.00",
      discountAmount: "0.00",
      taxableValue: "2119.05",
      taxPercent: "5.00",
      cgstRate: "2.50",
      cgstAmount: "52.98",
      sgstRate: "2.50",
      sgstAmount: "52.98",
      igstRate: "0.00",
      igstAmount: "0.00",
      totalAmount: "2225.00",
    },
  ]);

  await db.insert(payments).values({
    organizationId: org.id,
    invoiceId: inv2.id,
    customerId: sharmaCust.id,
    paymentNumber: "PAY-MSM-2026-1002",
    paymentDate: today,
    amount: "2000.00",
    paymentMode: "UPI",
    notes: "Part payment via Google Pay",
  });

  // Update org next invoice sequence to 1003
  await db
    .update(organizations)
    .set({ nextInvoiceNumber: 1003 })
    .where(sql`id = ${org.id}`);

  console.log("Created 2 Initial Invoices & Payment Ledger entries for Dashboard statistics.");

  console.log("\n=======================================================");
  console.log("🎉 DATABASE CLEANUP & GENERIC SEEDING COMPLETED 100%!");
  console.log("=======================================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});

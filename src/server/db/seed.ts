import { db } from "./index";
import { organizations, users, customers, products, stockMovements } from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // 1. Create Organization (Sri Hari Traders)
  const [org] = await db
    .insert(organizations)
    .values({
      legalName: "Sri Hari Traders Pvt Ltd",
      tradeName: "Sri Hari Traders",
      gstin: "33AAAAA0000A1Z5",
      pan: "AAAAA0000A",
      email: "info@sriharitraders.com",
      phonePrimary: "9876543210",
      phoneSecondary: "9843210987",
      upiVpa: "sriharitraders@okaxis",
      addressLine: "123 Bazaar Street, Gandhipuram",
      city: "Coimbatore",
      state: "Tamil Nadu",
      stateCode: "33",
      pinCode: "641012",
      invoicePrefix: "SHT-2026-",
      nextInvoiceNumber: 101,
      thermalHeader: "SRI HARI TRADERS\n123 Bazaar Street, Coimbatore\nGSTIN: 33AAAAA0000A1Z5\nMob: 9876543210",
      thermalFooter: "Thank you for shopping with Sri Hari Traders!\nGoods once sold cannot be returned without bill.",
    })
    .returning();

  console.log(`Created Organization: ${org.legalName} (${org.id})`);

  // 2. Create Users
  const passwordHash = await bcrypt.hash("admin123", 10);
  const [adminUser] = await db
    .insert(users)
    .values([
      {
        organizationId: org.id,
        email: "admin@srihari.com",
        fullName: "Dhamodharan (Admin)",
        phone: "9876543210",
        passwordHash,
        role: "ORG_ADMIN",
      },
      {
        organizationId: org.id,
        email: "cashier@srihari.com",
        fullName: "Ramesh Cashier",
        phone: "9876543211",
        passwordHash,
        role: "BILLING_CASHIER",
      },
    ])
    .returning();

  console.log(`Created Admin user: admin@srihari.com / admin123`);

  // 3. Create Customers (with Khata balances)
  const insertedCustomers = await db
    .insert(customers)
    .values([
      {
        organizationId: org.id,
        name: "Murugan Provisions",
        companyName: "Murugan Retail Stores",
        gstin: "33ABCDE1234F1Z5",
        phone: "9840123456",
        email: "murugan@provisions.com",
        billingAddress: "45 Cross Cut Road, RS Puram",
        city: "Coimbatore",
        state: "Tamil Nadu",
        stateCode: "33",
        pinCode: "641002",
        creditLimit: "50000.00",
        currentBalance: "12450.00", // Khata balance
      },
      {
        organizationId: org.id,
        name: "Kannan Textiles",
        companyName: "Kannan Silks & Garments",
        gstin: "33XYZAB9876C1Z2",
        phone: "9842198765",
        email: "kannan@textiles.com",
        billingAddress: "88 Town Hall Road",
        city: "Coimbatore",
        state: "Tamil Nadu",
        stateCode: "33",
        pinCode: "641001",
        creditLimit: "75000.00",
        currentBalance: "0.00",
      },
      {
        organizationId: org.id,
        name: "Anand Walk-in Customer",
        phone: "9944112233",
        billingAddress: "Peelamedu",
        city: "Coimbatore",
        state: "Tamil Nadu",
        stateCode: "33",
        pinCode: "641004",
        creditLimit: "0.00",
        currentBalance: "0.00",
      },
    ])
    .returning();

  console.log(`Created ${insertedCustomers.length} initial customers.`);

  // 4. Create Products & Initial Stock Ledger
  const initialProducts = [
    {
      organizationId: org.id,
      barcode: "8901030382910",
      sku: "RICE-BAS-25KG",
      name: "Royal Basmati Rice 25kg Bag",
      hsnSac: "1006",
      unitOfMeasure: "BAG",
      purchasePrice: "1850.00",
      sellingPrice: "2250.00",
      taxPercent: "5.00",
      currentStock: "45.00",
      minStockAlert: "10.00",
    },
    {
      organizationId: org.id,
      barcode: "8901234567890",
      sku: "OIL-SUN-15L",
      name: "Gold Winner Sunflower Oil 15L Tin",
      hsnSac: "1512",
      unitOfMeasure: "TIN",
      purchasePrice: "1620.00",
      sellingPrice: "1850.00",
      taxPercent: "5.00",
      currentStock: "30.00",
      minStockAlert: "5.00",
    },
    {
      organizationId: org.id,
      barcode: "8909876543210",
      sku: "SUGAR-PREM-50KG",
      name: "Refined White Sugar 50kg Sack",
      hsnSac: "1701",
      unitOfMeasure: "BAG",
      purchasePrice: "1900.00",
      sellingPrice: "2150.00",
      taxPercent: "5.00",
      currentStock: "60.00",
      minStockAlert: "15.00",
    },
    {
      organizationId: org.id,
      barcode: "8905544332211",
      sku: "TOOR-DAL-30KG",
      name: "Premium Toor Dal Fatka 30kg",
      hsnSac: "0713",
      unitOfMeasure: "BAG",
      purchasePrice: "3600.00",
      sellingPrice: "4100.00",
      taxPercent: "0.00", // Exempt pulse
      currentStock: "25.00",
      minStockAlert: "8.00",
    },
    {
      organizationId: org.id,
      barcode: "8906677889900",
      sku: "ATTA-CHAKKI-10KG",
      name: "Aashirvaad Shudh Chakki Atta 10kg",
      hsnSac: "1101",
      unitOfMeasure: "BAG",
      purchasePrice: "380.00",
      sellingPrice: "460.00",
      taxPercent: "5.00",
      currentStock: "80.00",
      minStockAlert: "20.00",
    },
  ];

  const insertedProducts = await db.insert(products).values(initialProducts).returning();

  for (const prod of insertedProducts) {
    await db.insert(stockMovements).values({
      organizationId: org.id,
      productId: prod.id,
      movementType: "PURCHASE_INWARD",
      quantityDelta: prod.currentStock,
      unitCost: prod.purchasePrice,
      balanceAfterMovement: prod.currentStock,
      notes: "Opening stock balance migration",
      createdBy: adminUser.id,
    });
  }

  console.log(`Created ${insertedProducts.length} products with initial stock movements.`);
  console.log("Seeding completed successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

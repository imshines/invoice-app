import { db } from "./src/server/db";
import { users, products, organizations, invoices, invoiceItems } from "./src/server/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== STARTING RIGOROUS AUTH & INVENTORY TEST SUITE ===");

  // 0. Ensure dev server is running and database is populated
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  console.log("1. Healthcheck Status:", healthRes.status);
  const healthData = await healthRes.json();
  console.log("   Healthcheck Response:", healthData);

  // 1. Test Unauthenticated Access to /api/auth/me
  console.log("\n--- TEST: Unauthenticated Access to /api/auth/me ---");
  const unauthMe = await fetch(`${BASE_URL}/api/auth/me`);
  const unauthMeData = await unauthMe.json();
  console.log("Unauthenticated /api/auth/me user is:", unauthMeData.user);
  if (unauthMeData.user === null) {
    console.log("✅ PASS: Without session cookie, user is strictly null (no admin fallback!)");
  } else {
    console.error("❌ FAIL: User was not null without session cookie!");
    process.exit(1);
  }

  // 2. Test Invalid Credentials
  console.log("\n--- TEST: Invalid Credentials Login ---");
  const badLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@srihari.com", password: "wrongpassword" }),
  });
  console.log("Bad login status:", badLogin.status);
  if (badLogin.status === 401) {
    console.log("✅ PASS: Bad password returned 401 Unauthorized");
  } else {
    console.error("❌ FAIL: Bad password did not return 401!");
    process.exit(1);
  }

  // 3. Test Admin Login
  console.log("\n--- TEST: Admin Login ---");
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@srihari.com", password: "admin123" }),
  });
  const adminCookie = adminLogin.headers.get("set-cookie") || "";
  const adminData = await adminLogin.json();
  console.log("Admin login status:", adminLogin.status, "User:", adminData.user);
  console.log("Admin cookie received:", adminCookie ? "YES" : "NO");

  if (adminLogin.status === 200 && adminData.user.role === "ORG_ADMIN" && adminCookie) {
    console.log("✅ PASS: Admin successfully authenticated with ORG_ADMIN role");
  } else {
    console.error("❌ FAIL: Admin login failed");
    process.exit(1);
  }

  const adminSessionCookie = adminCookie.split(";")[0];

  // 4. Test Admin Access to /api/users
  console.log("\n--- TEST: Admin Access to /api/users ---");
  const adminUsersRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { Cookie: adminSessionCookie },
  });
  console.log("Admin /api/users status:", adminUsersRes.status);
  const userList = await adminUsersRes.json();
  console.log("Admin fetched user count:", userList.length);
  if (adminUsersRes.status === 200 && Array.isArray(userList)) {
    console.log("✅ PASS: Admin successfully accessed user accounts");
  } else {
    console.error("❌ FAIL: Admin could not access users");
    process.exit(1);
  }

  // 5. Test Cashier Login & RBAC Enforcement
  console.log("\n--- TEST: Cashier Login & RBAC Forbidden Endpoints ---");
  const cashierLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "cashier@srihari.com", password: "admin123" }),
  });
  const cashierCookie = cashierLogin.headers.get("set-cookie") || "";
  const cashierData = await cashierLogin.json();
  console.log("Cashier login status:", cashierLogin.status, "User:", cashierData.user);

  const cashierSessionCookie = cashierCookie.split(";")[0];

  // Cashier tries to access /api/users (Admin only)
  const cashierUsersRes = await fetch(`${BASE_URL}/api/users`, {
    headers: { Cookie: cashierSessionCookie },
  });
  console.log("Cashier /api/users status:", cashierUsersRes.status);
  const cashierUsersData = await cashierUsersRes.json();
  console.log("Cashier /api/users response:", cashierUsersData);
  if (cashierUsersRes.status === 403) {
    console.log("✅ PASS: Cashier is strictly FORBIDDEN (403) from accessing user accounts!");
  } else {
    console.error("❌ FAIL: Cashier was not blocked from /api/users!");
    process.exit(1);
  }

  // Cashier tries to modify company profile (Admin only)
  const cashierCompanyRes = await fetch(`${BASE_URL}/api/organization/current`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cashierSessionCookie },
    body: JSON.stringify({ company: "Hacked Company Name" }),
  });
  console.log("Cashier /api/organization/current status:", cashierCompanyRes.status);
  const cashierCompanyData = await cashierCompanyRes.json();
  console.log("Cashier /api/organization/current response:", cashierCompanyData);
  if (cashierCompanyRes.status === 403) {
    console.log("✅ PASS: Cashier is strictly FORBIDDEN (403) from modifying company profile!");
  } else {
    console.error("❌ FAIL: Cashier was not blocked from editing company profile!");
    process.exit(1);
  }

  // Cashier tries to add new product (Admin/Manager only)
  const cashierProductAdd = await fetch(`${BASE_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cashierSessionCookie },
    body: JSON.stringify({
      name: "Cashier Unauthorized Product",
      unitOfMeasure: "PCS",
      sellingPrice: "100.00",
    }),
  });
  console.log("Cashier /api/products POST status:", cashierProductAdd.status);
  if (cashierProductAdd.status === 403) {
    console.log("✅ PASS: Cashier is strictly FORBIDDEN (403) from creating products in catalog!");
  } else {
    console.error("❌ FAIL: Cashier was not blocked from creating products!");
    process.exit(1);
  }

  // 6. Test STRICT Negative Inventory Enforcement
  console.log("\n--- TEST: Negative Inventory Prevention & Stock Validation ---");

  // Find Lux Soap Blue (current stock should be 8.00)
  const [soap] = await db.select().from(products).where(eq(products.name, "Lux Soap Blue")).limit(1);
  console.log("Current product:", soap.name, "Current stock:", soap.currentStock);

  // Set stock to exactly 8.00 for the test
  await db.update(products).set({ currentStock: "8.00" }).where(eq(products.id, soap.id));
  console.log("Reset Lux Soap Blue stock to exactly 8.00 PCS");

  // User tries to generate invoice with quantity 10 (exceeding stock of 8)
  console.log("\nAttempting to invoice quantity: 10 for product with stock: 8.00...");
  const overOrderRes = await fetch(`${BASE_URL}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cashierSessionCookie },
    body: JSON.stringify({
      customerName: "Stock Test Buyer",
      customerPhone: "9988776655",
      items: [
        {
          productId: soap.id,
          name: soap.name,
          quantity: 10,
          unitPrice: Number(soap.sellingPrice),
        },
      ],
      paymentMode: "CASH",
      paidAmount: 200,
    }),
  });

  console.log("Over-order HTTP Status:", overOrderRes.status);
  const overOrderData = await overOrderRes.json();
  console.log("Over-order API Response:", overOrderData);

  if (overOrderRes.status === 400 && overOrderData.error.includes("Insufficient stock")) {
    console.log("✅ PASS: API rejected order of 10 with 400 Bad Request & clear stock message!");
  } else {
    console.error("❌ FAIL: API did not reject over-order!");
    process.exit(1);
  }

  // Verify stock in PostgreSQL did NOT change or become negative (-2)
  const [soapAfterFailedOrder] = await db
    .select()
    .from(products)
    .where(eq(products.id, soap.id))
    .limit(1);
  console.log(
    "Stock in PostgreSQL after failed over-order:",
    soapAfterFailedOrder.currentStock,
    "(Expected: 8.00, NOT -2.00)"
  );
  if (Number(soapAfterFailedOrder.currentStock) === 8) {
    console.log("✅ PASS: Stock in PostgreSQL remains safely intact at 8.00!");
  } else {
    console.error("❌ FAIL: Stock was modified or went negative!");
    process.exit(1);
  }

  // Now create a valid invoice for quantity 3 (within available stock of 8)
  console.log("\nAttempting valid invoice for quantity: 3 (stock: 8.00)...");
  const validOrderRes = await fetch(`${BASE_URL}/api/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cashierSessionCookie },
    body: JSON.stringify({
      customerName: "Valid Order Buyer",
      customerPhone: "9988776655",
      items: [
        {
          productId: soap.id,
          name: soap.name,
          quantity: 3,
          unitPrice: Number(soap.sellingPrice),
        },
      ],
      paymentMode: "CASH",
      paidAmount: 100,
    }),
  });

  console.log("Valid order HTTP Status:", validOrderRes.status);
  const validOrderData = await validOrderRes.json();
  console.log("Valid order invoice created:", validOrderData.invoice?.invoiceNumber);

  if (validOrderRes.status === 201) {
    console.log("✅ PASS: Valid invoice created successfully!");
  } else {
    console.error("❌ FAIL: Valid invoice creation failed!");
    process.exit(1);
  }

  // Verify stock is now exactly 8 - 3 = 5
  const [soapAfterValidOrder] = await db
    .select()
    .from(products)
    .where(eq(products.id, soap.id))
    .limit(1);
  console.log(
    "Stock in PostgreSQL after order of 3:",
    soapAfterValidOrder.currentStock,
    "(Expected: 5.00)"
  );
  if (Number(soapAfterValidOrder.currentStock) === 5) {
    console.log("✅ PASS: Stock was accurately decremented to 5.00!");
  } else {
    console.error("❌ FAIL: Stock decrement calculation error!");
    process.exit(1);
  }

  // Reset stock back to 8.00 for clean state
  await db.update(products).set({ currentStock: "8.00" }).where(eq(products.id, soap.id));
  console.log("\nLux Soap Blue stock reset back to 8.00 for normal operation.");

  console.log("\n=======================================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ZERO BUGS DETECTED.");
  console.log("=======================================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed with error:", err);
  process.exit(1);
});

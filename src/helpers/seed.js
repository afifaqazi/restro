import { db } from "../firebase";
import { setDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { setCounter } from "./idGenerator";

function ts(dateStr) {
  return Timestamp.fromDate(new Date(dateStr));
}

function now() {
  return serverTimestamp();
}

const USERS = [
  { email: "admin@restro.com", name: "Admin User", phone: "0300-1234567", type: "admin", status: true },
  { email: "manager@restro.com", name: "Sara Manager", phone: "0301-2345678", type: "manager", status: true },
  { email: "waiter@restro.com", name: "Ali Waiter", phone: "0302-3456789", type: "waiter", status: true },
];

const EMPLOYEES = [
  { name: "Ahmed Khan", email: "ahmed@restro.com", phone: "0310-1111111", type: "waiter", customType: "", salary: 25000, joiningDate: ts("2024-01-15"), resigningDate: null, notes: "Senior waiter", status: true },
  { name: "Bilal Raza", email: "bilal@restro.com", phone: "0311-2222222", type: "delivery", customType: "", salary: 20000, joiningDate: ts("2024-03-01"), resigningDate: null, notes: "Bike rider", status: true },
  { name: "Fatima Noor", email: "fatima@restro.com", phone: "0312-3333333", type: "staff", customType: "", salary: 22000, joiningDate: ts("2024-02-10"), resigningDate: null, notes: "Kitchen helper", status: true },
  { name: "Chacha Pervez", email: "", phone: "0313-4444444", type: "cleaning", customType: "", salary: 15000, joiningDate: ts("2023-06-01"), resigningDate: null, notes: "", status: true },
  { name: "Sana Malik", email: "sana@restro.com", phone: "0314-5555555", type: "custom", customType: "Cashier", salary: 28000, joiningDate: ts("2024-05-20"), resigningDate: null, notes: "Handles billing", status: true },
];

const MENU_CATEGORIES = [
  { name: "Appetizers", status: true },
  { name: "Main Course", status: true },
  { name: "BBQ", status: true },
  { name: "Beverages", status: true },
  { name: "Desserts", status: true },
];

const MENU_ITEMS_TEMPLATE = [
  { name: "Chicken Samosa", catIdx: 0, price: 80, description: "Crispy fried samosas" },
  { name: "Spring Rolls", catIdx: 0, price: 120, description: "Vegetable spring rolls" },
  { name: "Chicken Karahi", catIdx: 1, price: 1200, description: "Traditional karahi style chicken" },
  { name: "Mutton Biryani", catIdx: 1, price: 350, description: "Aromatic layered rice with mutton" },
  { name: "Dal Makhani", catIdx: 1, price: 450, description: "Creamy black lentils" },
  { name: "Chicken Tikka", catIdx: 2, price: 650, description: "Marinated and grilled chicken pieces" },
  { name: "Seekh Kebab", catIdx: 2, price: 550, description: "Minced meat kebabs on skewers" },
  { name: "Mint Lemonade", catIdx: 3, price: 150, description: "Fresh mint lemonade" },
  { name: "Chai", catIdx: 3, price: 80, description: "Doodh patti chai" },
  { name: "Gulab Jamun", catIdx: 4, price: 200, description: "Sweet fried dumplings in syrup" },
  { name: "Kheer", catIdx: 4, price: 180, description: "Rice pudding with cardamom" },
];

const TABLES = [
  { label: "T-01", capacity: 4, tableStatus: "idle", currentOrderId: null, status: true },
  { label: "T-02", capacity: 4, tableStatus: "idle", currentOrderId: null, status: true },
  { label: "T-03", capacity: 6, tableStatus: "idle", currentOrderId: null, status: true },
  { label: "T-04", capacity: 2, tableStatus: "idle", currentOrderId: null, status: true },
  { label: "T-05", capacity: 8, tableStatus: "idle", currentOrderId: null, status: true },
  { label: "T-06", capacity: 4, tableStatus: "idle", currentOrderId: null, status: true },
];

const CUSTOMERS = [
  { name: "Hassan Ali", phone: "0320-1111111", email: "hassan@gmail.com", address: "Gulshan Block 5", totalOrders: 0, totalSpent: 0, notes: "Regular customer", status: true },
  { name: "Ayesha Siddiqui", phone: "0321-2222222", email: "ayesha@gmail.com", address: "DHA Phase 2", totalOrders: 0, totalSpent: 0, notes: "", status: true },
  { name: "Usman Tariq", phone: "0322-3333333", email: "", address: "Clifton Block 9", totalOrders: 0, totalSpent: 0, notes: "Prefers spicy food", status: true },
];

const EXPENSES = [
  { title: "Cooking Oil (5L)", category: "supplies", amount: 3500, date: ts("2025-06-20"), notes: "Monthly purchase", addedBy: "Admin User", status: true },
  { title: "Electricity Bill - June", category: "utilities", amount: 18500, date: ts("2025-06-15"), notes: "", addedBy: "Admin User", status: true },
  { title: "Kitchen Faucet Repair", category: "maintenance", amount: 2000, date: ts("2025-06-18"), notes: "Plumber fixed leak", addedBy: "Sara Manager", status: true },
];

export async function runSeed(log) {
  log("🔧 Starting seed…", "log-info");

  const put = async (col, id, data) => {
    await setDoc(doc(db, col, id), { ...data, createdAt: now(), updatedAt: now() });
  };

  log("📋 Creating users…", "log-info");
  const userIds = [];
  for (let i = 0; i < USERS.length; i++) {
    const id = `USR-${String(i + 1).padStart(3, "0")}`;
    await put("users", id, USERS[i]);
    userIds.push(id);
  }
  await setCounter("users", USERS.length);
  log(`   ✓ ${USERS.length} users created (${userIds.join(", ")})`, "log-success");

  log("👥 Creating employees…", "log-info");
  const empIds = [];
  for (let i = 0; i < EMPLOYEES.length; i++) {
    const id = `EMP-${String(i + 1).padStart(3, "0")}`;
    await put("employees", id, EMPLOYEES[i]);
    empIds.push(id);
  }
  await setCounter("employees", EMPLOYEES.length);
  log(`   ✓ ${EMPLOYEES.length} employees created (${empIds.join(", ")})`, "log-success");

  log("📂 Creating menu categories…", "log-info");
  const catIds = [];
  for (let i = 0; i < MENU_CATEGORIES.length; i++) {
    const id = `CAT-${String(i + 1).padStart(3, "0")}`;
    await put("menu_categories", id, MENU_CATEGORIES[i]);
    catIds.push(id);
  }
  await setCounter("menu_categories", MENU_CATEGORIES.length);
  log(`   ✓ ${MENU_CATEGORIES.length} categories created (${catIds.join(", ")})`, "log-success");

  log("🍽️ Creating menu items…", "log-info");
  const menuItemIds = [];
  for (let i = 0; i < MENU_ITEMS_TEMPLATE.length; i++) {
    const id = `ITEM-${String(i + 1).padStart(3, "0")}`;
    const tmpl = MENU_ITEMS_TEMPLATE[i];
    await put("menu_items", id, {
      name: tmpl.name, categoryId: catIds[tmpl.catIdx], price: tmpl.price,
      description: tmpl.description, image: "", status: true,
    });
    menuItemIds.push(id);
  }
  await setCounter("menu_items", MENU_ITEMS_TEMPLATE.length);
  log(`   ✓ ${MENU_ITEMS_TEMPLATE.length} menu items created (${menuItemIds.join(", ")})`, "log-success");

  log("🪑 Creating tables…", "log-info");
  const tableIds = [];
  for (let i = 0; i < TABLES.length; i++) {
    const id = `TBL-${String(i + 1).padStart(3, "0")}`;
    await put("tables", id, TABLES[i]);
    tableIds.push(id);
  }
  await setCounter("tables", TABLES.length);
  log(`   ✓ ${TABLES.length} tables created (${tableIds.join(", ")})`, "log-success");

  log("👤 Creating customers…", "log-info");
  const custIds = [];
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const id = `CUST-${String(i + 1).padStart(3, "0")}`;
    await put("customers", id, CUSTOMERS[i]);
    custIds.push(id);
  }
  await setCounter("customers", CUSTOMERS.length);
  log(`   ✓ ${CUSTOMERS.length} customers created (${custIds.join(", ")})`, "log-success");

  log("📦 Creating sample orders…", "log-info");
  const sampleOrders = [
    {
      orderNumber: "ORD-00001", type: "dine-in", orderStatus: "completed", tableId: tableIds[0],
      customerId: custIds[0], customerName: "Hassan Ali", customerPhone: "0320-1111111",
      items: [
        { menuItemId: menuItemIds[0], name: "Chicken Samosa", price: 80, qty: 3, subtotal: 240 },
        { menuItemId: menuItemIds[2], name: "Chicken Karahi", price: 1200, qty: 1, subtotal: 1200 },
      ],
      subtotal: 1440, tax: 0, discount: 0, total: 1440, paymentMethod: "cash", notes: "", status: true, completedAt: now(),
    },
    {
      orderNumber: "ORD-00002", type: "delivery", orderStatus: "completed", tableId: null,
      customerId: custIds[1], customerName: "Ayesha Siddiqui", customerPhone: "0321-2222222",
      items: [
        { menuItemId: menuItemIds[3], name: "Mutton Biryani", price: 350, qty: 2, subtotal: 700 },
        { menuItemId: menuItemIds[7], name: "Mint Lemonade", price: 150, qty: 2, subtotal: 300 },
      ],
      subtotal: 1000, tax: 0, discount: 0, total: 1000, paymentMethod: "card", notes: "Extra raita please", status: true, completedAt: now(),
    },
    {
      orderNumber: "ORD-00003", type: "dine-in", orderStatus: "pending", tableId: tableIds[2],
      customerId: null, customerName: "Walk-in", customerPhone: "",
      items: [
        { menuItemId: menuItemIds[5], name: "Chicken Tikka", price: 650, qty: 1, subtotal: 650 },
        { menuItemId: menuItemIds[8], name: "Chai", price: 80, qty: 2, subtotal: 160 },
      ],
      subtotal: 810, tax: 0, discount: 0, total: 810, paymentMethod: "", notes: "", status: true, completedAt: null,
    },
  ];
  for (let i = 0; i < sampleOrders.length; i++) {
    const id = `ORD-${String(i + 1).padStart(5, "0")}`;
    sampleOrders[i].orderNumber = id;
    await put("orders", id, sampleOrders[i]);
  }
  await setCounter("orders", sampleOrders.length);
  log(`   ✓ ${sampleOrders.length} orders created (ORD-00001 … ORD-00003)`, "log-success");

  log("💰 Creating expenses…", "log-info");
  for (let i = 0; i < EXPENSES.length; i++) {
    const id = `EXP-${String(i + 1).padStart(3, "0")}`;
    await put("expenses", id, EXPENSES[i]);
  }
  await setCounter("expenses", EXPENSES.length);
  log(`   ✓ ${EXPENSES.length} expenses created`, "log-success");

  log("📅 Creating sample reservation…", "log-info");
  await put("reservations", "RSV-001", {
    customerName: "Usman Tariq", customerPhone: "0322-3333333", customerId: custIds[2], tableId: tableIds[4],
    date: ts("2025-06-28T19:00:00"), partySize: 6, notes: "Birthday celebration", reservationStatus: "upcoming", status: true,
  });
  await setCounter("reservations", 1);
  log("   ✓ 1 reservation created (RSV-001)", "log-success");

  log("⚙️ Creating settings…", "log-info");
  await setDoc(doc(db, "settings", "general"), {
    restaurantName: "Restro POS", taxRate: 0, currency: "Rs.", updatedAt: now(),
  });
  log("   ✓ Settings saved", "log-success");

  log("", "");
  log("🎉 Seed complete! All document IDs are readable:", "log-success");
}

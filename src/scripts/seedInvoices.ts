import {
  collection,
  addDoc,
  getDocs,
  doc,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper function to generate current date string
const getCurrentDateString = (): string => {
  return format(new Date(), "EEEE, d MMMM yyyy HH:mm:ss", { locale: id });
};

// Helper to generate date string from specific date
const getDateString = (date: Date): string => {
  return format(date, "EEEE, d MMMM yyyy HH:mm:ss", { locale: id });
};

// User ID (boss user)
const USER_ID = "azGxJxnP36WVBy9LCH9g6p5KfWC3";

// Sample customer names
const customerNames = [
  "PT Tekstil Jaya",
  "CV Kain Indah",
  "Toko Kain Sejahtera",
  "UD Maju Bersama",
  "PT Garmen Nusantara",
  "CV Rajut Makmur",
  "Toko Kain Murah",
  "PT Fashion Indonesia",
  "CV Tekstil Modern",
  "UD Kain Berkah",
  "PT Rajut Sentosa",
  "CV Mode Indonesia",
  "Toko Busana Elite",
  "PT Kain Premium",
  "CV Textile Express",
];

interface Store {
  id: string;
  name: string;
  code: string;
}

interface Item {
  id: string;
  name: string;
  color: number;
  roll: number;
  storeId: string;
}

// Get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Fetch stores from Firestore
async function fetchStores(): Promise<Store[]> {
  console.log("📦 Fetching stores from Firestore...\n");

  const storesSnapshot = await getDocs(collection(db, "stores"));

  if (storesSnapshot.empty) {
    throw new Error(
      "No stores found! Please run 'npm run reset:stores' first."
    );
  }

  const stores: Store[] = storesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    code: doc.data().code,
  }));

  console.log(`   ✓ Found ${stores.length} stores:`);
  stores.forEach((store) => {
    console.log(`      - ${store.name} (${store.code})`);
  });
  console.log();

  return stores;
}

// Fetch items from Firestore
async function fetchItems(): Promise<Item[]> {
  console.log("📦 Fetching items from Firestore...\n");

  const itemsSnapshot = await getDocs(collection(db, "items"));

  if (itemsSnapshot.empty) {
    throw new Error("No items found! Please run 'npm run seed:items' first.");
  }

  const items: Item[] = itemsSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    color: doc.data().color,
    roll: doc.data().roll,
    storeId: doc.data().storeId,
  }));

  console.log(`   ✓ Found ${items.length} items\n`);

  return items;
}

// Generate invoice number
function generateInvoiceNumber(
  storeCode: string,
  sequence: number,
  date: Date = new Date()
): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const paddedSequence = sequence.toString().padStart(4, "0");
  return `${storeCode}-${month}${year}-${paddedSequence}`;
}

// Get invoice counter doc ID
function getInvoiceCounterDocId(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${year}`;
}

// Get next invoice number for store
async function getNextInvoiceNumber(
  storeId: string,
  storeCode: string,
  date: Date = new Date()
): Promise<string> {
  const counterDocId = getInvoiceCounterDocId(date);
  const counterDoc = doc(
    db,
    "stores",
    storeId,
    "invoiceCounters",
    counterDocId
  );

  return runTransaction(db, async (transaction) => {
    const counterSnap = await transaction.get(counterDoc);

    let nextSequence = 1;
    if (counterSnap.exists()) {
      nextSequence = (counterSnap.data().lastNumber || 0) + 1;
    }

    // Update sequence
    transaction.set(counterDoc, { lastNumber: nextSequence }, { merge: true });

    return generateInvoiceNumber(storeCode, nextSequence, date);
  });
}

// Create invoices
async function createInvoices(
  stores: Store[],
  items: Item[],
  countPerStore: number = 30
): Promise<void> {
  const totalCount = stores.length * countPerStore;
  console.log(
    `📝 Creating ${countPerStore} invoices per store (${totalCount} total)...\n`
  );

  const statuses: ("lunas" | "belum lunas" | "retur")[] = [
    "lunas",
    "belum lunas",
    "retur",
  ];

  const invoicesCreated: Array<{
    invoiceNumber: string;
    customer: string;
    store: string;
    status: string;
    total: number;
  }> = [];

  let overallCount = 0;

  // Create invoices for each store
  for (const store of stores) {
    console.log(
      `\n   Creating ${countPerStore} invoices for ${store.name} (${store.code})...`
    );

    // Get items for this store
    const storeItems = items.filter((item) => item.storeId === store.id);

    if (storeItems.length === 0) {
      console.log(
        `   ⚠️  No items found for store ${store.name}, skipping store...`
      );
      continue;
    }

    // Create invoices for this store
    for (let i = 0; i < countPerStore; i++) {
      overallCount++;

      // Generate random date within last 60 days
      const daysAgo = randomInt(0, 60);
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - daysAgo);

      // Select 2-5 random items for this invoice
      const numItems = Math.min(randomInt(2, 5), storeItems.length);
      const selectedItems = [];
      const usedItemIds = new Set<string>();

      for (let j = 0; j < numItems; j++) {
        let randomItemData;
        let attempts = 0;
        do {
          randomItemData = randomItem(storeItems);
          attempts++;
        } while (usedItemIds.has(randomItemData.id) && attempts < 20);

        if (!usedItemIds.has(randomItemData.id)) {
          usedItemIds.add(randomItemData.id);

          const roll = Math.min(randomInt(1, 5), randomItemData.roll);
          const yards: number[] = [];
          for (let k = 0; k < roll; k++) {
            yards.push(randomInt(10, 50)); // 10-50 yards per roll
          }

          const price = randomInt(50000, 150000); // 50k-150k per yard
          const totalYards = yards.reduce((sum, yard) => sum + yard, 0);
          const total = totalYards * price;

          selectedItems.push({
            itemId: randomItemData.id,
            name: randomItemData.name,
            color: randomItemData.color.toString(),
            roll: roll,
            yards: yards,
            price: price,
            total: total,
          });
        }
      }

      if (selectedItems.length === 0) {
        console.log(
          `   ⚠️  No items selected for invoice ${i + 1}, skipping...`
        );
        continue;
      }

      // Calculate totals
      const totalColors = new Set(selectedItems.map((item) => item.color)).size;
      const totalRoll = selectedItems.reduce((sum, item) => sum + item.roll, 0);
      const totalYard = selectedItems.reduce(
        (sum, item) => sum + item.yards.reduce((s, y) => s + y, 0),
        0
      );
      const grandTotal = selectedItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      // Random status
      const status = randomItem(statuses);

      // Customer name
      const customerName = randomItem(customerNames);

      // Generate invoice number with counter
      const invoiceNumber = await getNextInvoiceNumber(
        store.id,
        store.code,
        invoiceDate
      );

      const invoiceData = {
        invoiceNumber,
        storeId: store.id, // Add storeId
        customerName,
        createdBy: USER_ID,
        createdAt: getDateString(invoiceDate),
        updatedAt: getDateString(invoiceDate),
        totalColor: totalColors,
        totalRoll: totalRoll,
        totalYard: totalYard,
        grandTotal: grandTotal,
        status: status,
        notes: `Sample invoice for ${store.name}`,
        items: selectedItems,
      };

      await addDoc(collection(db, "invoices"), invoiceData);

      invoicesCreated.push({
        invoiceNumber,
        customer: customerName,
        store: `${store.name} (${store.code})`,
        status: status,
        total: grandTotal,
      });

      // Show progress every 10 invoices per store
      if ((i + 1) % 10 === 0) {
        console.log(
          `      ✓ Created ${i + 1}/${countPerStore} for ${store.code}`
        );
      }
    }

    console.log(`   ✓ Completed ${countPerStore} invoices for ${store.name}`);
  }

  console.log(`\n✓ Successfully created ${invoicesCreated.length} invoices!\n`);

  // Show summary by status
  console.log("📊 Summary by Status:");
  const statusCounts: { [key: string]: number } = {};
  invoicesCreated.forEach((invoice) => {
    statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
  });

  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`   ${status.padEnd(15)} : ${count} invoices`);
  });

  // Show summary by store
  console.log("\n📊 Summary by Store:");
  const storeCounts: { [key: string]: number } = {};
  invoicesCreated.forEach((invoice) => {
    storeCounts[invoice.store] = (storeCounts[invoice.store] || 0) + 1;
  });

  Object.entries(storeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([store, count]) => {
      console.log(`   ${store.padEnd(30)} : ${count} invoices`);
    });

  console.log("\n📊 Statistics:");
  const totals = invoicesCreated.map((i) => i.total);
  console.log(
    `   Total Revenue   : Rp ${totals
      .reduce((a, b) => a + b, 0)
      .toLocaleString()}`
  );
  console.log(
    `   Average Invoice : Rp ${Math.round(
      totals.reduce((a, b) => a + b, 0) / totals.length
    ).toLocaleString()}`
  );
  console.log(
    `   Min Invoice     : Rp ${Math.min(...totals).toLocaleString()}`
  );
  console.log(
    `   Max Invoice     : Rp ${Math.max(...totals).toLocaleString()}`
  );
}

// Main seeding function
async function seedInvoices() {
  try {
    console.log("\n=== INVOICE SEEDING SCRIPT ===\n");

    // Step 1: Fetch stores
    const stores = await fetchStores();

    // Step 2: Fetch items
    const items = await fetchItems();

    // Step 3: Create invoices (30 per store)
    await createInvoices(stores, items, 30);

    console.log("\n=== SEEDING COMPLETED SUCCESSFULLY! ===\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Run the seeding
seedInvoices()
  .then(() => {
    console.log("✅ All done! You can now close this process.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

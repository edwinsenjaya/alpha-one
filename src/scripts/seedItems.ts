import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper function to generate current date string
const getCurrentDateString = (): string => {
  return format(new Date(), "EEEE, d MMMM yyyy HH:mm:ss", { locale: id });
};

// User ID for all items
const USER_ID = "inYVBXXuoPgUKAI8LzSA";

// Store ID for all items
const STORE_ID = "gP3RZJcYoaZss4wQfRBM";

// Item names
const itemNames = [
  "Cotton",
  "Rayon Twill",
  "Polo Linen",
  "Cey",
  "Babydoll",
  "Deluxe Toubo",
  "Toyobo",
  "Cradenza",
  "Shimmer Silk",
];

interface StoreData {
  id: string;
  name: string;
  code: string;
}

// Get random integer between min and max (inclusive)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random item from array
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Verify store exists
async function verifyStore(): Promise<StoreData> {
  console.log("📦 Verifying store...\n");

  const storesSnapshot = await getDocs(collection(db, "stores"));

  if (storesSnapshot.empty) {
    throw new Error(
      "No stores found! Please run 'npm run reset:stores' first."
    );
  }

  const stores: StoreData[] = storesSnapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name,
    code: doc.data().code,
  }));

  // Find target store (use first store if fixed ID not found)
  const targetStore = stores.find((store) => store.id === STORE_ID) || stores[0];

  if (!targetStore) {
    console.log("   ❌ Store not found with ID:", STORE_ID);
    console.log("\n   Available stores:");
    stores.forEach((store) => {
      console.log(`      - ${store.name} (${store.code}) - ID: ${store.id}`);
    });
    throw new Error(`Store with ID ${STORE_ID} not found!`);
  }

  console.log(`   ✓ Found store: ${targetStore.name} (${targetStore.code})`);
  console.log(`   ✓ Store ID: ${STORE_ID}\n`);

  return targetStore;
}

// Create items
async function createItems(store: StoreData): Promise<void> {
  console.log("📝 Creating 75 items...\n");
  console.log(
    `   All items will be created in: ${store.name} (${store.code})\n`
  );

  const currentDate = getCurrentDateString();
  const itemsCreated: Array<{
    name: string;
    color: number;
    roll: number;
  }> = [];

  for (let i = 0; i < 75; i++) {
    // Cycle through item names
    const itemName = itemNames[i % itemNames.length];

    // Random color (1-100)
    const color = randomInt(1, 100);

    // Random roll (5-100)
    const roll = randomInt(5, 100);

    const itemData = {
      storeId: store.id,
      name: itemName,
      color: color,
      roll: roll,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: USER_ID,
      updatedBy: USER_ID,
    };

    const docRef = await addDoc(collection(db, "items"), itemData);

    itemsCreated.push({
      name: itemName,
      color: color,
      roll: roll,
    });

    // Show progress every 10 items
    if ((i + 1) % 10 === 0) {
      console.log(`   ✓ Created ${i + 1}/75 items...`);
    }
  }

  console.log(`\n✓ Successfully created 75 items!\n`);

  // Show summary by name
  console.log("📊 Summary by Item Name:");
  const nameCounts: { [key: string]: number } = {};
  itemsCreated.forEach((item) => {
    nameCounts[item.name] = (nameCounts[item.name] || 0) + 1;
  });

  Object.entries(nameCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`   ${name.padEnd(20)} : ${count} items`);
    });

  console.log("\n📊 Statistics:");
  const colors = itemsCreated.map((i) => i.color);
  const rolls = itemsCreated.map((i) => i.roll);

  console.log(`   Store           : ${store.name} (${store.code})`);
  console.log(`   Total items     : ${itemsCreated.length}`);
  console.log(
    `   Color range     : ${Math.min(...colors)} - ${Math.max(...colors)}`
  );
  console.log(
    `   Roll range      : ${Math.min(...rolls)} - ${Math.max(...rolls)}`
  );
  console.log(`   Total rolls     : ${rolls.reduce((a, b) => a + b, 0)}`);
  console.log(
    `   Average rolls   : ${Math.round(
      rolls.reduce((a, b) => a + b, 0) / rolls.length
    )}`
  );
}

// Create items for all stores
async function seedItems() {
  try {
    console.log("\n=== ITEMS SEEDING SCRIPT ===\n");

    const storesSnapshot = await getDocs(collection(db, "stores"));
    if (storesSnapshot.empty) {
      throw new Error("No stores found! Please run 'npm run reset:stores' first.");
    }

    const stores: StoreData[] = storesSnapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      code: doc.data().code,
    }));

    for (const store of stores) {
      await createItems(store);
    }

    console.log("\n=== SEEDING COMPLETED SUCCESSFULLY! ===\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// Run the seeding
seedItems()
  .then(() => {
    console.log("✅ All done! You can now close this process.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });

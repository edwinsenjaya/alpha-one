import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper function to generate current date string
const getCurrentDateString = (): string => {
  return format(new Date(), "EEEE, d MMMM yyyy HH:mm:ss", { locale: id });
};

// Your new store data
const newStores = [
  { name: "Alfatex 88", code: "HLS" },
  { name: "Alfatex 77", code: "TSK" },
  { name: "JO textile", code: "SRG" },
  { name: "Alfatex 66", code: "PKL" },
  { name: "Alfatex 99", code: "CCL" },
  { name: "Alfatex 33", code: "SLO" },
  { name: "Tan Tan Textile", code: "KDS" },
  { name: "Alfatex 11", code: "CPD" },
  { name: "Satria textile", code: "TGL" },
];

// Delete all existing stores
async function deleteAllStores(): Promise<void> {
  console.log("🗑️  Deleting all existing stores...");

  const storesSnapshot = await getDocs(collection(db, "stores"));

  if (storesSnapshot.empty) {
    console.log("   No existing stores found.");
    return;
  }

  const deletePromises = storesSnapshot.docs.map((storeDoc) => {
    console.log(
      `   Deleting store: ${storeDoc.data().name} (${storeDoc.data().code})`
    );
    return deleteDoc(doc(db, "stores", storeDoc.id));
  });

  await Promise.all(deletePromises);
  console.log(`   ✓ Deleted ${storesSnapshot.size} stores\n`);
}

// Delete all existing invoice counters (subcollections)
async function deleteAllInvoiceCounters(): Promise<void> {
  console.log("🗑️  Deleting all invoice counters...");

  const storesSnapshot = await getDocs(collection(db, "stores"));

  for (const storeDoc of storesSnapshot.docs) {
    const countersSnapshot = await getDocs(
      collection(db, "stores", storeDoc.id, "invoiceCounters")
    );

    if (!countersSnapshot.empty) {
      const deletePromises = countersSnapshot.docs.map((counterDoc) =>
        deleteDoc(
          doc(db, "stores", storeDoc.id, "invoiceCounters", counterDoc.id)
        )
      );
      await Promise.all(deletePromises);
      console.log(
        `   Deleted ${countersSnapshot.size} counters for store ${storeDoc.id}`
      );
    }
  }

  console.log("   ✓ Invoice counters cleaned up\n");
}

// Optional: Delete all other collections (for complete reset)
async function deleteAllData(): Promise<void> {
  console.log("🗑️  Deleting ALL data (stores, users, items, invoices)...\n");

  // Delete users
  const usersSnapshot = await getDocs(collection(db, "users"));
  if (!usersSnapshot.empty) {
    console.log(`   Deleting ${usersSnapshot.size} users...`);
    await Promise.all(usersSnapshot.docs.map((doc) => deleteDoc(doc.ref)));
    console.log("   ✓ Users deleted");
  }

  // Delete items
  const itemsSnapshot = await getDocs(collection(db, "items"));
  if (!itemsSnapshot.empty) {
    console.log(`   Deleting ${itemsSnapshot.size} items...`);
    await Promise.all(itemsSnapshot.docs.map((doc) => deleteDoc(doc.ref)));
    console.log("   ✓ Items deleted");
  }

  // Delete invoices
  const invoicesSnapshot = await getDocs(collection(db, "invoices"));
  if (!invoicesSnapshot.empty) {
    console.log(`   Deleting ${invoicesSnapshot.size} invoices...`);
    await Promise.all(invoicesSnapshot.docs.map((doc) => deleteDoc(doc.ref)));
    console.log("   ✓ Invoices deleted");
  }

  // Delete stores (includes invoice counters)
  await deleteAllInvoiceCounters();
  await deleteAllStores();

  console.log("\n✓ All data deleted\n");
}

interface CreatedStore {
  id: string;
  name: string;
  code: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create new stores
async function createNewStores(): Promise<CreatedStore[]> {
  console.log("📝 Creating new stores...\n");

  const currentDate = getCurrentDateString();
  const createdStores: CreatedStore[] = [];

  for (const store of newStores) {
    const storeData = {
      name: store.name,
      code: store.code,
      active: true,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    const docRef = await addDoc(collection(db, "stores"), storeData);
    const createdStore: CreatedStore = {
      id: docRef.id,
      ...storeData,
    };
    createdStores.push(createdStore);

    console.log(
      `   ✓ Created: ${store.name.padEnd(20)} (${store.code}) - ID: ${
        docRef.id
      }`
    );
  }

  console.log(`\n✓ Created ${newStores.length} stores successfully!\n`);
  return createdStores;
}

// Create boss user
async function createBossUser(alfatex88StoreId: string): Promise<void> {
  console.log("👤 Creating boss user...\n");

  const currentDate = getCurrentDateString();

  const userData = {
    email: "edwinsenjaya7@gmail.com",
    role: "boss",
    storeId: alfatex88StoreId,
    createdAt: currentDate,
  };

  const docRef = await addDoc(collection(db, "users"), userData);
  console.log(`   ✓ Created boss user: ${userData.email} - ID: ${docRef.id}`);
  console.log(`   ✓ Linked to store: Alfatex 88 (HLS) - ${alfatex88StoreId}\n`);
}

// Main function
async function resetStores(fullReset: boolean = false) {
  try {
    console.log("\n=== STORE RESET SCRIPT ===\n");

    if (fullReset) {
      console.log("⚠️  FULL RESET MODE: Will delete ALL data!\n");
      await deleteAllData();
    } else {
      console.log("⚠️  STORES ONLY MODE: Will only delete stores\n");
      await deleteAllInvoiceCounters();
      await deleteAllStores();
    }

    const createdStores = await createNewStores();

    // Create boss user linked to Alfatex 88 (first store)
    const alfatex88Store = createdStores[0]; // Alfatex 88 is first in the list
    await createBossUser(alfatex88Store.id);

    console.log("=== RESET COMPLETED SUCCESSFULLY! ===\n");
  } catch (error) {
    console.error("❌ Error during reset:", error);
    throw error;
  }
}

// Check command line arguments
const fullResetArg = process.argv.includes("--full");

if (fullResetArg) {
  console.log("\n🔥 Running FULL RESET (all data will be deleted)...\n");
  console.log("⏳ Starting in 3 seconds... (Press Ctrl+C to cancel)\n");

  setTimeout(() => {
    resetStores(true)
      .then(() => {
        console.log("✅ Full reset completed!");
        process.exit(0);
      })
      .catch((error) => {
        console.error("❌ Full reset failed:", error);
        process.exit(1);
      });
  }, 3000);
} else {
  console.log("\n📋 Running STORES ONLY RESET...");
  console.log("💡 To delete ALL data, run with --full flag\n");

  resetStores(false)
    .then(() => {
      console.log("✅ Stores reset completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Stores reset failed:", error);
      process.exit(1);
    });
}

/**
 * Migration script to remove colorName field from all items in Firestore
 * Run this once to clean up existing data after the color mapping system removal
 */

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";

// Initialize Firebase (you'll need to add your config)
const firebaseConfig = {
  // Add your Firebase config here
  // You can get this from Firebase Console > Project Settings > General
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeColorNameFromAllItems() {
  try {
    console.log("🔄 Starting migration: removing colorName from all items...");

    // Get all items
    const itemsRef = collection(db, "items");
    const querySnapshot = await getDocs(itemsRef);

    const updatePromises: Promise<void>[] = [];
    let itemsProcessed = 0;

    querySnapshot.forEach((itemDoc) => {
      const data = itemDoc.data();

      // Check if colorName field exists
      if ("colorName" in data) {
        console.log(
          `📝 Removing colorName from item: ${itemDoc.id} (${data.name})`
        );

        // Create update operation to remove colorName field
        const updatePromise = updateDoc(doc(db, "items", itemDoc.id), {
          colorName: undefined, // This removes the field from Firestore
        });

        updatePromises.push(updatePromise);
        itemsProcessed++;
      }
    });

    if (updatePromises.length === 0) {
      console.log(
        "✅ No items found with colorName field. Migration not needed."
      );
      return;
    }

    // Execute all updates
    await Promise.all(updatePromises);

    console.log(`✅ Migration completed successfully!`);
    console.log(`📊 Total items processed: ${itemsProcessed}`);
    console.log(`📊 Total items in collection: ${querySnapshot.size}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Export for use
export { removeColorNameFromAllItems };

// If running directly
if (require.main === module) {
  removeColorNameFromAllItems()
    .then(() => {
      console.log("🎉 Migration script completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Migration script failed:", error);
      process.exit(1);
    });
}

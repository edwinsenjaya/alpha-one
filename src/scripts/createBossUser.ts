import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Helper function to generate current date string
const getCurrentDateString = (): string => {
  return format(new Date(), "EEEE, d MMMM yyyy HH:mm:ss", { locale: id });
};

// IMPORTANT: Replace this with your Firebase Auth UID
// You can find this in Firebase Console -> Authentication -> Users
// Or when you log in, check console.log in your app
const FIREBASE_AUTH_UID = "azGxJxnP36WVBy9LCH9g6p5KfWC3";

// Store ID (Alfatex 88)
const STORE_ID = "gP3RZJcYoaZss4wQfRBM";

async function createBossUser() {
  try {
    console.log("\n=== CREATE BOSS USER ===\n");

    // if (FIREBASE_AUTH_UID === "YOUR_FIREBASE_AUTH_UID_HERE") {
    //   console.log("❌ Please update FIREBASE_AUTH_UID in the script!");
    //   console.log("\nHow to find your Firebase Auth UID:");
    //   console.log("1. Go to Firebase Console -> Authentication -> Users");
    //   console.log("2. Find your email: edwinsenjaya7@gmail.com");
    //   console.log("3. Copy the 'User UID' value");
    //   console.log("4. Replace FIREBASE_AUTH_UID in this script\n");
    //   process.exit(1);
    // }

    console.log("📝 Creating boss user document...\n");
    console.log(`   Firebase Auth UID: ${FIREBASE_AUTH_UID}`);
    console.log(`   Email: edwinsenjaya7@gmail.com`);
    console.log(`   Role: boss`);
    console.log(`   Store ID: ${STORE_ID}\n`);

    const currentDate = getCurrentDateString();

    // Check if user document already exists
    const userDocRef = doc(db, "users", FIREBASE_AUTH_UID);
    const existingUser = await getDoc(userDocRef);

    if (existingUser.exists()) {
      console.log("⚠️  User document already exists!");
      console.log("   Current data:", existingUser.data());
      console.log("\n   Updating user document...\n");
    }

    // Create/update user document with the Auth UID as document ID
    const userData = {
      email: "edwinsenjaya7@gmail.com",
      role: "boss",
      storeId: STORE_ID,
      createdAt: existingUser.exists()
        ? existingUser.data().createdAt
        : currentDate,
    };

    await setDoc(userDocRef, userData);

    console.log("✅ Boss user document created/updated successfully!\n");
    console.log("📋 User Data:");
    console.log(`   Document ID: ${FIREBASE_AUTH_UID}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   Store ID: ${userData.storeId}`);
    console.log(`   Created At: ${userData.createdAt}\n`);

    console.log("✅ You can now log in to your website!\n");
  } catch (error) {
    console.error("❌ Error creating boss user:", error);
    throw error;
  }
}

// Run the script
createBossUser()
  .then(() => {
    console.log("=== COMPLETED SUCCESSFULLY ===\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("=== FAILED ===\n", error);
    process.exit(1);
  });

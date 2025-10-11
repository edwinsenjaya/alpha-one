import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { UserData, UserRole } from "@/types/table";
import {
  handleFirestoreError,
  createSuccessResponse,
  createErrorResponse,
  ApiResponse,
} from "@/utils/errors";
import {
  cleanFirestoreData,
  validateRequiredFields,
  getServerTimestamp,
} from "@/utils/firestore";

const COLLECTION_NAME = "users";

// Required fields for user creation
const REQUIRED_FIELDS = ["email", "role", "storeId"];

export class UsersService {
  // Create or update user profile (called after authentication)
  static async createOrUpdateUser(
    userId: string,
    userData: {
      email: string;
      role: UserRole;
      storeId: string;
    },
    isUpdate: boolean = false
  ): Promise<ApiResponse<UserData>> {
    try {
      // Validate required fields
      const missingFields = validateRequiredFields(userData, REQUIRED_FIELDS);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      const docRef = doc(db, COLLECTION_NAME, userId);

      let docData;
      if (isUpdate) {
        // For updates, check if user exists
        const existingDoc = await getDoc(docRef);
        if (!existingDoc.exists()) {
          throw new Error("User not found");
        }

        docData = cleanFirestoreData({
          ...userData,
        });

        await updateDoc(docRef, docData);
      } else {
        // For new user creation
        docData = cleanFirestoreData({
          ...userData,
          createdAt: getServerTimestamp(),
        });

        await setDoc(docRef, docData);
      }

      // Return the created/updated user
      const userDoc = await getDoc(docRef);
      const user: UserData = {
        id: userDoc.id,
        ...userDoc.data(),
      } as UserData;

      const message = isUpdate
        ? "User updated successfully"
        : "User created successfully";
      return createSuccessResponse(user, message);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<ApiResponse<UserData>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("User not found");
      }

      const user = { id: docSnap.id, ...docSnap.data() } as UserData;
      return createSuccessResponse(user);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Update user role and store (admin only)
  static async updateUserRole(
    userId: string,
    newRole: UserRole,
    newStoreId: string
  ): Promise<ApiResponse<UserData>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);

      // Check if user exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("User not found");
      }

      // Update user role and store
      const updateData = cleanFirestoreData({
        role: newRole,
        storeId: newStoreId,
      });

      await updateDoc(docRef, updateData);

      // Get updated user
      const updatedDoc = await getDoc(docRef);
      const updatedUser = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as UserData;

      return createSuccessResponse(
        updatedUser,
        "User role updated successfully"
      );
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get users by store
  static async getUsersByStore(
    storeId: string
  ): Promise<ApiResponse<UserData[]>> {
    try {
      const usersQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId),
        orderBy("email", "asc")
      );

      const querySnapshot = await getDocs(usersQuery);
      const users: UserData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];

      return createSuccessResponse(users);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get all users (boss only)
  static async getAllUsers(): Promise<ApiResponse<UserData[]>> {
    try {
      const usersQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy("email", "asc")
      );

      const querySnapshot = await getDocs(usersQuery);
      const users: UserData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];

      return createSuccessResponse(users);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get users by role
  static async getUsersByRole(
    role: UserRole
  ): Promise<ApiResponse<UserData[]>> {
    try {
      const usersQuery = query(
        collection(db, COLLECTION_NAME),
        where("role", "==", role),
        orderBy("email", "asc")
      );

      const querySnapshot = await getDocs(usersQuery);
      const users: UserData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserData[];

      return createSuccessResponse(users);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Real-time listener for users in a store
  static subscribeToUsersByStore(
    storeId: string,
    callback: (users: UserData[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    try {
      const usersQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId),
        orderBy("email", "asc")
      );

      return onSnapshot(
        usersQuery,
        (querySnapshot) => {
          const users: UserData[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as UserData[];
          callback(users);
        },
        (error) => {
          const firestoreError = handleFirestoreError(error);
          onError(firestoreError);
        }
      );
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      onError(firestoreError);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Check if user has permission for specific action
  static hasPermission(
    user: UserData,
    action:
      | "create_invoice"
      | "edit_invoice"
      | "delete_invoice"
      | "manage_users"
      | "view_all_stores"
      | "manage_stores",
    targetStoreId?: string
  ): boolean {
    // Boss has all permissions
    if (user.role === "boss") {
      return true;
    }

    // Store-specific permissions (boss already handled above)
    if (targetStoreId && user.storeId !== targetStoreId) {
      return false;
    }

    switch (action) {
      case "create_invoice":
      case "edit_invoice":
        return ["kepala", "admin"].includes(user.role);

      case "delete_invoice":
        return user.role === "kepala";

      case "manage_users":
        return user.role === "kepala";

      case "view_all_stores":
      case "manage_stores":
        // Boss is already handled above with early return
        return false;

      default:
        return false;
    }
  }

  // Get user permissions
  static getUserPermissions(user: UserData) {
    return {
      isBoss: user.role === "boss",
      isKepala: user.role === "kepala",
      isAdmin: user.role === "admin",
      storeId: user.storeId,
    };
  }
}

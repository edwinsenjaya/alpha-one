import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { StoreData } from "@/types/table";
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

const COLLECTION_NAME = "stores";

// Required fields for store creation
const REQUIRED_FIELDS = ["name", "code"];

export class StoresService {
  // Create a new store
  static async createStore(storeData: {
    name: string;
    code: string;
  }): Promise<ApiResponse<StoreData>> {
    try {
      // Validate required fields
      const missingFields = validateRequiredFields(storeData, REQUIRED_FIELDS);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Check if store code already exists
      const existingStore = await this.getStoreByCode(storeData.code);
      if (existingStore.success && existingStore.data) {
        throw new Error("Store code already exists");
      }

      // Prepare document data
      const docData = cleanFirestoreData({
        ...storeData,
        active: true,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      });

      // Add document to Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

      // Return the created store with ID
      const createdStore: StoreData = {
        ...docData,
        id: docRef.id,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      } as StoreData;

      return createSuccessResponse(createdStore, "Store created successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Update an existing store
  static async updateStore(
    storeId: string,
    updateData: Partial<Omit<StoreData, "id" | "createdAt">>
  ): Promise<ApiResponse<StoreData>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, storeId);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Store not found");
      }

      // Prepare update data
      const cleanedData = cleanFirestoreData({
        ...updateData,
        updatedAt: getServerTimestamp(),
      });

      // Update document
      await updateDoc(docRef, cleanedData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      const updatedStore = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as StoreData;

      return createSuccessResponse(updatedStore, "Store updated successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Deactivate store (soft delete)
  static async deactivateStore(storeId: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, storeId);

      await updateDoc(docRef, {
        active: false,
        updatedAt: getServerTimestamp(),
      });

      return createSuccessResponse(true, "Store deactivated successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Reactivate store
  static async reactivateStore(storeId: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, storeId);

      await updateDoc(docRef, {
        active: true,
        updatedAt: getServerTimestamp(),
      });

      return createSuccessResponse(true, "Store reactivated successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get store by ID
  static async getStoreById(storeId: string): Promise<ApiResponse<StoreData>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, storeId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Store not found");
      }

      const store = { id: docSnap.id, ...docSnap.data() } as StoreData;
      return createSuccessResponse(store);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get store by code
  static async getStoreByCode(code: string): Promise<ApiResponse<StoreData>> {
    try {
      const storesQuery = query(
        collection(db, COLLECTION_NAME),
        where("code", "==", code)
      );

      const querySnapshot = await getDocs(storesQuery);

      if (querySnapshot.empty) {
        throw new Error("Store not found");
      }

      const storeDoc = querySnapshot.docs[0];
      const store = { id: storeDoc.id, ...storeDoc.data() } as StoreData;
      return createSuccessResponse(store);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get all stores
  static async getAllStores(
    includeInactive: boolean = false
  ): Promise<ApiResponse<StoreData[]>> {
    try {
      let storesQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy("name", "asc")
      );

      // Filter by active status if specified
      if (!includeInactive) {
        storesQuery = query(storesQuery, where("active", "==", true));
      }

      const querySnapshot = await getDocs(storesQuery);
      const stores: StoreData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as StoreData[];

      return createSuccessResponse(stores);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get active stores only
  static async getActiveStores(): Promise<ApiResponse<StoreData[]>> {
    return this.getAllStores(false);
  }

  // TEMPORARILY DISABLED - Real-time listener for stores
  static subscribeToStores(
    callback: (stores: StoreData[]) => void,
    onError: (error: Error) => void,
    includeInactive: boolean = false
  ): Unsubscribe {
    try {
      // TEMPORARILY DISABLED: Complex real-time query needs composite indexes
      console.log(
        "Real-time stores listener temporarily disabled for debugging"
      );

      // Return empty unsubscribe function - no real-time updates for now
      return () => {};

      /* ORIGINAL CODE - DISABLED  
      let storesQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy("name", "asc")
      );

      if (!includeInactive) {
        storesQuery = query(storesQuery, where("active", "==", true));
      }
      
      return onSnapshot(
        storesQuery,
        (querySnapshot) => {
          const stores: StoreData[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as StoreData[];
          callback(stores);
        },
        (error) => {
          const firestoreError = handleFirestoreError(error);
          onError(firestoreError);
        }
      );
      */
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      onError(firestoreError);
      return () => {}; // Return empty unsubscribe function
    }
  }
}

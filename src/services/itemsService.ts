import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  getCountFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Unsubscribe,
  WriteBatch,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { itemsType } from "@/types/table";
import {
  handleFirestoreError,
  createSuccessResponse,
  createErrorResponse,
  ApiResponse,
} from "@/utils/errors";
import {
  cleanFirestoreData,
  validateRequiredFields,
  PaginationOptions,
  PaginationMetadata,
  PaginatedResponse,
  defaultPaginationOptions,
} from "@/utils/firestore";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const COLLECTION_NAME = "items";

// Required fields for item creation
const REQUIRED_FIELDS = ["name", "color", "storeId"];

// Helper function to generate current date string
const getCurrentDateString = (): string => {
  return format(new Date(), "dd/MM/yyyy HH:mm", { locale: id });
};

export class ItemsService {
  // Create a new item
  static async createItem(
    itemData: Omit<itemsType, "id" | "createdAt" | "updatedAt">,
    userId: string
  ): Promise<ApiResponse<itemsType>> {
    try {
      // Validate required fields
      const missingFields = validateRequiredFields(itemData, REQUIRED_FIELDS);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Prepare document data with string dates
      const currentDate = getCurrentDateString();
      const docData = cleanFirestoreData({
        ...itemData,
        roll: itemData.roll || 0,
        createdBy: userId,
        updatedBy: userId,
        createdAt: currentDate,
        updatedAt: currentDate,
      });

      // Add document to Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

      // Return the created item with the generated ID
      const createdItem: itemsType = {
        id: docRef.id,
        ...docData,
      } as itemsType;

      return createSuccessResponse(createdItem, "Item created successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Update an existing item
  static async updateItem(
    itemId: string,
    updateData: Partial<Omit<itemsType, "id" | "createdAt" | "createdBy">>,
    userId: string
  ): Promise<ApiResponse<itemsType>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, itemId);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Item not found");
      }

      // Prepare update data with string date
      const cleanedData = cleanFirestoreData({
        ...updateData,
        updatedBy: userId,
        updatedAt: getCurrentDateString(),
      });

      // Update document
      await updateDoc(docRef, cleanedData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      const updatedItem = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as itemsType;

      return createSuccessResponse(updatedItem, "Item updated successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Delete an item (hard delete)
  static async deleteItem(
    itemId: string,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, itemId);

      // Hard delete the item
      await deleteDoc(docRef);

      return createSuccessResponse(true, "Item deleted successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get item by ID
  static async getItemById(itemId: string): Promise<ApiResponse<itemsType>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, itemId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Item not found");
      }

      const item = { id: docSnap.id, ...docSnap.data() } as itemsType;
      return createSuccessResponse(item);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get total count of items by store
  static async getTotalItemsByStore(
    storeId: string,
    searchTerm?: string
  ): Promise<number> {
    try {
      let countQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId)
      );

      // For now, we'll get all docs and count them since Firestore search is complex
      // In production, consider implementing more efficient counting
      const snapshot = await getDocs(countQuery);
      let items = snapshot.docs.map((doc) => doc.data() as itemsType);

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.color.toString().includes(searchLower)
        );
      }

      return items.length;
    } catch (error) {
      console.error("Error getting total count:", error);
      return 0;
    }
  }

  // Get items by store with pagination and filtering
  static async getItemsByStore(
    storeId: string,
    options: PaginationOptions = defaultPaginationOptions,
    searchTerm?: string
  ): Promise<ApiResponse<PaginatedResponse<itemsType>>> {
    try {
      // Get total count for pagination metadata
      const totalItems = await this.getTotalItemsByStore(storeId, searchTerm);

      // Get all items first, then apply client-side filtering and pagination
      // This is a temporary solution - in production, consider server-side filtering
      let itemsQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId)
      );

      const querySnapshot = await getDocs(itemsQuery);
      let allItems: itemsType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as itemsType[];

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        allItems = allItems.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.color.toString().includes(searchLower)
        );
      }

      // Sort items by updatedAt (most recent first)
      allItems.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA; // Descending order
      });

      // Calculate pagination
      const limit = options.limit || 25;
      const page = options.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = allItems.slice(startIndex, endIndex);

      const totalPages = Math.ceil(totalItems / limit);

      const paginationMetadata: PaginationMetadata = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      const response: PaginatedResponse<itemsType> = {
        data: items,
        pagination: paginationMetadata,
      };

      return createSuccessResponse(response);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get total count of all items
  static async getTotalAllItems(searchTerm?: string): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      let items = snapshot.docs.map((doc) => doc.data() as itemsType);

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        items = items.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.color.toString().includes(searchLower)
        );
      }

      return items.length;
    } catch (error) {
      console.error("Error getting total count:", error);
      return 0;
    }
  }

  // Get all items (for boss role)
  static async getAllItems(
    options: PaginationOptions = defaultPaginationOptions,
    searchTerm?: string
  ): Promise<ApiResponse<PaginatedResponse<itemsType>>> {
    try {
      // Get total count for pagination metadata
      const totalItems = await this.getTotalAllItems(searchTerm);

      // Get all items first, then apply client-side filtering and pagination
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      let allItems: itemsType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as itemsType[];

      // Apply search filter if provided
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        allItems = allItems.filter(
          (item) =>
            item.name.toLowerCase().includes(searchLower) ||
            item.color.toString().includes(searchLower)
        );
      }

      // Sort items by updatedAt (most recent first)
      allItems.sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA; // Descending order
      });

      // Calculate pagination
      const limit = options.limit || 25;
      const page = options.page || 1;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const items = allItems.slice(startIndex, endIndex);

      const totalPages = Math.ceil(totalItems / limit);

      const paginationMetadata: PaginationMetadata = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      const response: PaginatedResponse<itemsType> = {
        data: items,
        pagination: paginationMetadata,
      };

      return createSuccessResponse(response);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Real-time listener for items
  static subscribeToItems(
    storeId: string | null,
    callback: (items: itemsType[]) => void,
    onError: (error: Error) => void
  ): Unsubscribe {
    try {
      console.log("Starting real-time items listener for storeId:", storeId);

      // Create the query - use createdAt for ordering (we have composite indexes for this)
      let itemsQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy("createdAt", "desc")
      );

      // Filter by store if specified
      if (storeId) {
        itemsQuery = query(
          collection(db, COLLECTION_NAME),
          where("storeId", "==", storeId),
          orderBy("createdAt", "desc")
        );
      }

      // Set up real-time listener
      const unsubscribe = onSnapshot(
        itemsQuery,
        (querySnapshot) => {
          const items = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as itemsType[];

          console.log("Real-time update: received", items.length, "items");
          callback(items);
        },
        (error) => {
          console.error("Real-time listener error:", error);
          onError(error);
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error("Failed to setup real-time listener:", error);
      onError(error as Error);
      return () => {}; // Return empty unsubscribe function
    }
  }

  // Batch operations for bulk updates
  static async batchUpdateItems(
    updates: Array<{ id: string; data: Partial<itemsType> }>,
    userId: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const batch: WriteBatch = writeBatch(db);

      updates.forEach(({ id, data }) => {
        const docRef = doc(db, COLLECTION_NAME, id);
        const updateData = cleanFirestoreData({
          ...data,
          updatedBy: userId,
          updatedAt: getCurrentDateString(),
        });
        batch.update(docRef, updateData);
      });

      await batch.commit();
      return createSuccessResponse(true, "Batch update completed successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Check for low stock items (items with roll <= 10)
  static async getLowStockItems(
    storeId: string,
    threshold: number = 10
  ): Promise<ApiResponse<itemsType[]>> {
    try {
      const itemsQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId)
      );

      const querySnapshot = await getDocs(itemsQuery);
      const lowStockItems: itemsType[] = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as itemsType))
        .filter((item) => {
          return item.roll <= threshold;
        });

      return createSuccessResponse(lowStockItems);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }
}

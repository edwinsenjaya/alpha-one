import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  Unsubscribe,
  runTransaction,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { InvoiceType, InvoiceStatus, StoreData } from "@/types/table";
import {
  handleFirestoreError,
  createSuccessResponse,
  createErrorResponse,
  ApiResponse,
} from "@/utils/errors";
import {
  cleanFirestoreData,
  validateRequiredFields,
  getCurrentDateString,
  generateInvoiceNumber,
  getInvoiceCounterDocId,
  PaginationOptions,
  defaultPaginationOptions,
} from "@/utils/firestore";

const COLLECTION_NAME = "invoices";

// Required fields for invoice creation
const REQUIRED_FIELDS = ["customerName", "items"];

export class InvoicesService {
  // Generate next invoice number for store
  static async getNextInvoiceNumber(
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
      transaction.set(
        counterDoc,
        { lastNumber: nextSequence },
        { merge: true }
      );

      return generateInvoiceNumber(storeCode, nextSequence, date);
    });
  }

  // Create a new invoice
  static async createInvoice(
    invoiceData: Omit<
      InvoiceType,
      "id" | "createdAt" | "updatedAt" | "invoiceNumber"
    >,
    userId: string,
    storeData: StoreData
  ): Promise<ApiResponse<InvoiceType>> {
    try {
      // Validate required fields
      const missingFields = validateRequiredFields(
        invoiceData,
        REQUIRED_FIELDS
      );
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate items array
      if (!invoiceData.items || invoiceData.items.length === 0) {
        throw new Error("Invoice must have at least one item");
      }

      const currentDate = getCurrentDateString();
      const invoiceRef = doc(collection(db, COLLECTION_NAME));

      // Use transaction to ensure atomicity for invoice number and stock updates
      const result = await runTransaction(db, async (transaction) => {
        // 1. Get next invoice number
        const date = new Date();
        const counterDocId = getInvoiceCounterDocId(date);
        const counterDoc = doc(
          db,
          "stores",
          storeData.id,
          "invoiceCounters",
          counterDocId
        );

        const counterSnap = await transaction.get(counterDoc);
        let nextSequence = 1;
        if (counterSnap.exists()) {
          nextSequence = (counterSnap.data().lastNumber || 0) + 1;
        }

        const invoiceNumber = generateInvoiceNumber(
          storeData.code,
          nextSequence,
          date
        );

        // 2. Read and validate all item stocks
        const itemUpdates: { ref: any; newStock: number }[] = [];

        for (const item of invoiceData.items) {
          if (item.itemId) {
            const itemRef = doc(db, "items", item.itemId);
            const itemSnap = await transaction.get(itemRef);

            if (!itemSnap.exists()) {
              throw new Error(`Item with ID ${item.itemId} not found`);
            }

            const currentStock = itemSnap.data().roll || 0;
            const newStock = currentStock - item.roll;

            if (newStock < 0) {
              throw new Error(
                `Insufficient stock for item ${item.name} (${item.color}). Available: ${currentStock}, Required: ${item.roll}`
              );
            }

            itemUpdates.push({ ref: itemRef, newStock });
          }
        }

        // 3. Calculate totals
        const calculatedTotals = this.calculateInvoiceTotals(invoiceData.items);

        // 4. Prepare invoice document data
        const docData = cleanFirestoreData({
          ...invoiceData,
          invoiceNumber,
          storeId: storeData.id,
          status: invoiceData.status || "belum lunas",
          totalColor: calculatedTotals.totalColors,
          totalRoll: calculatedTotals.totalRolls,
          totalYard: calculatedTotals.totalYards,
          grandTotal: calculatedTotals.grandTotal,
          createdBy: userId,
          createdAt: currentDate,
          updatedAt: currentDate,
        });

        // 5. Perform all writes
        // Set invoice
        transaction.set(invoiceRef, docData);

        // Update stock for each item
        for (const update of itemUpdates) {
          transaction.update(update.ref, {
            roll: update.newStock,
            updatedAt: currentDate,
            updatedBy: userId,
          });
        }

        // Update counter
        transaction.set(
          counterDoc,
          { lastNumber: nextSequence },
          { merge: true }
        );

        return {
          ...docData,
          id: invoiceRef.id,
        } as InvoiceType;
      });

      return createSuccessResponse(result, "Invoice created successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Update an existing invoice
  static async updateInvoice(
    invoiceId: string,
    updateData: Partial<
      Omit<InvoiceType, "id" | "createdAt" | "createdBy" | "invoiceNumber">
    >,
    userId: string
  ): Promise<ApiResponse<InvoiceType>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);

      // Check if document exists
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        throw new Error("Invoice not found");
      }

      // Recalculate totals if items are updated
      let calculatedData = updateData;
      if (updateData.items) {
        const calculatedTotals = this.calculateInvoiceTotals(updateData.items);
        calculatedData = {
          ...updateData,
          totalColor: calculatedTotals.totalColors,
          totalRoll: calculatedTotals.totalRolls,
          totalYard: calculatedTotals.totalYards,
          grandTotal: calculatedTotals.grandTotal,
        };
      }

      // Prepare update data
      const cleanedData = cleanFirestoreData({
        ...calculatedData,
        updatedAt: getCurrentDateString(),
      });

      // Update document
      await updateDoc(docRef, cleanedData);

      // Get updated document
      const updatedDoc = await getDoc(docRef);
      const updatedInvoice = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      } as InvoiceType;

      return createSuccessResponse(
        updatedInvoice,
        "Invoice updated successfully"
      );
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Update invoice status
  static async updateInvoiceStatus(
    invoiceId: string,
    status: InvoiceStatus
  ): Promise<ApiResponse<InvoiceType>> {
    try {
      const updateData = {
        status,
        updatedAt: getCurrentDateString(),
      };

      return await this.updateInvoice(invoiceId, updateData, "");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Delete an invoice
  static async deleteInvoice(invoiceId: string): Promise<ApiResponse<boolean>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);

      // Hard delete
      await deleteDoc(docRef);

      return createSuccessResponse(true, "Invoice deleted successfully");
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get invoice by ID
  static async getInvoiceById(
    invoiceId: string
  ): Promise<ApiResponse<InvoiceType>> {
    try {
      const docRef = doc(db, COLLECTION_NAME, invoiceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error("Invoice not found");
      }

      const invoice = { id: docSnap.id, ...docSnap.data() } as InvoiceType;
      return createSuccessResponse(invoice);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get invoices by store (using storeId)
  static async getInvoicesByStore(
    storeId: string,
    options: PaginationOptions = {},
    statusFilter?: InvoiceStatus,
    searchTerm?: string
  ): Promise<ApiResponse<InvoiceType[]>> {
    try {
      // Start with storeId filter
      let invoicesQuery = query(
        collection(db, COLLECTION_NAME),
        where("storeId", "==", storeId)
      );

      // Add status filter
      if (statusFilter) {
        invoicesQuery = query(
          invoicesQuery,
          where("status", "==", statusFilter)
        );
      }

      // Add ordering
      if (options?.orderBy) {
        invoicesQuery = query(
          invoicesQuery,
          orderBy(options.orderBy, options.orderDirection)
        );
      }

      // Add pagination
      if (options?.limit) {
        invoicesQuery = query(invoicesQuery, limit(options.limit));
      }

      if (options?.startAfter) {
        invoicesQuery = query(invoicesQuery, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(invoicesQuery);
      let invoices: InvoiceType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceType[];

      // Filter by search term on client side
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        invoices = invoices.filter(
          (invoice) =>
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.customerName.toLowerCase().includes(searchLower)
        );
      }

      return createSuccessResponse(invoices);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get all invoices (for boss role)
  static async getAllInvoices(
    options: PaginationOptions = {},
    statusFilter?: InvoiceStatus
  ): Promise<ApiResponse<InvoiceType[]>> {
    try {
      let invoicesQuery = query(collection(db, COLLECTION_NAME));

      // Add filters
      if (statusFilter) {
        invoicesQuery = query(
          invoicesQuery,
          where("status", "==", statusFilter)
        );
      }

      // Add ordering and pagination
      if (options?.orderBy) {
        invoicesQuery = query(
          invoicesQuery,
          orderBy(options.orderBy, options.orderDirection)
        );
      }

      if (options?.limit) {
        invoicesQuery = query(invoicesQuery, limit(options.limit));
      }

      const querySnapshot = await getDocs(invoicesQuery);
      const invoices: InvoiceType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceType[];

      return createSuccessResponse(invoices);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Real-time listener for invoices
  static subscribeToInvoices(
    storeId: string | null,
    callback: (invoices: InvoiceType[]) => void,
    onError: (error: Error) => void,
    statusFilter?: InvoiceStatus
  ): Unsubscribe {
    try {
      // Build query with storeId filter if provided
      let invoicesQuery;

      if (storeId) {
        invoicesQuery = query(
          collection(db, COLLECTION_NAME),
          where("storeId", "==", storeId),
          orderBy("updatedAt", "desc")
        );
      } else {
        invoicesQuery = query(
          collection(db, COLLECTION_NAME),
          orderBy("updatedAt", "desc")
        );
      }

      // Filter by status if specified
      if (statusFilter) {
        invoicesQuery = query(
          invoicesQuery,
          where("status", "==", statusFilter)
        );
      }

      return onSnapshot(
        invoicesQuery,
        (querySnapshot) => {
          const invoices: InvoiceType[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as InvoiceType[];

          callback(invoices);
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

  // Calculate invoice totals from items
  private static calculateInvoiceTotals(items: any[]) {
    let totalColors = 0;
    let totalRolls = 0;
    let totalYards = 0;
    let grandTotal = 0;

    const colorSet = new Set();

    items.forEach((item) => {
      // Count unique colors
      colorSet.add(item.color);

      // Sum rolls
      totalRolls += item.roll || 0;

      // Sum yards
      if (Array.isArray(item.yards)) {
        totalYards += item.yards.reduce(
          (sum: number, yard: number) => sum + yard,
          0
        );
      }

      // Sum totals
      grandTotal += item.total || 0;
    });

    totalColors = colorSet.size;

    return {
      totalColors,
      totalRolls,
      totalYards,
      grandTotal,
    };
  }

  // Get invoice statistics for dashboard
  static async getInvoiceStats(
    storeId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<
    ApiResponse<{
      totalInvoices: number;
      totalRevenue: number;
      paidInvoices: number;
      unpaidInvoices: number;
      returnInvoices: number;
    }>
  > {
    try {
      // Build query with storeId filter if provided
      let invoicesQuery = storeId
        ? query(
            collection(db, COLLECTION_NAME),
            where("storeId", "==", storeId)
          )
        : query(collection(db, COLLECTION_NAME));

      // Note: For date filtering, you'd need to add date range queries
      // This is a simplified version

      const querySnapshot = await getDocs(invoicesQuery);
      const invoices: InvoiceType[] = querySnapshot.docs.map((doc) =>
        doc.data()
      ) as InvoiceType[];

      const stats = {
        totalInvoices: invoices.length,
        totalRevenue: invoices
          .filter((inv) => inv.status === "lunas")
          .reduce((sum, inv) => sum + inv.grandTotal, 0),
        paidInvoices: invoices.filter((inv) => inv.status === "lunas").length,
        unpaidInvoices: invoices.filter((inv) => inv.status === "belum lunas")
          .length,
        returnInvoices: invoices.filter((inv) => inv.status === "retur").length,
      };

      return createSuccessResponse(stats);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }
}

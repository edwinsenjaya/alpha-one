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
  getServerTimestamp,
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

      // Generate invoice number
      const invoiceNumber = await this.getNextInvoiceNumber(
        storeData.id,
        storeData.code
      );

      // Calculate totals
      const calculatedTotals = this.calculateInvoiceTotals(invoiceData.items);

      // Prepare document data
      const docData = cleanFirestoreData({
        ...invoiceData,
        invoiceNumber,
        status: invoiceData.status || "belum lunas",
        totalColor: calculatedTotals.totalColors,
        totalRoll: calculatedTotals.totalRolls,
        totalYard: calculatedTotals.totalYards,
        grandTotal: calculatedTotals.grandTotal,
        createdBy: userId,
        createdAt: getServerTimestamp(),
        updatedAt: getServerTimestamp(),
      });

      // Add document to Firestore
      const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);

      // Return the created invoice with ID
      const createdInvoice: InvoiceType = {
        ...docData,
        id: docRef.id,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      } as InvoiceType;

      return createSuccessResponse(
        createdInvoice,
        "Invoice created successfully"
      );
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
        updatedAt: getServerTimestamp(),
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
        updatedAt: getServerTimestamp(),
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

  // Get invoices by store (derived from invoice number)
  static async getInvoicesByStore(
    storeCode: string,
    options: PaginationOptions = defaultPaginationOptions,
    statusFilter?: InvoiceStatus,
    searchTerm?: string
  ): Promise<ApiResponse<InvoiceType[]>> {
    try {
      let invoicesQuery = query(collection(db, COLLECTION_NAME));

      // Add status filter
      if (statusFilter) {
        invoicesQuery = query(
          invoicesQuery,
          where("status", "==", statusFilter)
        );
      }

      // Add ordering
      if (options.orderBy) {
        invoicesQuery = query(
          invoicesQuery,
          orderBy(options.orderBy, options.orderDirection)
        );
      }

      // Add pagination
      if (options.limit) {
        invoicesQuery = query(invoicesQuery, limit(options.limit));
      }

      if (options.startAfter) {
        invoicesQuery = query(invoicesQuery, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(invoicesQuery);
      let invoices: InvoiceType[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InvoiceType[];

      // Filter by store code and search term on client side
      invoices = invoices.filter((invoice) => {
        const matchesStore = invoice.invoiceNumber.startsWith(storeCode);
        if (!matchesStore) return false;

        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          return (
            invoice.invoiceNumber.toLowerCase().includes(searchLower) ||
            invoice.customerName.toLowerCase().includes(searchLower)
          );
        }
        return true;
      });

      return createSuccessResponse(invoices);
    } catch (error) {
      const firestoreError = handleFirestoreError(error);
      return createErrorResponse(firestoreError);
    }
  }

  // Get all invoices (for boss role)
  static async getAllInvoices(
    options: PaginationOptions = defaultPaginationOptions,
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
      if (options.orderBy) {
        invoicesQuery = query(
          invoicesQuery,
          orderBy(options.orderBy, options.orderDirection)
        );
      }

      if (options.limit) {
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
    storeCode: string | null,
    callback: (invoices: InvoiceType[]) => void,
    onError: (error: Error) => void,
    statusFilter?: InvoiceStatus
  ): Unsubscribe {
    try {
      let invoicesQuery = query(
        collection(db, COLLECTION_NAME),
        orderBy("updatedAt", "desc")
      );

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
          let invoices: InvoiceType[] = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as InvoiceType[];

          // Filter by store code on client side
          if (storeCode) {
            invoices = invoices.filter((invoice) =>
              invoice.invoiceNumber.startsWith(storeCode)
            );
          }

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
    storeCode?: string,
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
      let invoicesQuery = query(collection(db, COLLECTION_NAME));

      // Note: For date filtering, you'd need to add date range queries
      // This is a simplified version

      const querySnapshot = await getDocs(invoicesQuery);
      let invoices: InvoiceType[] = querySnapshot.docs.map((doc) =>
        doc.data()
      ) as InvoiceType[];

      // Filter by store code if specified
      if (storeCode) {
        invoices = invoices.filter((invoice) =>
          invoice.invoiceNumber.startsWith(storeCode)
        );
      }

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

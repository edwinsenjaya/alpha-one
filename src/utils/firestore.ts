import { Timestamp, serverTimestamp } from "firebase/firestore";
import { FirestoreTimestamp } from "@/types/table";

// Convert Firestore Timestamp to Date
export const timestampToDate = (
  timestamp: FirestoreTimestamp | Timestamp
): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
};

// Convert Date to Firestore Timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Get server timestamp for Firestore
export const getServerTimestamp = () => serverTimestamp();

// Generate invoice number based on store code and sequence
export const generateInvoiceNumber = (
  storeCode: string,
  sequence: number,
  date: Date = new Date()
): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  const paddedSequence = sequence.toString().padStart(4, "0");
  return `${storeCode}-${month}${year}-${paddedSequence}`;
};

// Get MMYY format for invoice counter document ID
export const getInvoiceCounterDocId = (date: Date = new Date()): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);
  return `${month}${year}`;
};

// Generate document ID for Firestore (random string)
export const generateDocId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

// Clean data for Firestore (remove undefined values)
export const cleanFirestoreData = (data: any): any => {
  const cleaned: any = {};

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Timestamp)
      ) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
};

// Validate required fields
export const validateRequiredFields = (
  data: any,
  requiredFields: string[]
): string[] => {
  const missingFields: string[] = [];

  for (const field of requiredFields) {
    if (
      !data[field] ||
      (typeof data[field] === "string" && data[field].trim() === "")
    ) {
      missingFields.push(field);
    }
  }

  return missingFields;
};

// Pagination helper
export interface PaginationOptions {
  limit?: number;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
  startAfter?: any;
  page?: number; // Add page number for easier navigation
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startAfterDoc?: any;
  endBeforeDoc?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export const defaultPaginationOptions: PaginationOptions = {
  limit: 25,
  page: 1,
  // TEMPORARILY DISABLED - orderBy needs composite indexes
  // orderBy: "createdAt",  // Fixed: was "created_at", should be "createdAt"
  // orderDirection: "desc",
};

// Pagination helper constants
export const ITEMS_PER_PAGE_OPTIONS = [25, 50, 75, 100] as const;
export type ItemsPerPageOption = (typeof ITEMS_PER_PAGE_OPTIONS)[number];

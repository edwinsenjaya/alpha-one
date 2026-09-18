// Firestore document types
export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

// User related types
export type UserRole = "boss" | "kepala" | "admin";

export interface UserData {
  id: string;
  email: string;
  role: UserRole;
  storeId: string;
  createdAt: string; // Changed to string: "EEEE, d MMMM yyyy HH:mm:ss"
}

// Store related types
export interface StoreData {
  id: string;
  name: string;
  code: string;
  active: boolean;
  updatedAt: string; // Changed to string: "EEEE, d MMMM yyyy HH:mm:ss"
  createdAt: string; // Changed to string: "EEEE, d MMMM yyyy HH:mm:ss"
}

// Invoice counter (subcollection under stores)
export interface InvoiceCounter {
  id: string; // MMYY format
  lastNumber: number;
}

// Item related types
export interface ItemsType {
  id: string;
  storeId: string;
  name: string;
  color: number;
  roll: number;
  createdAt: string; // Changed to string: "DD/MM/YYYY HH:mm"
  createdBy: string;
  updatedAt: string; // Changed to string: "DD/MM/YYYY HH:mm"
  updatedBy: string;
}

// Invoice related types
export type InvoiceStatus = "lunas" | "belum lunas" | "retur";

export interface ItemsInvoiceType {
  itemId: string;
  name: string;
  color: string;
  roll: number;
  yards: number[];
  price: number;
  total: number;
}

export interface InvoiceType {
  id: string;
  invoiceNumber: string;
  storeId: string; // Added: Store reference for filtering
  customerName: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalColor: number;
  totalRoll: number;
  totalYard: number;
  grandTotal: number;
  status: InvoiceStatus;
  notes: string;
  items: ItemsInvoiceType[];
  pdfUrl?: string;
}

// Form input type for the create invoice table (yardsInput is raw user string)
export interface InvoiceItemInput {
  id: string;
  itemId: string;
  name: string;
  color: string;
  roll: number;
  yardsInput: string;
  yards: number[];
  price: number;
  total: number;
}

// Legacy types for backward compatibility (can be removed later)
export type itemsType = ItemsType;
export type itemsInvoiceType = ItemsInvoiceType;
export type invoiceType = InvoiceType;

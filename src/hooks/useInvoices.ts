import { useState, useEffect, useCallback } from "react";
import { InvoiceType, InvoiceStatus, StoreData } from "@/types/table";
import { InvoicesService } from "@/services/invoicesService";
import { ApiResponse } from "@/utils/errors";
import { PaginationOptions } from "@/utils/firestore";
import { useAuth } from "@/context/AuthContext";

interface UseInvoicesOptions {
  storeCode?: string;
  autoFetch?: boolean;
  realTime?: boolean;
  statusFilter?: InvoiceStatus;
  searchTerm?: string;
  paginationOptions?: PaginationOptions;
}

interface UseInvoicesReturn {
  invoices: InvoiceType[];
  loading: boolean;
  error: string | null;
  createInvoice: (
    invoiceData: Omit<
      InvoiceType,
      "id" | "createdAt" | "updatedAt" | "invoiceNumber"
    >,
    storeData: StoreData
  ) => Promise<InvoiceType | null>;
  updateInvoice: (
    invoiceId: string,
    updateData: Partial<InvoiceType>
  ) => Promise<boolean>;
  updateInvoiceStatus: (
    invoiceId: string,
    status: InvoiceStatus
  ) => Promise<boolean>;
  deleteInvoice: (invoiceId: string) => Promise<boolean>;
  getInvoiceById: (invoiceId: string) => Promise<InvoiceType | null>;
  refetch: () => Promise<void>;
  stats: {
    totalInvoices: number;
    totalRevenue: number;
    paidInvoices: number;
    unpaidInvoices: number;
    returnInvoices: number;
  };
  loadingStats: boolean;
  fetchStats: () => Promise<void>;
}

export const useInvoices = (
  options: UseInvoicesOptions = {}
): UseInvoicesReturn => {
  const {
    storeCode,
    autoFetch = true,
    realTime = false,
    statusFilter,
    searchTerm,
    paginationOptions,
  } = options;

  const { user } = useAuth();
  const [invoices, setInvoices] = useState<InvoiceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    returnInvoices: 0,
  });

  // Fetch invoices function
  const fetchInvoices = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<InvoiceType[]>;

      if (storeCode) {
        response = await InvoicesService.getInvoicesByStore(
          storeCode,
          paginationOptions,
          statusFilter,
          searchTerm
        );
      } else {
        response = await InvoicesService.getAllInvoices(
          paginationOptions,
          statusFilter
        );
      }

      if (response.success && response.data) {
        setInvoices(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch invoices");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching invoices:", err);
    } finally {
      setLoading(false);
    }
  }, [user, storeCode, paginationOptions, statusFilter, searchTerm]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    if (!user) return;

    setLoadingStats(true);
    try {
      const response = await InvoicesService.getInvoiceStats(storeCode);
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (err) {
      console.error("Error fetching invoice stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [user, storeCode]);

  // Create invoice
  const createInvoice = useCallback(
    async (
      invoiceData: Omit<
        InvoiceType,
        "id" | "createdAt" | "updatedAt" | "invoiceNumber"
      >,
      storeData: StoreData
    ): Promise<InvoiceType | null> => {
      if (!user) return null;

      try {
        const response = await InvoicesService.createInvoice(
          invoiceData,
          user.uid,
          storeData
        );
        if (response.success && response.data) {
          // Refetch invoices to get the latest data
          await fetchInvoices();
          return response.data;
        } else {
          setError(response.error?.message || "Failed to create invoice");
          return null;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error creating invoice:", err);
        return null;
      }
    },
    [user, fetchInvoices]
  );

  // Update invoice
  const updateInvoice = useCallback(
    async (
      invoiceId: string,
      updateData: Partial<InvoiceType>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await InvoicesService.updateInvoice(
          invoiceId,
          updateData,
          user.uid
        );
        if (response.success) {
          // Update local state
          setInvoices((prevInvoices) =>
            prevInvoices.map((invoice) =>
              invoice.id === invoiceId ? { ...invoice, ...updateData } : invoice
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to update invoice");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error updating invoice:", err);
        return false;
      }
    },
    [user]
  );

  // Update invoice status
  const updateInvoiceStatus = useCallback(
    async (invoiceId: string, status: InvoiceStatus): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await InvoicesService.updateInvoiceStatus(
          invoiceId,
          status
        );
        if (response.success) {
          // Update local state
          setInvoices((prevInvoices) =>
            prevInvoices.map((invoice) =>
              invoice.id === invoiceId ? { ...invoice, status } : invoice
            )
          );
          return true;
        } else {
          setError(
            response.error?.message || "Failed to update invoice status"
          );
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error updating invoice status:", err);
        return false;
      }
    },
    [user]
  );

  // Delete invoice
  const deleteInvoice = useCallback(
    async (invoiceId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await InvoicesService.deleteInvoice(invoiceId);
        if (response.success) {
          // Remove from local state
          setInvoices((prevInvoices) =>
            prevInvoices.filter((invoice) => invoice.id !== invoiceId)
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to delete invoice");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error deleting invoice:", err);
        return false;
      }
    },
    [user]
  );

  // Get invoice by ID
  const getInvoiceById = useCallback(
    async (invoiceId: string): Promise<InvoiceType | null> => {
      try {
        const response = await InvoicesService.getInvoiceById(invoiceId);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error?.message || "Failed to fetch invoice");
          return null;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error fetching invoice:", err);
        return null;
      }
    },
    []
  );

  // Setup real-time listener
  useEffect(() => {
    if (realTime && user) {
      const unsubscribe = InvoicesService.subscribeToInvoices(
        storeCode || null,
        (updatedInvoices) => {
          setInvoices(updatedInvoices);
          setError(null);
        },
        (error) => {
          setError(error.message);
          console.error("Real-time invoices error:", error);
        },
        statusFilter
      );

      return unsubscribe;
    }
  }, [realTime, storeCode, user, statusFilter]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch && !realTime) {
      fetchInvoices();
    }
  }, [fetchInvoices, autoFetch, realTime]);

  // Auto-fetch stats
  useEffect(() => {
    if (autoFetch) {
      fetchStats();
    }
  }, [fetchStats, autoFetch]);

  return {
    invoices,
    loading,
    error,
    createInvoice,
    updateInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    getInvoiceById,
    refetch: fetchInvoices,
    stats,
    loadingStats,
    fetchStats,
  };
};

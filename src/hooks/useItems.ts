import { useState, useEffect, useCallback } from "react";
import { itemsType } from "@/types/table";
import { ItemsService } from "@/services/itemsService";
import { ApiResponse } from "@/utils/errors";
import {
  PaginationOptions,
  PaginationMetadata,
  PaginatedResponse,
  defaultPaginationOptions,
} from "@/utils/firestore";
import { useAuth } from "@/context/AuthContext";

interface UseItemsOptions {
  storeId?: string;
  autoFetch?: boolean;
  realTime?: boolean;
  searchTerm?: string;
  paginationOptions?: PaginationOptions;
}

interface UseItemsReturn {
  items: itemsType[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMetadata | null;
  createItem: (
    itemData: Omit<itemsType, "id" | "createdAt" | "updatedAt">
  ) => Promise<boolean>;
  updateItem: (
    itemId: string,
    updateData: Partial<itemsType>
  ) => Promise<boolean>;
  deleteItem: (itemId: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
  setItemsPerPage: (limit: number) => void;
  lowStockItems: itemsType[];
  loadingLowStock: boolean;
  fetchLowStock: () => Promise<void>;
}

export const useItems = (options: UseItemsOptions = {}): UseItemsReturn => {
  const {
    storeId,
    autoFetch = true,
    realTime = false,
    searchTerm,
    paginationOptions,
  } = options;

  const { user } = useAuth();
  const [items, setItems] = useState<itemsType[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [lowStockItems, setLowStockItems] = useState<itemsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch items function
  const fetchItems = useCallback(async () => {
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<PaginatedResponse<itemsType>>;

      const optionsToUse = {
        ...defaultPaginationOptions,
        ...paginationOptions,
      };

      if (storeId) {
        response = await ItemsService.getItemsByStore(
          storeId,
          optionsToUse,
          searchTerm
        );
      } else {
        response = await ItemsService.getAllItems(optionsToUse, searchTerm);
      }

      if (response.success && response.data) {
        setItems(response.data.data);
        setPagination(response.data.pagination);
        console.log("🔍 useItems: Items set in state:", response.data.data);
        console.log(
          "🔍 useItems: Pagination metadata:",
          response.data.pagination
        );
      } else {
        setError(response.error?.message || "Failed to fetch items");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [user, storeId, paginationOptions, searchTerm]);

  // Fetch low stock items
  const fetchLowStock = useCallback(async () => {
    if (!user || !storeId) return;

    setLoadingLowStock(true);
    try {
      const response = await ItemsService.getLowStockItems(storeId);
      if (response.success && response.data) {
        setLowStockItems(response.data);
      }
    } catch (err) {
      console.error("Error fetching low stock items:", err);
    } finally {
      setLoadingLowStock(false);
    }
  }, [user, storeId]);

  // Create item
  const createItem = useCallback(
    async (
      itemData: Omit<itemsType, "id" | "createdAt" | "updatedAt">
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await ItemsService.createItem(itemData, user.uid);
        if (response.success) {
          // Refetch items to get the latest data
          await fetchItems();
          return true;
        } else {
          setError(response.error?.message || "Failed to create item");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error creating item:", err);
        return false;
      }
    },
    [user, fetchItems]
  );

  // Update item
  const updateItem = useCallback(
    async (
      itemId: string,
      updateData: Partial<itemsType>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await ItemsService.updateItem(
          itemId,
          updateData,
          user.uid
        );
        if (response.success) {
          // Update local state
          setItems((prevItems) =>
            prevItems.map((item) =>
              item.id === itemId ? { ...item, ...updateData } : item
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to update item");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error updating item:", err);
        return false;
      }
    },
    [user]
  );

  // Delete item
  const deleteItem = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await ItemsService.deleteItem(itemId, user.uid);
        if (response.success) {
          // Remove from local state
          setItems((prevItems) =>
            prevItems.filter((item) => item.id !== itemId)
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to delete item");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error deleting item:", err);
        return false;
      }
    },
    [user]
  );

  // Setup real-time listener
  useEffect(() => {
    if (realTime && user) {
      const unsubscribe = ItemsService.subscribeToItems(
        storeId || null,
        (updatedItems) => {
          setItems(updatedItems);
          setError(null);
        },
        (error) => {
          setError(error.message);
          console.error("Real-time items error:", error);
        }
      );

      return unsubscribe;
    }
  }, [realTime, storeId, user]);

  // Go to specific page
  const goToPage = useCallback(
    async (page: number) => {
      if (pagination && page >= 1 && page <= pagination.totalPages) {
        setCurrentPage(page);
      }
    },
    [pagination]
  );

  // Set items per page
  const setItemsPerPageInternal = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to page 1 when changing limit
  }, []);

  // Update internal state when paginationOptions change
  useEffect(() => {
    if (paginationOptions) {
      setCurrentPage(paginationOptions.page || 1);
      setItemsPerPage(paginationOptions.limit || 25);
    }
  }, [paginationOptions]);

  // Fetch items when dependencies change
  useEffect(() => {
    if (autoFetch && !realTime) {
      fetchItems();
    }
  }, [fetchItems, autoFetch, realTime]);

  // Auto-fetch low stock items
  useEffect(() => {
    if (autoFetch && storeId) {
      fetchLowStock();
    }
  }, [fetchLowStock, autoFetch, storeId]);

  return {
    items,
    loading,
    error,
    pagination,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchItems,
    goToPage,
    setItemsPerPage: setItemsPerPageInternal,
    lowStockItems,
    loadingLowStock,
    fetchLowStock,
  };
};

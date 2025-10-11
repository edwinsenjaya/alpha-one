import { useState, useEffect, useCallback } from "react";
import { StoreData } from "@/types/table";
import { StoresService } from "@/services/storesService";
import { ApiResponse } from "@/utils/errors";
import { useAuth } from "@/context/AuthContext";

interface UseStoresOptions {
  autoFetch?: boolean;
  realTime?: boolean;
  includeInactive?: boolean;
}

interface UseStoresReturn {
  stores: StoreData[];
  activeStores: StoreData[];
  loading: boolean;
  error: string | null;
  createStore: (storeData: { name: string; code: string }) => Promise<boolean>;
  updateStore: (
    storeId: string,
    updateData: Partial<StoreData>
  ) => Promise<boolean>;
  deactivateStore: (storeId: string) => Promise<boolean>;
  reactivateStore: (storeId: string) => Promise<boolean>;
  getStoreById: (storeId: string) => Promise<StoreData | null>;
  getStoreByCode: (code: string) => Promise<StoreData | null>;
  refetch: () => Promise<void>;
}

export const useStores = (options: UseStoresOptions = {}): UseStoresReturn => {
  const {
    autoFetch = true,
    realTime = false,
    includeInactive = false,
  } = options;

  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get only active stores
  const activeStores = stores.filter((store) => store.active);

  // Fetch stores function
  const fetchStores = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await StoresService.getAllStores(includeInactive);

      if (response.success && response.data) {
        setStores(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch stores");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching stores:", err);
    } finally {
      setLoading(false);
    }
  }, [user, includeInactive]);

  // Create store
  const createStore = useCallback(
    async (storeData: { name: string; code: string }): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await StoresService.createStore(storeData);
        if (response.success) {
          // Refetch stores to get the latest data
          await fetchStores();
          return true;
        } else {
          setError(response.error?.message || "Failed to create store");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error creating store:", err);
        return false;
      }
    },
    [user, fetchStores]
  );

  // Update store
  const updateStore = useCallback(
    async (
      storeId: string,
      updateData: Partial<StoreData>
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await StoresService.updateStore(storeId, updateData);
        if (response.success) {
          // Update local state
          setStores((prevStores) =>
            prevStores.map((store) =>
              store.id === storeId ? { ...store, ...updateData } : store
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to update store");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error updating store:", err);
        return false;
      }
    },
    [user]
  );

  // Deactivate store
  const deactivateStore = useCallback(
    async (storeId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await StoresService.deactivateStore(storeId);
        if (response.success) {
          // Update local state
          setStores((prevStores) =>
            prevStores.map((store) =>
              store.id === storeId ? { ...store, active: false } : store
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to deactivate store");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error deactivating store:", err);
        return false;
      }
    },
    [user]
  );

  // Reactivate store
  const reactivateStore = useCallback(
    async (storeId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response = await StoresService.reactivateStore(storeId);
        if (response.success) {
          // Update local state
          setStores((prevStores) =>
            prevStores.map((store) =>
              store.id === storeId ? { ...store, active: true } : store
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to reactivate store");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error reactivating store:", err);
        return false;
      }
    },
    [user]
  );

  // Get store by ID
  const getStoreById = useCallback(
    async (storeId: string): Promise<StoreData | null> => {
      try {
        const response = await StoresService.getStoreById(storeId);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error?.message || "Failed to fetch store");
          return null;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error fetching store:", err);
        return null;
      }
    },
    []
  );

  // Get store by code
  const getStoreByCode = useCallback(
    async (code: string): Promise<StoreData | null> => {
      try {
        const response = await StoresService.getStoreByCode(code);
        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.error?.message || "Failed to fetch store");
          return null;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error fetching store:", err);
        return null;
      }
    },
    []
  );

  // Setup real-time listener
  useEffect(() => {
    if (realTime && user) {
      const unsubscribe = StoresService.subscribeToStores(
        (updatedStores) => {
          setStores(updatedStores);
          setError(null);
        },
        (error) => {
          setError(error.message);
          console.error("Real-time stores error:", error);
        },
        includeInactive
      );

      return unsubscribe;
    }
  }, [realTime, user, includeInactive]);

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    if (autoFetch && !realTime) {
      fetchStores();
    }
  }, [fetchStores, autoFetch, realTime]);

  return {
    stores,
    activeStores,
    loading,
    error,
    createStore,
    updateStore,
    deactivateStore,
    reactivateStore,
    getStoreById,
    getStoreByCode,
    refetch: fetchStores,
  };
};

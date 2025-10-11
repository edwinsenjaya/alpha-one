import { useState, useEffect, useCallback } from "react";
import { UserData, UserRole } from "@/types/table";
import { UsersService } from "@/services/usersService";
import { ApiResponse } from "@/utils/errors";
import { useAuth } from "@/context/AuthContext";

interface UseUsersOptions {
  storeId?: string;
  role?: UserRole;
  autoFetch?: boolean;
  realTime?: boolean;
}

interface UseUsersReturn {
  users: UserData[];
  currentUser: UserData | null;
  loading: boolean;
  loadingCurrentUser: boolean;
  error: string | null;
  createOrUpdateUser: (
    userData: {
      email: string;
      role: UserRole;
      storeId: string;
    },
    isUpdate?: boolean
  ) => Promise<boolean>;
  updateUserRole: (
    userId: string,
    newRole: UserRole,
    newStoreId: string
  ) => Promise<boolean>;
  permissions: {
    // canCreateInvoice: boolean;
    // canEditInvoice: boolean;
    // canDeleteInvoice: boolean;
    // canManageUsers: boolean;
    // canViewAllStores: boolean;
    // canManageStores: boolean;
    isBoss: boolean;
    isKepala: boolean;
    isAdmin: boolean;
    storeId: string | undefined;
  };
  refetch: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
}

export const useUsers = (options: UseUsersOptions = {}): UseUsersReturn => {
  const { storeId, role, autoFetch = true, realTime = false } = options;

  const { user } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get permissions for current user
  const permissions = currentUser
    ? UsersService.getUserPermissions(currentUser)
    : {
        canCreateInvoice: false,
        canEditInvoice: false,
        canDeleteInvoice: false,
        canManageUsers: false,
        canViewAllStores: false,
        canManageStores: false,
        isBoss: false,
        isKepala: false,
        isAdmin: false,
        storeId: undefined,
      };

  // Fetch current user data
  const fetchCurrentUser = useCallback(async () => {
    if (!user) return;

    setLoadingCurrentUser(true);
    try {
      const response = await UsersService.getUserById(user.uid);
      if (response.success && response.data) {
        setCurrentUser(response.data);
      } else {
        // User might not exist in database yet, this is normal for new users
        console.log("User profile not found in database");
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    } finally {
      setLoadingCurrentUser(false);
    }
  }, [user]);

  // Fetch users function
  const fetchUsers = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      let response: ApiResponse<UserData[]>;

      if (role) {
        response = await UsersService.getUsersByRole(role);
      } else if (storeId) {
        response = await UsersService.getUsersByStore(storeId);
      } else {
        response = await UsersService.getAllUsers();
      }

      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError(response.error?.message || "Failed to fetch users");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  }, [user, storeId, role]);

  // Create or update user
  const createOrUpdateUser = useCallback(
    async (
      userData: {
        email: string;
        role: UserRole;
        storeId: string;
      },
      isUpdate: boolean = false
    ): Promise<boolean> => {
      if (!user) return false;

      try {
        const userId = isUpdate ? user.uid : user.uid; // In real app, this might be different for creating other users
        const response = await UsersService.createOrUpdateUser(
          userId,
          userData,
          isUpdate
        );

        if (response.success) {
          // Update current user if updating self
          if (userId === user.uid) {
            setCurrentUser(response.data!);
          }

          // Refetch users list
          await fetchUsers();
          return true;
        } else {
          setError(response.error?.message || "Failed to save user");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error saving user:", err);
        return false;
      }
    },
    [user, fetchUsers]
  );

  // Update user role (admin only)
  const updateUserRole = useCallback(
    async (
      userId: string,
      newRole: UserRole,
      newStoreId: string
    ): Promise<boolean> => {
      if (!user || !currentUser) return false;

      try {
        const response = await UsersService.updateUserRole(
          userId,
          newRole,
          newStoreId
        );
        if (response.success) {
          // Update local state
          setUsers((prevUsers) =>
            prevUsers.map((u) =>
              u.id === userId ? { ...u, role: newRole, storeId: newStoreId } : u
            )
          );
          return true;
        } else {
          setError(response.error?.message || "Failed to update user role");
          return false;
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error updating user role:", err);
        return false;
      }
    },
    [user, currentUser]
  );

  // Setup real-time listener for users
  useEffect(() => {
    if (realTime && user && storeId) {
      const unsubscribe = UsersService.subscribeToUsersByStore(
        storeId,
        (updatedUsers) => {
          setUsers(updatedUsers);
          setError(null);
        },
        (error) => {
          setError(error.message);
          console.error("Real-time users error:", error);
        }
      );

      return unsubscribe;
    }
  }, [realTime, storeId, user]);

  // Auto-fetch current user on mount
  useEffect(() => {
    if (user) {
      fetchCurrentUser();
    }
  }, [user, fetchCurrentUser]);

  // Auto-fetch users list
  useEffect(() => {
    if (autoFetch && !realTime && currentUser) {
      fetchUsers();
    }
  }, [fetchUsers, autoFetch, realTime, currentUser]);

  return {
    users,
    currentUser,
    loading,
    loadingCurrentUser,
    error,
    createOrUpdateUser,
    updateUserRole,
    permissions,
    refetch: fetchUsers,
    fetchCurrentUser,
  };
};

"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useInvoices } from "@/hooks/useInvoices";
import { useStores } from "@/hooks/useStores";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import Sidebar from "@/components/Sidebar";
import InvoiceTable from "@/components/table/InvoiceTable";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import { ItemsPerPageOption } from "@/utils/firestore";

export default function Invoice() {
  const router = useRouter();
  const { user } = useAuth();
  const { getStoreById } = useStores();
  const [userData, setUserData] = useState<any>(null);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPageOption>(25);

  // Memoize pagination options to prevent infinite re-renders
  const paginationOptions = useMemo(
    () => ({
      page: currentPage,
      limit: itemsPerPage,
    }),
    [currentPage, itemsPerPage]
  );

  const tableHead = [
    "No",
    "Nomor Invoice",
    "Nama Customer",
    "Tanggal",
    "List Kain",
    "Total Warna",
    "Total Roll",
    "Total Yard",
    "Grand Total",
    "Status",
    "Notes",
  ];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const docRef = doc(db, "users", String(user?.uid));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      }
    };
    fetchUserData();
  }, [user]);

  // Fetch current store
  useEffect(() => {
    const fetchStore = async () => {
      if (userData?.storeId) {
        const store = await getStoreById(userData.storeId);
        setCurrentStore(store);
      }
    };
    fetchStore();
  }, [userData, getStoreById]);

  // Fetch invoices using the hook
  const { invoices, loading, error, pagination } = useInvoices({
    storeId: userData?.role === "boss" ? undefined : userData?.storeId,
    autoFetch: true,
    searchTerm,
    paginationOptions,
  });

  const [itemsModalVisible, setItemsModalVisible] = useState(false);

  // Handle page change
  const handlePageChange = async (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (limit: ItemsPerPageOption) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Loading state
  if (!user || !userData) {
    return (
      <ProtectedRoute>
        <IdleLogoutWrapper>
          <Sidebar>
            <div className="flex justify-center items-center h-full">
              <div className="text-xl">Loading...</div>
            </div>
          </Sidebar>
        </IdleLogoutWrapper>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <IdleLogoutWrapper>
        <Sidebar>
          <div className="flex flex-1 flex-col h-full w-full px-7 pt-9 pb-5">
            <div className="flex mb-5">
              <h1 className="text-lg mr-5 font-semibold">
                Data Invoice - {currentStore?.name || "Loading..."}
              </h1>
              <div className="grow"></div>
              <button
                onClick={() => router.push("/dashboard/invoice/create")}
                className="border border-gray-400 px-3 py-1 rounded-sm cursor-pointer hover:bg-gray-100"
              >
                <span className="text-xl">+</span> Buat Invoice
              </button>
            </div>

            <div className="flex gap-4 items-center mb-7">
              <input
                placeholder="Cari Invoice"
                className="border border-gray-400 rounded-sm w-[200px] py-1 px-2"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="text-gray-700">
                Total Invoice: {pagination?.totalItems || 0}
              </div>
            </div>

            {/* Show loading state */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-xl">Loading invoices...</div>
              </div>
            ) : error ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-xl text-red-500">Error: {error}</div>
              </div>
            ) : (
              <>
                {pagination && (
                  <InvoiceTable
                    tableData={invoices}
                    tableHead={tableHead}
                    pagination={pagination}
                  />
                )}
                {/* Pagination */}
                {pagination && pagination.totalItems > 0 && (
                  <div className="mt-6 pb-6">
                    <Pagination
                      pagination={pagination}
                      onPageChange={handlePageChange}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      disabled={loading}
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <Modal
            isOpen={itemsModalVisible}
            onClose={() => setItemsModalVisible(false)}
          >
            <div className="flex flex-col w-[900px] h-[700px] bg-white rounded-md p-10">
              Buat Invoice Baru
            </div>
          </Modal>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

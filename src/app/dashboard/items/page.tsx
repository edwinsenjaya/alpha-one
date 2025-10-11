"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import Sidebar from "@/components/Sidebar";
import ItemsTable from "@/components/table/ItemsTable";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import { useItems } from "@/hooks/useItems";
import { useUsers } from "@/hooks/useUsers";
import { useStores } from "@/hooks/useStores";
import { itemsType } from "@/types/table";
import { ItemsPerPageOption } from "@/utils/firestore";

export default function Items() {
  const tableHead = [
    "No",
    "Nama Kain",
    "Kode Warna",
    "Roll",
    "Tanggal Update",
    "Action",
  ];

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

  // Modal states
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [tambahBaruModalVisible, setTambahBaruModalVisible] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);

  // Selected item for operations
  const [selectedItem, setSelectedItem] = useState<itemsType | null>(null);

  // Update modal state
  const [rollAdjustment, setRollAdjustment] = useState(0);
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">();

  // Tambah Baru modal state
  const [newColorData, setNewColorData] = useState({
    color: "",
    roll: 0,
  });

  // Confirmation modal state
  const [confirmationData, setConfirmationData] = useState<{
    type: "update" | "tambahBaru";
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get current user data and permissions
  const { currentUser, loadingCurrentUser, permissions } = useUsers();

  // Get current user's store data
  const { getStoreById } = useStores();
  const [currentStore, setCurrentStore] = useState<any>(null);

  // Get items data with pagination
  const {
    items,
    loading,
    error,
    pagination,
    createItem,
    updateItem,
    deleteItem,
    goToPage,
    setItemsPerPage: updateItemsPerPage,
    lowStockItems,
    loadingLowStock,
  } = useItems({
    storeId: currentUser?.storeId,
    realTime: false, // Disable real-time for pagination
    searchTerm: searchTerm.trim() || undefined,
    paginationOptions,
  });

  // Fetch current store data
  useEffect(() => {
    const fetchStore = async () => {
      if (currentUser?.storeId) {
        const store = await getStoreById(currentUser.storeId);
        setCurrentStore(store);
      }
    };
    fetchStore();
  }, [currentUser, getStoreById]);

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

  // Handle Update button click (stock adjustment)
  const handleUpdateClick = (item: itemsType) => {
    setSelectedItem(item);
    setRollAdjustment(0);
    setUpdateModalVisible(true);
  };

  // Handle Tambah Baru button click (new color variant)
  const handleTambahBaruClick = (item: itemsType) => {
    setSelectedItem(item);
    setNewColorData({
      color: "",
      roll: 0,
    });
    setTambahBaruModalVisible(true);
  };

  // Show confirmation modal
  const showConfirmation = (
    type: "update" | "tambahBaru",
    message: string,
    onConfirm: () => void
  ) => {
    setConfirmationData({ type, message, onConfirm });
    setConfirmationModalVisible(true);
  };

  // Handle Update submission
  const handleUpdateSubmit = () => {
    if (!selectedItem || rollAdjustment === 0) return;

    const newRoll =
      adjustmentType === "add"
        ? selectedItem.roll + rollAdjustment
        : selectedItem.roll - rollAdjustment;

    if (newRoll < 0) {
      alert("Stock tidak bisa negatif!");
      return;
    }

    const message = `${
      adjustmentType === "add" ? "Tambah" : "Kurang"
    } ${rollAdjustment} rolls ke ${selectedItem.name} (${
      selectedItem.color
    })?\nStock baru: ${newRoll} rolls`;

    showConfirmation("update", message, async () => {
      if (!selectedItem || !currentUser) return;

      setIsSubmitting(true);
      try {
        const success = await updateItem(selectedItem.id, {
          roll: newRoll,
        });
        if (success) {
          setUpdateModalVisible(false);
          setSelectedItem(null);
        }
      } catch (err) {
        console.error("Error updating item:", err);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Handle Tambah Baru submission
  const handleTambahBaruSubmit = () => {
    if (
      !selectedItem ||
      !currentUser ||
      !newColorData.color ||
      newColorData.roll === undefined ||
      newColorData.roll <= 0
    )
      return;

    const message = `Create new color variant of ${selectedItem.name}?\nColor: ${newColorData.color}\nStock: ${newColorData.roll} rolls`;

    showConfirmation("tambahBaru", message, async () => {
      if (!selectedItem || !currentUser) return;

      setIsSubmitting(true);
      try {
        const itemData: Omit<itemsType, "id" | "createdAt" | "updatedAt"> = {
          name: selectedItem.name, // Same name as selected item
          color: parseInt(newColorData.color),
          roll: newColorData.roll || 0,
          storeId: currentUser.storeId,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        };

        const success = await createItem(itemData);
        if (success) {
          setTambahBaruModalVisible(false);
          setSelectedItem(null);
          setNewColorData({
            color: "",
            roll: 0,
          });
        }
      } catch (err) {
        console.error("Error creating new color variant:", err);
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  // Show loading while getting user data
  if (loadingCurrentUser) {
    return (
      <ProtectedRoute>
        <IdleLogoutWrapper>
          <Sidebar>
            <div className="flex justify-center items-center h-full w-full">
              <div className="text-xl">Loading...</div>
            </div>
          </Sidebar>
        </IdleLogoutWrapper>
      </ProtectedRoute>
    );
  }

  // Show error if user doesn't have permissions
  // if (!permissions.canCreateInvoice) {
  //   return (
  //     <ProtectedRoute>
  //       <IdleLogoutWrapper>
  //         <Sidebar>
  //           <div className="flex justify-center items-center h-full">
  //             <div className="text-xl text-red-500">
  //               You don't have permission to access this page
  //             </div>
  //           </div>
  //         </Sidebar>
  //       </IdleLogoutWrapper>
  //     </ProtectedRoute>
  //   );
  // }

  return (
    <ProtectedRoute>
      <IdleLogoutWrapper>
        <Sidebar>
          <div className="flex-1 flex-col h-full w-[calc(100%-200px)] px-7 pt-9 pb-5">
            <div className="flex mb-5">
              <h1 className="text-lg mr-5 font-semibold">
                Data Stock Kain - {currentStore?.name || "Loading..."}
              </h1>
              <div className="grow"></div>
              {/* Show low stock alerts */}
              {lowStockItems.length > 0 && (
                <div className="text-sm text-red-500 mr-4">
                  {lowStockItems.length} item(s) low stock
                </div>
              )}
            </div>

            <div className="flex gap-4 items-center mb-7">
              <input
                placeholder="Cari Kain"
                className="border border-gray-400 rounded-sm w-[200px] py-1 px-2"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="flex gap-4">
                <div className="text-gray-700">
                  Total Roll: {items.reduce((acc, item) => acc + item.roll, 0)}{" "}
                  rolls
                </div>
              </div>
            </div>

            {/* Show loading state */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-xl">Loading items...</div>
              </div>
            ) : (
              <>
                <ItemsTable
                  tableData={items}
                  tableHead={tableHead}
                  onUpdateClick={handleUpdateClick}
                  onTambahBaruClick={handleTambahBaruClick}
                />

                {/* Pagination */}
                {pagination && pagination.totalItems > 0 && (
                  <div className="mt-6">
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

          {/* Update Modal (Stock Adjustment) */}
          <Modal
            isOpen={updateModalVisible}
            onClose={() => setUpdateModalVisible(false)}
          >
            <div className="flex flex-col w-[500px] bg-white rounded-md p-8">
              <h2 className="mb-2">
                Update Stock - {selectedItem?.name} ({selectedItem?.color})
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Stock Sekarang: {selectedItem?.roll} rolls
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateSubmit();
                }}
              >
                <div className="flex flex-col mb-4">
                  <label className="mb-2">Perubahan yang dilakukan:</label>
                  <div className="flex gap-4 mb-4">
                    <label className="flex text-sm items-center">
                      <input
                        type="radio"
                        value="add"
                        onChange={(e) =>
                          setAdjustmentType(
                            e.target.value as "add" | "subtract"
                          )
                        }
                        checked={adjustmentType === "add"}
                        className="mr-2"
                      />
                      Tambah
                    </label>
                    {permissions.isBoss && (
                      <label className="flex text-sm items-center">
                        <input
                          type="radio"
                          value="subtract"
                          onChange={(e) =>
                            setAdjustmentType(
                              e.target.value as "add" | "subtract"
                            )
                          }
                          checked={adjustmentType === "subtract"}
                          className="mr-2"
                        />
                        Kurang
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex flex-col mb-6">
                  <label className="mb-2" htmlFor="roll-adjustment">
                    Jumlah Roll:
                  </label>
                  <input
                    type="number"
                    id="roll-adjustment"
                    className="border border-gray-600 rounded-md px-3 py-1"
                    onChange={(e) =>
                      setRollAdjustment(parseInt(e.target.value))
                    }
                    required
                    min="1"
                    disabled={isSubmitting}
                    placeholder="Masukkan jumlah roll"
                  />
                  {adjustmentType === "subtract" &&
                    selectedItem &&
                    rollAdjustment > selectedItem.roll && (
                      <span className="text-red-500 text-sm mt-1">
                        Tidak bisa mengurangi lebih dari stock sekarang (
                        {selectedItem.roll})
                      </span>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setUpdateModalVisible(false)}
                    className="border border-gray-600 text-sm rounded-md px-5 py-1 cursor-pointer hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-sm text-white rounded-md px-5 py-1 cursor-pointer hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isSubmitting ||
                      rollAdjustment <= 0 ||
                      !rollAdjustment ||
                      (adjustmentType === "subtract" &&
                        !!selectedItem &&
                        rollAdjustment > selectedItem.roll)
                    }
                  >
                    {isSubmitting ? "Memproses..." : "Update Stock"}
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          {/* Tambah Baru Modal (New Color Variant) */}
          <Modal
            isOpen={tambahBaruModalVisible}
            onClose={() => setTambahBaruModalVisible(false)}
          >
            <div className="flex flex-col w-[600px] bg-white rounded-md p-8">
              <h2 className="mb-6">Tambah Warna Baru - {selectedItem?.name}</h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTambahBaruSubmit();
                }}
              >
                <div className="flex flex-col mb-4">
                  <label className="mb-2" htmlFor="new-color-code">
                    Kode Warna:
                  </label>
                  <input
                    type="number"
                    id="new-color-code"
                    className="border border-gray-600 rounded-md px-3 py-1"
                    value={newColorData.color}
                    onChange={(e) =>
                      setNewColorData({
                        ...newColorData,
                        color: e.target.value,
                      })
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="Contoh: 124"
                  />
                </div>

                <div className="flex flex-col mb-6">
                  <label className="mb-2" htmlFor="new-roll">
                    Jumlah Roll:
                  </label>
                  <input
                    type="number"
                    id="new-roll"
                    className="border border-gray-600 rounded-md px-3 py-1"
                    onChange={(e) =>
                      setNewColorData({
                        ...newColorData,
                        roll: parseInt(e.target.value) || 0,
                      })
                    }
                    required
                    disabled={isSubmitting}
                    placeholder="Masukkan jumlah roll"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setTambahBaruModalVisible(false)}
                    className="border text-sm rounded-md px-5 py-1 cursor-pointer hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 text-sm text-white rounded-md px-5 py-1 cursor-pointer hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      isSubmitting ||
                      !newColorData.color ||
                      newColorData.roll === undefined ||
                      newColorData.roll <= 0
                    }
                  >
                    {isSubmitting ? "Menyimpan..." : "Tambah Warna Baru"}
                  </button>
                </div>
              </form>
            </div>
          </Modal>

          {/* Confirmation Modal */}
          <Modal
            isOpen={confirmationModalVisible}
            onClose={() => setConfirmationModalVisible(false)}
          >
            <div className="flex flex-col w-[400px] bg-white rounded-md p-8">
              <h2 className="text-lg mb-4">Konfirmasi</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">
                {confirmationData?.message}
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmationModalVisible(false)}
                  className="border text-sm rounded-md px-5 py-1 cursor-pointer hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setConfirmationModalVisible(false);
                    confirmationData?.onConfirm();
                  }}
                  className="bg-red-600 text-sm text-white rounded-md px-5 py-1 cursor-pointer hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </div>
          </Modal>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

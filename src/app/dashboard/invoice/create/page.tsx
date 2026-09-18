"use client";

import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useItems } from "@/hooks/useItems";
import { useInvoices } from "@/hooks/useInvoices";
import { useStores } from "@/hooks/useStores";
import { useUsers } from "@/hooks/useUsers";
import { ItemsType, ItemsInvoiceType, InvoiceStatus, InvoiceItemInput } from "@/types/table";
import CreateInvoiceTable from "@/components/table/CreateInvoiceTable";

export default function CreateInvoice() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentUser } = useUsers();
  const { getStoreById } = useStores();
  const { createInvoice } = useInvoices();

  const [customerName, setCustomerName] = useState("");
  const [status, setStatus] = useState<InvoiceStatus>("belum lunas");
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItemInput[]>([]);
  const [currentStore, setCurrentStore] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch items from the store
  const { items, loading: itemsLoading } = useItems({
    storeId: currentUser?.storeId,
    autoFetch: true,
    realTime: false,
  });

  // Group items by name for the dropdown
  const itemsByName = useMemo(() => {
    const grouped: Record<string, ItemsType[]> = {};
    items.forEach((item) => {
      if (!grouped[item.name]) {
        grouped[item.name] = [];
      }
      grouped[item.name].push(item);
    });
    return grouped;
  }, [items]);

  const itemNames = useMemo(
    () => Object.keys(itemsByName).sort(),
    [itemsByName],
  );

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

  // Add initial empty row
  useEffect(() => {
    if (invoiceItems.length === 0) {
      addNewItem();
    }
  }, []);

  // Add a new empty item to the invoice
  const addNewItem = () => {
    const newItem: InvoiceItemInput = {
      id: `temp-${Date.now()}-${Math.random()}`,
      itemId: "",
      name: "",
      color: "",
      roll: 0,
      yardsInput: "",
      yards: [],
      price: 0,
      total: 0,
    };
    setInvoiceItems([...invoiceItems, newItem]);
  };

  // Remove an item from the invoice
  const removeItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter((item) => item.id !== itemId));
  };

  // Update an invoice item field
  const updateInvoiceItem = (
    itemId: string,
    field: keyof InvoiceItemInput,
    value: any,
  ) => {
    setInvoiceItems(
      invoiceItems.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // If name changed, reset color and itemId
          if (field === "name") {
            updatedItem.color = "";
            updatedItem.itemId = "";
            updatedItem.roll = 0;
          }

          // If color changed, find the corresponding item and set itemId
          if (field === "color" && value && updatedItem.name) {
            const selectedItem = itemsByName[updatedItem.name]?.find(
              (i) => i.color.toString() === value,
            );
            if (selectedItem) {
              updatedItem.itemId = selectedItem.id;
              updatedItem.roll = 0; // Reset roll when color changes
            }
          }

          // If yards input changed, parse it
          if (field === "yardsInput") {
            const yardsArray = value
              .split(",")
              .map((y: string) => parseFloat(y.trim()))
              .filter((y: number) => !isNaN(y) && y > 0);
            updatedItem.yards = yardsArray;
            updatedItem.roll = yardsArray.length;
          }

          // Recalculate total
          const totalYards = updatedItem.yards.reduce((sum, y) => sum + y, 0);
          updatedItem.total = totalYards * updatedItem.price;

          return updatedItem;
        }
        return item;
      }),
    );
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    const validItems = invoiceItems.filter(
      (item) => item.itemId && item.yards.length > 0,
    );

    const uniqueColors = new Set(
      validItems.map((item) => `${item.name}-${item.color}`),
    );

    const totalRoll = validItems.reduce((sum, item) => sum + item.roll, 0);
    const totalYard = validItems.reduce(
      (sum, item) => sum + item.yards.reduce((s, y) => s + y, 0),
      0,
    );
    const grandTotal = validItems.reduce((sum, item) => sum + item.total, 0);

    return {
      totalColor: uniqueColors.size,
      totalRoll,
      totalYard,
      grandTotal,
    };
  }, [invoiceItems]);

  // Save invoice to Firestore
  const handleSave = async () => {
    try {
      // Validation
      if (!customerName.trim()) {
        alert("⚠️ Mohon masukkan nama customer");
        return;
      }

      const validItems = invoiceItems.filter(
        (item) => item.itemId && item.yards.length > 0 && item.price > 0,
      );

      if (validItems.length === 0) {
        alert("⚠️ Mohon tambahkan minimal 1 item dengan data lengkap");
        return;
      }

      // Check stock availability
      for (const invoiceItem of validItems) {
        const actualItem = items.find((i) => i.id === invoiceItem.itemId);
        if (!actualItem) {
          alert(
            `❌ Item ${invoiceItem.name} (${invoiceItem.color}) tidak ditemukan`,
          );
          return;
        }
        if (actualItem.roll < invoiceItem.roll) {
          alert(
            `❌ Stock tidak cukup untuk ${invoiceItem.name} (${invoiceItem.color}).\n` +
              `Tersedia: ${actualItem.roll} roll, Dibutuhkan: ${invoiceItem.roll} roll`,
          );
          return;
        }
      }

      if (!currentStore || !currentUser) {
        alert("❌ Data toko atau user tidak ditemukan");
        return;
      }

      // Confirm before saving
      const confirmed = window.confirm(
        `Konfirmasi pembuatan invoice:\n\n` +
          `Customer: ${customerName.trim()}\n` +
          `Status: ${
            status === "lunas"
              ? "Lunas"
              : status === "belum lunas"
                ? "Belum Lunas"
                : "Retur"
          }\n` +
          `Jumlah Item: ${validItems.length}\n` +
          `Grand Total: ${formatCurrency(summary.grandTotal)}\n\n` +
          `Stock akan dikurangi otomatis. Lanjutkan?`,
      );

      if (!confirmed) return;

      setIsSaving(true);

      // Prepare invoice data
      const invoiceItemsData: ItemsInvoiceType[] = validItems.map((item) => ({
        itemId: item.itemId,
        name: item.name,
        color: item.color,
        roll: item.roll,
        yards: item.yards,
        price: item.price,
        total: item.total,
      }));

      const invoiceData = {
        storeId: currentStore.id,
        customerName: customerName.trim(),
        status: status,
        notes: "",
        items: invoiceItemsData,
        totalColor: summary.totalColor,
        totalRoll: summary.totalRoll,
        totalYard: summary.totalYard,
        grandTotal: summary.grandTotal,
        createdBy: currentUser.id,
      };

      // Create invoice (this will also handle stock deduction through the service)
      const result = await createInvoice(invoiceData, currentStore);

      if (result) {
        alert("✅ Invoice berhasil dibuat!\nStock telah dikurangi otomatis.");
        router.push("/dashboard/invoice");
      } else {
        alert("❌ Gagal membuat invoice. Silakan coba lagi.");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("❌ Terjadi kesalahan saat membuat invoice");
    } finally {
      setIsSaving(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!user || !currentUser) {
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
          <div className="flex flex-col h-full w-full px-7 pt-9 pb-5 overflow-y-auto">
            {/* Header Section */}
            <div className="flex flex-col mb-6 w-full">
              <h1 className="text-lg font-semibold mb-2">Buat Invoice Baru</h1>
              <h2 className="text-sm text-gray-600">
                Cabang:{" "}
                <span className="font-semibold">
                  {currentStore?.name || "Loading..."}
                </span>
              </h2>
            </div>

            <div className="flex flex-col justify-center">
              {/* Customer Name Input */}
              <div className="flex items-center mb-7">
                <label className="font-medium me-3" htmlFor="customer_name">
                  Nama Customer:
                </label>
                <input
                  className="border border-gray-400 rounded px-3 py-2 flex-1 max-w-md focus:outline-none focus:ring-1 focus:ring-gray-400 me-5"
                  id="customer_name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama customer"
                  disabled={isSaving}
                />

                <div className="flex items-center gap-2">
                  <label className="font-medium" htmlFor="status">
                    Status:
                  </label>
                  <select
                    id="status"
                    className="border border-gray-400 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                    disabled={isSaving}
                  >
                    <option value="belum lunas">Belum Lunas</option>
                    <option value="lunas">Lunas</option>
                    <option value="retur">Retur</option>
                  </select>
                </div>

                <div className="flex-1"></div>
                <button
                  onClick={handleSave}
                  disabled={isSaving || itemsLoading || !customerName.trim()}
                  className="bg-blue-500 disabled:cursor-not-allowed text-white font-medium px-6 py-2 rounded text-sm transition-colors cursor-pointer"
                >
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>

              {/* Invoice Items Table */}
              {itemsLoading ? (
                <div className="text-center py-8 text-sm">Loading items...</div>
              ) : (
                <CreateInvoiceTable
                  invoiceItems={invoiceItems}
                  itemNames={itemNames}
                  itemsByName={itemsByName}
                  isSaving={isSaving}
                  formatCurrency={formatCurrency}
                  onUpdateItem={updateInvoiceItem}
                  onRemoveItem={removeItem}
                />
              )}

              {/* Add Item Button */}
              <div className="flex w-fit justify-center mt-6 mb-8">
                <button
                  onClick={addNewItem}
                  disabled={isSaving}
                  className="border border-gray-400 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded px-6 py-2 cursor-pointer transition-colors text-sm"
                >
                  + Tambah Item
                </button>
              </div>

              {/* Summary Section */}
              <div className="flex justify-end">
                <div className="flex flex-col border border-gray-300 rounded bg-gray-50 p-4 min-w-[280px]">
                  <div className="flex justify-between items-center gap-8 mb-2 pb-2 border-b border-gray-300">
                    <span className="font-semibold text-sm">Grand Total:</span>
                    <span className="font-bold text-base">{formatCurrency(summary.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between gap-8 mb-2">
                    <span className="text-sm text-gray-600">Jumlah Warna:</span>
                    <span className="text-sm">{summary.totalColor}</span>
                  </div>
                  <div className="flex justify-between gap-8 mb-2">
                    <span className="text-sm text-gray-600">Jumlah Roll:</span>
                    <span className="text-sm">{summary.totalRoll}</span>
                  </div>
                  <div className="flex justify-between gap-8">
                    <span className="text-sm text-gray-600">Total Yard:</span>
                    <span className="text-sm">{summary.totalYard}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

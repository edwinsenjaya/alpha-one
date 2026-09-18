"use client";

import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useStores } from "@/hooks/useStores";
import { UsersService } from "@/services/usersService";
import { InvoiceType, StoreData, UserData } from "@/types/table";
import { useParams, useRouter } from "next/navigation";

export default function DetailInvoice() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { getInvoiceById } = useInvoices();
  const { getStoreById } = useStores();

  const [invoice, setInvoice] = useState<InvoiceType | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [creator, setCreator] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!invoiceId) return;

      setLoading(true);
      try {
        const invoiceData = await getInvoiceById(invoiceId);
        if (invoiceData) {
          setInvoice(invoiceData);

          // Fetch store data
          const storeData = await getStoreById(invoiceData.storeId);
          setStore(storeData);

          // Fetch creator data
          const userResponse = await UsersService.getUserById(
            invoiceData.createdBy
          );
          if (userResponse.success && userResponse.data) {
            setCreator(userResponse.data);
          }
        } else {
          console.error("Invoice not found");
        }
      } catch (error) {
        console.error("Error fetching invoice details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [invoiceId, getInvoiceById, getStoreById]);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Helper to capitalize string
  const capitalize = (str: string) => {
    if (!str) return "";
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const tableHead = [
    "No",
    "Nama Kain",
    "Kode Warna",
    "Roll",
    "Satuan Yard",
    "Harga",
    "Total",
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <IdleLogoutWrapper>
          <Sidebar>
            <div className="flex justify-center items-center h-full">
              <div className="text-xl">Loading invoice details...</div>
            </div>
          </Sidebar>
        </IdleLogoutWrapper>
      </ProtectedRoute>
    );
  }

  if (!invoice) {
    return (
      <ProtectedRoute>
        <IdleLogoutWrapper>
          <Sidebar>
            <div className="flex flex-col justify-center items-center h-full">
              <div className="text-xl mb-4 text-red-600">Invoice not found</div>
              <button
                onClick={() => router.push("/dashboard/invoice")}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Back to Invoices
              </button>
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
          <div className="flex flex-col h-full w-full px-7 pt-9 pb-5 overflow-y-auto print:p-0 print:m-0 print:overflow-visible">
            {/* Header Section */}
            <div className="flex flex-col mb-6 w-full">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-semibold mb-2">Detail Invoice</h1>
                  <h2 className="text-sm text-gray-600">
                    Nomor Invoice:{" "}
                    <span className="font-semibold">
                      {invoice.invoiceNumber}
                    </span>
                  </h2>
                </div>
                <button
                  onClick={() => window.print()}
                  className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm transition-colors print:hidden"
                >
                  Download / Print PDF
                </button>
              </div>
              <div className="flex mt-4 gap-12">
                <h2 className="text-sm text-gray-600">
                  Cabang:{" "}
                  <span className="font-semibold">
                    {store?.name || "Loading..."}
                  </span>
                </h2>
                <h2 className="text-sm text-gray-600">
                  Dibuat Oleh:{" "}
                  <span className="font-semibold">
                    {creator?.email || "Unknown"}
                  </span>
                </h2>
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex flex-col w-fit">
                {/* Customer Info Section */}
                <div className="flex items-center mb-8 gap-10 bg-white p-4 border border-gray-200 rounded shadow-sm">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Nama Customer
                    </p>
                    <p className="font-medium text-lg">
                      {invoice.customerName}
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Tanggal
                    </p>
                    <p className="font-medium">{invoice.createdAt}</p>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-200"></div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">
                      Status
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        invoice.status === "lunas"
                          ? "bg-green-100 text-green-700"
                          : invoice.status === "belum lunas"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {capitalize(invoice.status)}
                    </span>
                  </div>
                </div>

                {/* Table Header */}
                <div className="flex w-fit">
                  {tableHead.map((headData, i) => (
                    <div
                      key={headData + i}
                      className={
                        i === tableHead.length - 1
                          ? "p-2 border-y border-x rounded-tr-sm text-[15px] font-medium bg-gray-50"
                          : i === 0
                          ? "p-2 border-y border-s rounded-tl-sm text-[15px] font-medium bg-gray-50"
                          : "p-2 border-y border-s text-[15px] font-medium bg-gray-50"
                      }
                      style={
                        headData === "No"
                          ? { width: "60px", textAlign: "center" }
                          : headData === "Nama Kain"
                          ? { width: "220px", textAlign: "center" }
                          : headData === "Kode Warna"
                          ? { width: "180px", textAlign: "center" }
                          : headData === "Roll"
                          ? { width: "80px", textAlign: "center" }
                          : headData === "Satuan Yard"
                          ? { width: "220px", textAlign: "center" }
                          : headData === "Harga"
                          ? { width: "160px", textAlign: "center" }
                          : headData === "Total"
                          ? { width: "160px", textAlign: "center" }
                          : { width: "70px", textAlign: "center" }
                      }
                    >
                      {headData}
                    </div>
                  ))}
                </div>

                {/* Invoice Items */}
                <div className="flex flex-col w-fit">
                  {invoice.items.map((item, index) => {
                    return (
                      <div key={index} className="flex hover:bg-gray-50">
                        {/* No */}
                        <div
                          className={
                            index === invoice.items.length - 1
                              ? "w-[60px] text-sm text-center p-2 border-b border-s rounded-bl-sm"
                              : "w-[60px] text-sm text-center p-2 border-b border-s"
                          }
                        >
                          {index + 1}
                        </div>

                        {/* Nama Kain */}
                        <div className="w-[220px] text-sm p-3 border-b border-s">
                          {item.name}
                        </div>

                        {/* Kode Warna */}
                        <div className="w-[180px] text-sm p-3 border-b border-s text-center">
                          {item.color}
                        </div>

                        {/* Roll */}
                        <div className="w-[80px] text-sm text-center p-3 border-b border-s">
                          {item.roll}
                        </div>

                        {/* Satuan Yard */}
                        <div className="w-[220px] text-sm p-3 border-b border-s">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {item.yards.map((yard, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 border border-gray-300 px-2 py-0.5 rounded text-xs"
                              >
                                {yard}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Harga */}
                        <div className="w-[160px] text-sm p-3 border-b border-s text-right">
                          {formatCurrency(item.price)}
                        </div>

                        {/* Total */}
                        <div className="w-[160px] text-sm text-right p-3 border-b border-x">
                          {formatCurrency(item.total)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Section */}
                <div className="flex w-full justify-end mt-8">
                  <div className="flex flex-col border border-gray-300 rounded w-fit bg-gray-50 p-4">
                    <div className="flex mb-2 pb-2 border-b border-gray-300">
                      <div className="w-[150px] text-end font-semibold text-sm">
                        Grand Total:
                      </div>
                      <div className="ml-6 font-bold text-base min-w-[150px] text-right">
                        {formatCurrency(invoice.grandTotal)}
                      </div>
                    </div>
                    <div className="flex mb-2">
                      <div className="w-[150px] text-end text-sm text-gray-600">
                        Jumlah Warna:
                      </div>
                      <div className="ml-6 text-sm min-w-[150px] text-right">
                        {invoice.totalColor}
                      </div>
                    </div>
                    <div className="flex mb-2">
                      <div className="w-[150px] text-end text-sm text-gray-600">
                        Jumlah Roll:
                      </div>
                      <div className="ml-6 text-sm min-w-[150px] text-right">
                        {invoice.totalRoll}
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-[150px] text-end text-sm text-gray-600">
                        Total Yard:
                      </div>
                      <div className="ml-6 text-sm min-w-[150px] text-right">
                        {invoice.totalYard}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <div className="mt-8 mb-10 print:hidden">
                  <button
                    onClick={() => router.push("/dashboard/invoice")}
                    className="text-blue-600 hover:underline text-sm flex items-center gap-2 cursor-pointer"
                  >
                    ← Kembali ke Daftar Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

"use client";

import { InvoiceType } from "@/types/table";
import { useRouter } from "next/navigation";
import { PaginationMetadata } from "@/utils/firestore";

interface InvoiceTableProps {
  tableHead: string[];
  tableData: InvoiceType[];
  pagination?: PaginationMetadata;
}

export default function InvoiceTable({
  tableHead,
  tableData,
  pagination,
}: InvoiceTableProps) {
  const router = useRouter();

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
    return str
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper to get item names list
  const getItemNamesList = (items: any[]) => {
    return items.map((item) => item.name).join(", ");
  };

  return (
    <div className="w-full h-auto overflow-auto">
      <div className="flex w-fit sticky top-0 z-10 bg-white">
        {tableHead.map((tableHeadData, i) => {
          return (
            <div
              key={tableHeadData}
              className={
                i === tableHead.length - 1
                  ? "p-2 border-y border-x border-gray-400 rounded-tr-sm text-[15px]"
                  : i === 0
                  ? "p-2 border-y border-s border-gray-400 rounded-tl-sm text-[15px]"
                  : "p-2 border-y border-s border-gray-400 text-[15px]"
              }
              style={
                tableHeadData === "No"
                  ? { width: "45px", textAlign: "center" }
                  : tableHeadData === "Nomor Invoice"
                  ? { width: "180px", textAlign: "center" }
                  : tableHeadData === "Nama Customer"
                  ? { width: "250px", textAlign: "center" }
                  : tableHeadData === "Tanggal"
                  ? { width: "200px", textAlign: "center" }
                  : tableHeadData === "List Kain"
                  ? { width: "240px", textAlign: "center" }
                  : tableHeadData === "Total Warna"
                  ? { width: "110px", textAlign: "center" }
                  : tableHeadData === "Total Roll"
                  ? { width: "100px", textAlign: "center" }
                  : tableHeadData === "Total Yard"
                  ? { width: "100px", textAlign: "center" }
                  : tableHeadData === "Grand Total"
                  ? { width: "150px", textAlign: "center" }
                  : tableHeadData === "Status"
                  ? { width: "120px", textAlign: "center" }
                  : { width: "200px", textAlign: "center" }
              }
            >
              {tableHeadData}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col w-fit">
        {tableData.map((invoice: InvoiceType, j) => {
          return (
            <div
              onClick={() => router.push(`/dashboard/invoice/${invoice.id}`)}
              className="flex cursor-pointer hover:bg-gray-100"
              key={invoice.id}
            >
              <div
                className={
                  j === tableData.length - 1
                    ? "w-[45px] text-sm text-center p-2 border-b border-s border-gray-400 rounded-bl-sm"
                    : "w-[45px] text-sm text-center p-2 border-b border-s border-gray-400"
                }
              >
                {pagination
                  ? j +
                    1 +
                    (pagination.currentPage - 1) * pagination.itemsPerPage
                  : j + 1}
              </div>
              <div className="w-[180px] text-sm p-2 border-b border-s border-gray-400">
                {invoice.invoiceNumber}
              </div>
              <div className="w-[250px] text-sm p-2 border-b border-s border-gray-400">
                {invoice.customerName}
              </div>
              <div className="w-[200px] text-sm p-2 border-b border-s border-gray-400">
                {invoice.createdAt}
              </div>
              <div className="w-[240px] text-sm p-2 border-b border-s border-gray-400">
                {getItemNamesList(invoice.items)}
              </div>
              <div className="w-[110px] text-sm text-center p-2 border-b border-s border-gray-400">
                {invoice.totalColor}
              </div>
              <div className="w-[100px] text-sm text-center p-2 border-b border-s border-gray-400">
                {invoice.totalRoll}
              </div>
              <div className="w-[100px] text-sm text-center p-2 border-b border-s border-gray-400">
                {invoice.totalYard}
              </div>
              <div className="w-[150px] text-sm text-right p-2 border-b border-s border-gray-400">
                {formatCurrency(invoice.grandTotal)}
              </div>
              <div className="w-[120px] text-sm text-center p-2 border-b border-s border-gray-400">
                <span
                  className={`px-2 py-1 rounded-sm text-xs ${
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
              <div
                className={
                  j === tableData.length - 1
                    ? "w-[200px] text-sm p-2 border-b border-x border-gray-400 rounded-br-sm truncate"
                    : "w-[200px] text-sm p-2 border-b border-x border-gray-400 truncate"
                }
              >
                {invoice.notes || "-"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

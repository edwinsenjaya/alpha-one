"use client";

import { invoiceType } from "@/types/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useRouter } from "next/navigation";

export default function InvoiceTable({
  tableHead,
  tableData,
}: {
  tableHead: string[];
  tableData: invoiceType[];
}) {
  const router = useRouter();
  return (
    <div className="w-full h-auto overflow-auto">
      <div className="flex w-auto">
        {tableHead.map((tableHeadData, i) => {
          return (
            <div
              key={tableHeadData}
              className={
                i === tableHead.length - 1
                  ? "p-2 border-y border-x rounded-tr-sm"
                  : i === 0
                  ? "p-2 border-y border-s rounded-tl-sm"
                  : "p-2 border-y border-s"
              }
              style={
                tableHeadData === "No"
                  ? { minWidth: "45px", textAlign: "center" }
                  : tableHeadData === "Nomor Invoice"
                  ? { minWidth: "165px", textAlign: "center" }
                  : tableHeadData === "Tanggal"
                  ? { minWidth: "150px", textAlign: "center" }
                  : tableHeadData === "List Kain"
                  ? { minWidth: "200px", textAlign: "center" }
                  : { minWidth: "120px", textAlign: "center" }
              }
            >
              {tableHeadData}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        {tableData.map((itemsData: invoiceType, j) => {
          return (
            <div
              onClick={() => router.push("/dashboard/invoice/1")}
              className="flex cursor-pointer"
              key={j}
            >
              <div
                className={
                  j === tableData.length - 1
                    ? "min-w-[45px] text-sm text-center p-2 border-b border-s rounded-bl-sm"
                    : "min-w-[45px] text-sm text-center p-2 border-b border-s"
                }
              >
                {j + 1}
              </div>
              <div className="min-w-[165px] text-sm p-2 border-b border-s">
                {itemsData.invoice_number}
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.customer_name}
              </div>
              <div className="min-w-[150px] max-w-[150px] text-sm p-2 border-b border-s">
                {format(itemsData.date, "EEEE, d MMMM yyyy HH:mm:ss", {
                  locale: id,
                })}
              </div>
              <div className="min-w-[200px] max-w-[200px] text-sm p-2 border-b border-s truncate text-ellipsis">
                Pololinen, Cey, Rayon Twill, Babydoll
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.total_color}
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.total_roll}
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.total_yard}
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                Rp 12.750.000
              </div>
              <div className="min-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.status}
              </div>
              <div className="min-w-[120px] max-w-[120px] text-sm p-2 border-b border-s">
                {itemsData.created_by}
              </div>
              <div
                className={
                  j === tableData.length - 1
                    ? "min-w-[120px] max-w-[120px] text-sm p-2 border-b border-x rounded-br-sm"
                    : "min-w-[120px] max-w-[120px] text-sm p-2 border-b border-x"
                }
              >
                {itemsData.notes}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

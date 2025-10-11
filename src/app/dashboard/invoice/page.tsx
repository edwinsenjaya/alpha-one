"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { exampleDataInvoice } from "@/firebase/temporaryData";
import ProtectedRoute from "@/components/ProtectedRoute";
import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import Sidebar from "@/components/Sidebar";
import InvoiceTable from "@/components/table/InvoiceTable";
import Modal from "@/components/Modal";

export default function Invoice() {
  const router = useRouter();

  const tableHead = [
    "No",
    "Nomor Invoice",
    "Customer",
    "Tanggal",
    "List Kain",
    "Jumlah Warna",
    "Jumlah Roll",
    "Total Yard",
    "Grand Total",
    "Status",
    "Dibuat Oleh",
    "Keterangan",
  ];

  const [itemsModalVisible, setItemsModalVisible] = useState(false);

  return (
    <ProtectedRoute>
      <IdleLogoutWrapper>
        <Sidebar>
          <div className="flex flex-col h-full w-[calc(100%-200px)] px-7 pt-9 pb-5">
            <div className="flex mb-5 w-full">
              <h1 className="text-xl">Data Invoice</h1>
              <div className="grow"></div>
              <button
                onClick={() => router.push("/dashboard/invoice/create")}
                className="border p-1 rounded-md cursor-pointer"
              >
                <span className="text-xl">+</span> Buat Invoices
              </button>
            </div>
            <input
              placeholder="Cari Invoice"
              className="border rounded-sm w-[200px] mb-7 py-1 px-2"
              type="text"
            />
            <InvoiceTable
              tableData={exampleDataInvoice}
              tableHead={tableHead}
            />
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

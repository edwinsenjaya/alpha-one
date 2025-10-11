"use client";

import { itemsType } from "@/types/table";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface ItemsTableProps {
  tableHead: string[];
  tableData: itemsType[];
  onUpdateClick: (item: itemsType) => void;
  onTambahBaruClick: (item: itemsType) => void;
}

export default function ItemsTable({
  tableHead,
  tableData,
  onUpdateClick,
  onTambahBaruClick,
}: ItemsTableProps) {
  return (
    <div className="w-full h-auto overflow-auto">
      <div className="flex w-fit">
        {tableHead.map((tableHeadData, i) => {
          return (
            <div
              key={tableHeadData}
              className={
                i === tableHead.length - 1
                  ? "p-2 border-y border-x rounded-tr-sm text-[15px]"
                  : i === 0
                  ? "p-2 border-y border-s rounded-tl-sm text-[15px]"
                  : "p-2 border-y border-s text-[15px]"
              }
              style={
                tableHeadData === "No"
                  ? { width: "45px", textAlign: "center" }
                  : tableHeadData === "Tanggal Update"
                  ? { width: "165px", textAlign: "center" }
                  : tableHeadData === "Nama Kain"
                  ? { width: "220px", textAlign: "center" }
                  : tableHeadData === "Kode Warna"
                  ? { width: "110px", textAlign: "center" }
                  : tableHeadData === "Roll"
                  ? { width: "100px", textAlign: "center" }
                  : { width: "240px", textAlign: "center" }
              }
            >
              {tableHeadData}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col w-fit">
        {tableData.map((itemsData: itemsType, j) => {
          return (
            <div className="flex hover:bg-gray-100" key={j}>
              <div
                className={
                  j === tableData.length - 1
                    ? "w-[45px] text-sm text-center p-2 border-b border-s rounded-bl-sm"
                    : "w-[45px] text-sm text-center p-2 border-b border-s"
                }
              >
                {j + 1}
              </div>
              <div className="w-[220px] text-sm p-2 border-b border-s">
                {itemsData.name}
              </div>
              <div className="w-[110px] text-sm p-2 border-b border-s">
                {itemsData.color || "-"}
              </div>
              <div className="w-[100px] text-sm text-center p-2 border-b border-s">
                {itemsData.roll}
              </div>
              <div className="w-[165px] text-sm p-2 border-b border-s">
                {itemsData.updatedAt}
              </div>
              <div
                className={
                  j === tableData.length - 1
                    ? "w-[240px] text-sm text-center p-2 border-b border-x rounded-br-sm"
                    : "w-[240px] text-sm text-center p-2 border-b border-x"
                }
              >
                <button
                  onClick={() => onUpdateClick(itemsData)}
                  className="border bg-blue-600 text-white py-1 px-2 rounded-sm mr-2 cursor-pointer"
                >
                  Update Stock
                </button>
                <button
                  onClick={() => onTambahBaruClick(itemsData)}
                  className="border bg-green-600 text-white py-1 px-2 rounded-sm cursor-pointer"
                >
                  Tambah Baru
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

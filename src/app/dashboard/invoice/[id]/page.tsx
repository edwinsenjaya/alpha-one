"use client";

import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

export default function detailInvoice({ params }: { params: any }) {
  const [itemList, setItemList] = useState([]);
  const yardTest1 = [68, 71];
  const yardTest2 = [61, 75, 72, 64];
  const tableHead = [
    "No",
    "Nama Kain",
    "Kode Warna",
    "Warna",
    "Roll",
    "Satuan Yard",
    "Harga",
    "Total",
  ];

  return (
    <ProtectedRoute>
      <IdleLogoutWrapper>
        <Sidebar>
          <div className="flex flex-col h-full w-[calc(100%-200px)] px-7 pt-9 pb-5">
            <div className="flex flex-col mb-5 w-full">
              <h1 className="text-xl mb-5">Detail Invoice</h1>
              <div className="flex">
                <h1 className="text-xl mr-[60px]">Cabang: Bandung</h1>
                <h1 className="text-lg">Dibuat Oleh : Admin Bandung</h1>
              </div>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex mb-7 w-[985px]">
                <div className="mr-2 font-bold">Nama Customer :</div>
                <div className="mr-10">Adam</div>
                <div className="mr-2 font-bold">Tanggal :</div>
                <div className="mr-10">25 April 2025</div>
                <div className="mr-2 font-bold">Status :</div>
                <div className="mr-10">LUNAS</div>
                <div className="grow"></div>
                <button className="border rounded text-[#3939fd] px-2 py-1 cursor-pointer b-3">
                  Download Invoice
                </button>
              </div>
              <div className="flex w-auto mb-3">
                {tableHead.map((tableHeadData) => {
                  return (
                    <div
                      key={tableHeadData}
                      className="border-b"
                      style={
                        tableHeadData === "No"
                          ? { width: "45px", textAlign: "center" }
                          : tableHeadData === "Nama Kain"
                          ? { width: "200px", textAlign: "center" }
                          : tableHeadData === "Kode Warna"
                          ? { width: "90px", textAlign: "center" }
                          : tableHeadData === "Warna"
                          ? { width: "100px", textAlign: "center" }
                          : tableHeadData === "Roll"
                          ? { width: "80px", textAlign: "center" }
                          : tableHeadData === "Satuan Yard"
                          ? { width: "180px", textAlign: "center" }
                          : tableHeadData === "Harga"
                          ? { width: "125px", textAlign: "center" }
                          : tableHeadData === "Total"
                          ? { width: "165px", textAlign: "center" }
                          : {}
                      }
                    >
                      {tableHeadData}
                    </div>
                  );
                })}
              </div>
              {/* Invoice Content */}
              <div className="flex mb-2">
                <div className="w-[45px] text-center">1</div>
                <div className="w-[200px] text-center">Polilinen</div>
                <div className="w-[90px] text-center">47</div>
                <div className="w-[100px] text-center">Biru</div>
                <div className="w-[80px] text-center">2</div>
                <div className="flex w-[180px] justify-center">
                  {yardTest1.map((yard, i) => {
                    return (
                      <div
                        key={i}
                        className={
                          i === yardTest1.length - 1
                            ? "border-x px-1"
                            : "border-s px-1"
                        }
                      >
                        {yard}
                      </div>
                    );
                  })}
                </div>
                <div className="w-[125px] text-center">Rp 13.500</div>
                <div className="w-[165px] text-center">Rp 1.876.500</div>
              </div>
              <div className="flex mb-2">
                <div className="w-[45px] text-center">2</div>
                <div className="w-[200px] text-center">Polilinen</div>
                <div className="w-[90px] text-center">25</div>
                <div className="w-[100px] text-center">Hitam</div>
                <div className="w-[80px] text-center">4</div>
                <div className="flex w-[180px] justify-center">
                  {yardTest2.map((yard, i) => {
                    return (
                      <div
                        key={i}
                        className={
                          i === yardTest2.length - 1
                            ? "border-x px-1"
                            : "border-s px-1"
                        }
                      >
                        {yard}
                      </div>
                    );
                  })}
                </div>
                <div className="w-[125px] text-center">Rp 13.000</div>
                <div className="w-[165px] text-center">Rp 3.536.000</div>
              </div>
              <div className="flex w-[985px] justify-center mb-[400px]"></div>
              <div className="flex flex-col border-t py-3 w-[985px]">
                <div className="flex">
                  <div className="w-[695px]"></div>
                  <div className="w-[125px] text-end">Grand Total :</div>
                  <div className="ml-4">Rp 5.412.500</div>
                </div>
                <div className="flex">
                  <div className="w-[695px]"></div>
                  <div className="w-[125px] text-end">Jumlah Warna :</div>
                  <div className="ml-4">2</div>
                </div>
                <div className="flex">
                  <div className="w-[695px]"></div>
                  <div className="w-[125px] text-end">Jumlah Roll :</div>
                  <div className="ml-4">6</div>
                </div>
                <div className="flex">
                  <div className="w-[695px]"></div>
                  <div className="w-[125px] text-end">Total Yard :</div>
                  <div className="ml-4">411</div>
                </div>
              </div>
            </div>
          </div>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

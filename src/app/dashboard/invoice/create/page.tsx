"use client";

import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function createInvoice() {
  const router = useRouter();
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
              <h1 className="text-xl mb-5">Buat Invoice</h1>
              <h1 className="text-xl">Cabang: Bandung</h1>
            </div>
            <div className="flex flex-col justify-center">
              <div className="flex mb-7 w-[985px]">
                <label className="mr-3" htmlFor="customer_name">
                  Nama Customer:
                </label>
                <input
                  className="border-b px-2 mb-1"
                  id="customer_name"
                  type="text"
                />
                <div className="grow"></div>
                <button
                  onClick={() => router.push("/dashboard/invoice")}
                  className="border rounded text-[#09904F] px-2 py-1 cursor-pointer"
                >
                  Simpan
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
                <div className="w-[90px] text-center text-[#AF3A1D] cursor-pointer">
                  X
                </div>
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
                <div className="w-[90px] text-center text-[#AF3A1D] cursor-pointer">
                  X
                </div>
              </div>
              <div className="flex mb-5">
                <div className="w-[45px] text-center">3</div>
                <div className="w-[200px] text-center">
                  <select
                    className="w-[200px] text-center"
                    name="select-items"
                    id="select-items"
                  >
                    <option value="pololinen">Pololinen</option>
                    <option value="rayonTwill">Rayon Twill</option>
                    <option value="babydoll">Babydoll</option>
                    <option value="cey">Cey</option>
                    <option value="turkishLinen">Turkish Linen</option>
                  </select>
                </div>
                <div className="w-[90px]">
                  <select
                    className="w-[90px] text-center"
                    name="select-color"
                    id="select-color"
                  >
                    <option value="-">-</option>
                    <option value="10">10</option>
                    <option value="623">623</option>
                    <option value="84">84</option>
                    <option value="179">179</option>
                  </select>
                </div>
                <div className="w-[100px] text-center">-</div>
                <div className="w-[80px] text-center">-</div>
                <div className="flex w-[180px]">
                  <input className="w-[180px] border-b" type="text" />
                </div>
                <div className="flex w-[125px] justify-center">
                  <span className="mr-1">Rp</span>
                  <input className="w-[80px] border-b" type="number" />
                </div>
                <div className="w-[165px] text-center">Rp 0</div>
                <div className="w-[90px] text-center text-[#AF3A1D] cursor-pointer">
                  X
                </div>
              </div>
              <div className="flex w-[985px] justify-center mb-[200px]">
                <button className="border border-dashed border-[#646464] rounded px-3 cursor-pointer">
                  + Tambah Item
                </button>
              </div>
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

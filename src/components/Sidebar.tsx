"use client";

import { logout } from "@/firebase/authFunctions";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { db } from "@/firebase/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { ReactNode, useEffect, useState } from "react";
import { useStores } from "@/hooks/useStores";
import {
  Square3Stack3DIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/solid";

export default function Sidebar({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData]: any = useState();
  const [currentStore, setCurrentStore] = useState<any>(null);
  async function testFirestore() {
    if (user) {
      const docRef = doc(db, "users", String(user?.uid));
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        setUserData(userData);
      }
    }
  }
  const { getStoreById } = useStores();

  useEffect(() => {
    console.log(user, "< user credential");
    testFirestore();
  }, [user]);

  useEffect(() => {
    const fetchStore = async () => {
      if (userData?.storeId) {
        const store = await getStoreById(userData.storeId);
        setCurrentStore(store);
      }
    };
    fetchStore();
  }, [userData, getStoreById]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      <div className="flex h-screen w-screen">
        <div className="flex flex-col w-[210px] h-full border-e border-gray-400 shadow-lg py-4">
          <div className="flex justify-center">
            <div className="flex justify-center w-[85%] mb-8 mt-1 pb-6 border-b border-gray-400">
              <img className="w-[100px]" src="/logo-text.png" alt="logo-text" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => {
                router.push("/dashboard/items");
              }}
              className={`flex w-[80%] items-center gap-2 text-[15px] cursor-pointer ps-3 py-2 rounded-md ${
                pathname.startsWith("/dashboard/items")
                  ? "bg-orange-100/70"
                  : "hover:bg-gray-100"
              }`}
            >
              <Square3Stack3DIcon className="w-5 h-5" /> Stock Kain
            </div>
            <div
              onClick={() => {
                router.push("/dashboard/invoice");
              }}
              className={`flex w-[80%] items-center gap-2 text-[15px] cursor-pointer ps-3 py-2 rounded-md ${
                pathname.startsWith("/dashboard/invoice")
                  ? "bg-orange-100/70"
                  : "hover:bg-gray-100"
              }`}
            >
              <ClipboardDocumentListIcon className="w-5 h-5" /> Invoice
            </div>
          </div>
          {/* <div className="cursor-pointer mb-8 px-8">Manage Users</div> */}
          <div className="grow"></div>
          <div className="flex px-2 justify-center">
            <div className="flex flex-col border border-gray-400 pb-3 rounded-xl">
              <div className="text-xs mb-2 text-center px-4 pt-4">
                {user?.email || ""}
              </div>
              <div className="text-xs mb-3 text-center px-4">
                {`${
                  userData?.role.charAt(0).toUpperCase() +
                    userData?.role.slice(1) || ""
                } - ${currentStore?.name || ""}`}
              </div>
              <div className="flex justify-center px-8">
                <button
                  className="border text-sm cursor-pointer p-1 rounded-md w-[100px] bg-red-500 text-white"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

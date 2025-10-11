"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import IdleLogoutWrapper from "@/components/IdleLogoutWrapper";
import Sidebar from "@/components/Sidebar";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Root() {
  const router = useRouter();
  useEffect(() => {
    router.push("/dashboard/items");
  }, []);

  return (
    <ProtectedRoute>
      <IdleLogoutWrapper>
        <Sidebar>
          <div className="flex flex-col justify-center items-center h-full m-auto">
            <div className="text-xl mb-5">Alpha One</div>
          </div>
        </Sidebar>
      </IdleLogoutWrapper>
    </ProtectedRoute>
  );
}

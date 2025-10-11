// components/PublicRoute.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard/items"); // redirect if already logged in
    }
  }, [user, loading, router]);

  if (loading) return <p>Loading...</p>;
  return <>{children}</>;
}

"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string; // Where to redirect authenticated users (optional)
}

export default function ProtectedRoute({
  children,
  redirectTo,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // If user is not authenticated, redirect to login
      router.push("/login");
    } else if (!loading && user && redirectTo) {
      // If user is authenticated and redirectTo is specified, redirect there
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  // Show loading while checking authentication or redirecting
  if (loading || !user || (user && redirectTo))
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );

  return <>{children}</>;
}

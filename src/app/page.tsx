"use client";

import ProtectedRoute from "@/components/ProtectedRoute";

export default function Root() {
  return (
    <ProtectedRoute redirectTo="/dashboard">
      {/* This content will never be shown since users are redirected */}
      <div />
    </ProtectedRoute>
  );
}

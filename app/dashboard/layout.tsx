"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/UserContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-950 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs text-zinc-500 font-bold">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

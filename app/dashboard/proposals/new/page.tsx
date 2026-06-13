"use client";

import React from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ProposalForm from "../ProposalForm";

export default function NewProposalPage() {
  const { user } = useUser();
  const router = useRouter();

  if (user && user.role !== "admin") {
    router.push("/dashboard/proposals");
    return null;
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">
          <button onClick={() => router.push("/dashboard/proposals")}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Proposals
          </button>
          <div className="mb-5">
            <h1 className="text-lg font-bold text-zinc-900">New Proposal</h1>
            <p className="text-xs text-zinc-500 mt-0.5">Upload the proposal PDF and enter client details.</p>
          </div>
          <ProposalForm />
        </main>
      </div>
    </div>
  );
}

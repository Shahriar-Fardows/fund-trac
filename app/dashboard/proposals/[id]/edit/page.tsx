"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter, useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import ProposalForm, { ProposalData } from "../../ProposalForm";

export default function EditProposalPage() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin") { router.push("/dashboard/proposals"); return; }
    (async () => {
      try {
        const res = await fetch(`/api/proposals/${id}`);
        if (!res.ok) throw new Error("Proposal not found.");
        setData(await res.json());
      } catch (e: any) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, [id, user, router]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8">
          <button onClick={() => router.push(`/dashboard/proposals/${id}`)}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 font-medium mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Proposal
          </button>
          <div className="mb-5"><h1 className="text-lg font-bold text-zinc-900">Edit Proposal</h1></div>
          {loading ? <p className="text-sm text-zinc-400">Loading…</p>
            : error ? <p className="text-sm text-red-500">{error}</p>
            : data ? <ProposalForm initial={data} /> : null}
        </main>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClipboardList, ShieldAlert, Sparkles, User, Calendar, Info } from "lucide-react";

interface AuditLog {
  _id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Define badges for actions
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("add")) {
      return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }
    if (act.includes("delete")) {
      return "bg-red-50 text-red-700 border border-red-100";
    }
    if (act.includes("edit") || act.includes("update") || act.includes("config")) {
      return "bg-amber-50 text-amber-700 border border-amber-100";
    }
    return "bg-zinc-50 text-zinc-700 border border-zinc-150";
  };

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 px-8 pb-8 space-y-6 overflow-y-auto">
          
          <div>
            <p className="text-xs text-zinc-500 font-medium">Historical log of all modifications, additions, and settings updates</p>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-500">
                        Retrieving security audit trail...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-zinc-400">
                        No logs recorded.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-zinc-55 transition-colors">
                        
                        {/* Timestamp */}
                        <td className="py-3.5 pl-2 font-medium text-zinc-500 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                          <span>
                            {new Date(log.timestamp).toLocaleString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </td>

                        {/* User email / name */}
                        <td className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-zinc-150 text-zinc-650 flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            <div>
                              <span className="block font-bold text-zinc-800">{log.userName}</span>
                              <span className="block text-[10px] text-zinc-400">{log.userEmail}</span>
                            </div>
                          </div>
                        </td>

                        {/* Action badge */}
                        <td className="py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${getActionBadge(log.action)}`}>
                            {log.action}
                          </span>
                        </td>

                        {/* Details */}
                        <td className="py-3.5 text-zinc-650 max-w-lg">
                          <div className="flex items-start gap-1.5">
                            <Info className="w-3.5 h-3.5 text-zinc-450 mt-0.5 flex-shrink-0" />
                            <p className="leading-relaxed">{log.details}</p>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

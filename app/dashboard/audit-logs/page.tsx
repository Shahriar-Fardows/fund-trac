"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { ClipboardList, ShieldAlert, Sparkles, User, Calendar, Info, Trash2 } from "lucide-react";
import { useUser } from "@/app/context/UserContext";
import Swal from "sweetalert2";

interface AuditLog {
  _id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AuditLogsPage() {
  const { user } = useUser();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const canDelete = user?.email === "shahriar@teachfosys.com";
  const colSpanCount = canDelete ? 6 : 4;

  const handleDeleteLog = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this audit log entry? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl border border-zinc-200 shadow-xl font-sans",
        title: "text-lg font-bold text-zinc-800",
        htmlContainer: "text-xs text-zinc-500",
        confirmButton: "px-4 py-2 rounded-xl text-xs font-semibold text-white",
        cancelButton: "px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700",
      }
    });

    if (!result.isConfirmed) return;

    try {
      setDeleteLoadingId(id);
      setActionError(null);
      
      Swal.fire({
        title: "Deleting...",
        text: "Please wait while the entry is being deleted.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch(`/api/audit-logs/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
      });

      if (res.ok) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        fetchLogs();
        Swal.fire({
          title: "Deleted!",
          text: "The audit log entry has been successfully deleted.",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        const data = await res.json();
        const errMsg = data.error || "Failed to delete log entry.";
        setActionError(errMsg);
        Swal.fire({
          title: "Error",
          text: errMsg,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (e: any) {
      const errMsg = e.message || "Connection error. Please try again.";
      setActionError(errMsg);
      Swal.fire({
        title: "Error",
        text: errMsg,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete ${selectedIds.length} selected audit log entries? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: `Yes, delete ${selectedIds.length} logs!`,
      cancelButtonText: "Cancel",
      background: "#ffffff",
      customClass: {
        popup: "rounded-2xl border border-zinc-200 shadow-xl font-sans",
        title: "text-lg font-bold text-zinc-800",
        htmlContainer: "text-xs text-zinc-500",
        confirmButton: "px-4 py-2 rounded-xl text-xs font-semibold text-white",
        cancelButton: "px-4 py-2 rounded-xl text-xs font-semibold text-zinc-700",
      }
    });

    if (!result.isConfirmed) return;

    try {
      setActionError(null);
      
      Swal.fire({
        title: "Deleting logs...",
        text: "Please wait while the selected entries are being deleted.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await fetch("/api/audit-logs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (res.ok) {
        setSelectedIds([]);
        fetchLogs();
        Swal.fire({
          title: "Deleted!",
          text: "The selected audit log entries have been successfully deleted.",
          icon: "success",
          confirmButtonColor: "#10b981",
          timer: 2000,
          timerProgressBar: true,
        });
      } else {
        const data = await res.json();
        const errMsg = data.error || "Failed to delete selected log entries.";
        setActionError(errMsg);
        Swal.fire({
          title: "Error",
          text: errMsg,
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (e: any) {
      const errMsg = e.message || "Connection error. Please try again.";
      setActionError(errMsg);
      Swal.fire({
        title: "Error",
        text: errMsg,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

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
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-zinc-600" />
                Audit Logs
              </h1>
              <p className="text-xs text-zinc-500 font-medium mt-1">Historical log of all modifications, additions, and settings updates</p>
            </div>
            
            {canDelete && selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-650 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 animate-in fade-in slide-in-from-right-4 duration-200 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            )}
          </div>

          {actionError && (
            <div className="bg-red-50 text-red-755 border border-red-200 px-4 py-3.5 rounded-xl text-xs font-semibold">
              {actionError}
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    {canDelete && (
                      <th className="pb-3 pl-2 w-8">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 cursor-pointer"
                          checked={logs.length > 0 && selectedIds.length === logs.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(logs.map((log) => log._id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="pb-3 pl-2">Timestamp</th>
                    <th className="pb-3">User</th>
                    <th className="pb-3">Action</th>
                    <th className="pb-3">Log Details</th>
                    {canDelete && <th className="pb-3 text-right pr-2 w-16">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-zinc-800">
                  {loading ? (
                    <tr>
                      <td colSpan={colSpanCount} className="py-6 text-center text-zinc-500">
                        Retrieving security audit trail...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={colSpanCount} className="py-6 text-center text-zinc-400">
                        No logs recorded.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => {
                      const isSelected = selectedIds.includes(log._id);
                      return (
                        <tr 
                          key={log._id} 
                          className={`hover:bg-zinc-50 transition-colors ${isSelected ? "bg-zinc-50/70" : ""}`}
                        >
                          {canDelete && (
                            <td className="py-3.5 pl-2">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-zinc-300 text-zinc-650 focus:ring-zinc-500 cursor-pointer"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds((prev) => [...prev, log._id]);
                                  } else {
                                    setSelectedIds((prev) => prev.filter((id) => id !== log._id));
                                  }
                                }}
                              />
                            </td>
                          )}

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

                          {canDelete && (
                            <td className="py-3.5 text-right pr-2">
                              <button
                                onClick={() => handleDeleteLog(log._id)}
                                disabled={deleteLoadingId === log._id}
                                className="text-zinc-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 inline-flex items-center justify-center cursor-pointer"
                                title="Delete Log Entry"
                              >
                                {deleteLoadingId === log._id ? (
                                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          )}

                        </tr>
                      );
                    })
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

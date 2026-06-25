"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import { Bell, Calendar, ChevronDown, ShieldAlert, Sparkles, LogOut, CheckCircle } from "lucide-react";
import { usePathname } from "next/navigation";

interface Alert {
  type: "warning" | "danger" | "info";
  title: string;
  message: string;
}

export default function Navbar() {
  const { user, selectedMonth, setSelectedMonth } = useUser();
  const pathname = usePathname();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  // Determine page title based on path
  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Dashboard Overview";
      case "/dashboard/contributions":
        return "Partner Contributions";
      case "/dashboard/transactions":
        return "Transaction Ledger";
      case "/dashboard/budgets":
        return "Monthly Budget Planning";
      case "/dashboard/audit-logs":
        return "Audit Trails";
      case "/dashboard/project-plans":
        return "Project Plans & Documents";
      default:
        return "Shahriar Finance";
    }
  };

  useEffect(() => {
    // Fetch notifications dynamically based on active month
    if (!selectedMonth || !user) return;

    const fetchAlerts = async () => {
      try {
        const response = await fetch(`/api/dashboard/stats?month=${selectedMonth}`);
        if (response.ok) {
          const data = await response.json();
          setAlerts(data.alerts || []);
        }
      } catch (e: any) {
        const msg = e?.message || "";
        if (e?.name === "TypeError" && (msg.includes("Failed to fetch") || msg.includes("fetch failed") || msg.includes("NetworkError"))) {
          // Suppress error log when offline, during server compilation or restarts
        } else {
          console.error("Failed to load alerts", e);
        }
      }
    };

    fetchAlerts();
    // Poll alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [selectedMonth, user]);



  return (
    <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      
      {/* Title */}
      <h2 className="text-xl font-bold text-zinc-900">{getPageTitle()}</h2>

      {/* Action Area */}
      <div className="flex items-center gap-6">
        
        {/* Month Picker */}
        <div className="flex items-center gap-2 border border-zinc-200 rounded-lg px-3 py-1.5 bg-zinc-50 hover:bg-zinc-100 transition-colors">
          <Calendar className="w-4 h-4 text-zinc-500" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-sm font-semibold text-zinc-700 outline-none cursor-pointer border-none p-0 focus:ring-0"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="relative p-2 rounded-full hover:bg-zinc-50 text-zinc-650 transition-colors border border-zinc-200"
          >
            <Bell className="w-5 h-5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-650 text-white rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white">
                {alerts.length}
              </span>
            )}
          </button>

          {showNotificationDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl py-2 z-30">
              <div className="px-4 py-2 border-b border-zinc-200 flex items-center justify-between">
                <span className="font-bold text-sm text-zinc-900">Notifications</span>
                {alerts.length > 0 && (
                  <span className="text-xs bg-red-50 text-red-650 px-2 py-0.5 rounded-full font-semibold">
                    {alerts.length} Pending
                  </span>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
                    <CheckCircle className="w-8 h-8 text-zinc-300 mb-2" />
                    <span className="text-xs">All budgets and balances in order</span>
                  </div>
                ) : (
                  alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 flex gap-3 text-left"
                    >
                      <ShieldAlert
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          alert.type === "danger"
                            ? "text-red-650"
                            : alert.type === "warning"
                            ? "text-yellow-650"
                            : "text-blue-650"
                        }`}
                      />
                      <div>
                        <span className="block text-xs font-bold text-zinc-900">
                          {alert.title}
                        </span>
                        <p className="text-xs text-zinc-650 leading-relaxed mt-0.5">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Quick Info */}
        <div className="flex items-center gap-3 border-l border-zinc-200 pl-6">
          <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : "US"}
          </div>
          <div className="text-left hidden md:block">
            <span className="block text-xs font-bold text-zinc-800">{user?.name}</span>
            <span className="block text-[10px] text-zinc-400 capitalize">{user?.role} Mode</span>
          </div>
        </div>

      </div>

    </header>
  );
}

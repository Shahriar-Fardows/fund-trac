"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/app/context/UserContext";
import {
  LayoutDashboard,
  Coins,
  FileSpreadsheet,
  PieChart,
  ClipboardList,
  LogOut,
  Building,
  User,
  Shield,
  Users,
  RefreshCw,
  FileSignature,
  Briefcase,
  FileText,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useUser();

  const allMenuItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, adminOnly: false },
    { name: "Contributions", path: "/dashboard/contributions", icon: Coins, adminOnly: false },
    { name: "Ledger", path: "/dashboard/transactions", icon: FileSpreadsheet, adminOnly: false },
    { name: "Proposals", path: "/dashboard/proposals", icon: FileSignature, adminOnly: false },
    { name: "Project Plans", path: "/dashboard/project-plans", icon: FileText, adminOnly: false },
    { name: "Clients", path: "/dashboard/clients", icon: Briefcase, adminOnly: false },
    { name: "Recurring", path: "/dashboard/recurring", icon: RefreshCw, adminOnly: false },
    { name: "Budget Planning", path: "/dashboard/budgets", icon: PieChart, adminOnly: false },
    { name: "Audit Trail", path: "/dashboard/audit-logs", icon: ClipboardList, adminOnly: false },
    { name: "Team Members", path: "/dashboard/members", icon: Users, adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );


  return (
    <aside className="w-64 border-r border-zinc-200 bg-white flex flex-col h-screen fixed left-0 top-0 z-20">
      
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-zinc-200">
        <div className="w-8 h-8 bg-zinc-900 text-white rounded-lg flex items-center justify-center shadow-md">
          <Building className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg text-zinc-900">TF Finance</span>
          <span className="block text-[10px] text-zinc-400 font-semibold tracking-wider uppercase">Finance Hub</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-zinc-200">
        <div className="flex items-center gap-3 px-2 py-3 bg-zinc-50 rounded-xl mb-3">
          <div className="w-9 h-9 bg-zinc-200 rounded-lg flex items-center justify-center text-zinc-700 font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-zinc-900 truncate">
              {user?.name || "Loading..."}
            </span>
            <span className="flex items-center gap-1 text-xs text-zinc-500 capitalize">
              <Shield className="w-3 h-3 text-zinc-400" />
              {user?.role || "Viewer"}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white hover:bg-red-50 text-zinc-650 hover:text-red-650 border border-zinc-200 hover:border-red-200 rounded-lg text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}

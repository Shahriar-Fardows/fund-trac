"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import {
  Users, Plus, Trash2, Shield, Eye, Mail,
  User, Lock, ChevronLeft, Save, ShieldAlert,
} from "lucide-react";
import Swal from "sweetalert2";

interface Member {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "viewer";
}

export default function MembersPage() {
  const { user } = useUser();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [memberRole, setMemberRole] = useState<"viewer" | "admin">("viewer");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== "admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", {
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
        },
      });
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchMembers();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
        },
        body: JSON.stringify({ name, email, password, memberRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create member.");

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setMemberRole("viewer");
      setShowForm(false);
      fetchMembers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Remove this member's access?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, remove access!",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }
      Swal.fire({
        title: "Removed!",
        text: "The member's access has been removed.",
        icon: "success",
        confirmButtonColor: "#10b981",
      });
      fetchMembers();
    } catch (err: any) {
      Swal.fire({
        title: "Error!",
        text: err.message,
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  if (user?.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500 font-medium">
              Manage who has access to Teachfosys Finance
            </p>
            <button
              onClick={() => { setShowForm(!showForm); setError(""); }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          </div>

          {/* Add Member Form — inline card, not a popup */}
          {showForm && (
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-zinc-900">Add New Member</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">Create a login account for a team member or partner.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sakif Ahmed"
                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="memberEmail">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="memberEmail"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="sakif@company.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700" htmlFor="memberPassword">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="memberPassword"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-zinc-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMemberRole("viewer")}
                        className={`py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          memberRole === "viewer"
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        Viewer
                      </button>
                      <button
                        type="button"
                        onClick={() => setMemberRole("admin")}
                        className={`py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          memberRole === "admin"
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <Shield className="w-4 h-4" />
                        Admin
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {memberRole === "viewer"
                        ? "Viewer can see dashboards and export data, but cannot add or edit records."
                        : "Admin has full access to add, edit, and delete all records."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Creating..." : "Create Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="px-6 py-2.5 border border-zinc-200 hover:bg-zinc-50 text-zinc-700 rounded-lg font-semibold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100">
              <h2 className="font-bold text-sm text-zinc-900">Team Members</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{members.length} account{members.length !== 1 ? "s" : ""} in this workspace</p>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-sm">Loading members...</div>
            ) : members.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 text-sm">No members found.</div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {members.map((m) => (
                  <div key={m._id} className="flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700 font-bold text-sm">
                        {m.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-semibold text-sm text-zinc-900">{m.name}</span>
                        <span className="block text-xs text-zinc-400">{m.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Role badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                        m.role === "admin"
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200"
                      }`}>
                        {m.role === "admin" ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {m.role === "admin" ? "Admin" : "Viewer"}
                      </span>

                      {/* Cannot delete self */}
                      {m.email !== user?.email && (
                        <button
                          onClick={() => handleDelete(m._id)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove access"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {m.email === user?.email && (
                        <span className="text-[10px] text-zinc-400 font-medium px-2">You</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}

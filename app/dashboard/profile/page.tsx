"use client";

import React, { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import {
  User, Mail, Shield, Eye, Lock,
  CheckCircle, ShieldAlert, KeyRound,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useUser();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-email": user?.email || "",
          "x-user-role": user?.role || "",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");

      setSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full pr-10 py-2.5 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 text-sm bg-white";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">

          {/* Account Info Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-zinc-100">
              <h1 className="text-base font-bold text-zinc-900">My Account</h1>
              <p className="text-xs text-zinc-500 mt-0.5">Your profile information and account settings.</p>
            </div>

            <div className="px-8 py-6">
              <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center text-white font-bold text-2xl shadow-md">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-900">{user?.name || "—"}</h2>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${
                    user?.role === "admin"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 border border-zinc-200"
                  }`}>
                    {user?.role === "admin" ? <Shield className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {user?.role === "admin" ? "Administrator" : "Viewer"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Full Name</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-800 font-medium">{user?.name || "—"}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Email Address</label>
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-lg">
                    <Mail className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-sm text-zinc-800 font-medium">{user?.email || "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-zinc-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900">Change Password</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Update your login password securely.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="px-8 py-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* 3-column grid: Current | New | Confirm */}
              <div className="grid grid-cols-3 gap-5">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="currentPassword">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="currentPassword"
                      type={showCurrent ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Your current password"
                      className={`pl-10 ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="newPassword">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="newPassword"
                      type={showNew ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className={`pl-10 ${inputClass}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Password strength indicator */}
                  {newPassword && (
                    <div className="flex gap-1 mt-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            newPassword.length >= level * 2
                              ? newPassword.length < 6
                                ? "bg-red-400"
                                : newPassword.length < 10
                                ? "bg-amber-400"
                                : "bg-emerald-500"
                              : "bg-zinc-200"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-zinc-700" htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={`pl-10 ${inputClass} ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-300 focus:ring-red-400"
                          : confirmPassword && confirmPassword === newPassword
                          ? "border-emerald-300 focus:ring-emerald-400"
                          : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-700"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && confirmPassword === newPassword && (
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">✓ Passwords match</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {isSubmitting ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>

        </main>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, Mail, Lock, CheckCircle, ShieldAlert } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  // If admin already exists, redirect to login
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/auth/setup-status");
        if (res.ok) {
          const data = await res.json();
          if (data.adminExists) {
            router.push("/login");
            return;
          }
        }
      } catch (e) {}
      setChecking(false);
    };
    checkSetup();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed.");
      }

      // Registration successful — go to login
      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-zinc-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-zinc-900 text-white rounded-xl flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            First-Time Setup
          </h1>
          <p className="text-sm text-zinc-500">
            Create your admin account to get started with Fund Trac.
          </p>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-3 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-600">
          <CheckCircle className="w-4 h-4 text-zinc-500 mt-0.5 flex-shrink-0" />
          <span>This setup screen will only appear once. After creating your admin account, this page will no longer be accessible.</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="name">
              Full Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <User className="w-4 h-4" />
              </span>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="email">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-zinc-700" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-2.5 rounded-lg font-semibold transition-colors disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Creating account..." : "Create Admin Account"}
          </button>
        </form>

      </div>
    </main>
  );
}

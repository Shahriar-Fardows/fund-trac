"use client";

import React, { useState } from "react";
import {
  Check,
  Building,
  Mail,
  Phone,
  Globe,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock,
  Zap,
} from "lucide-react";
import Confetti from "@/app/components/Confetti";

export default function ClientOnboardPage() {
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    website: "",
    notes: "",
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.email) {
      setError("Full Name and Contact Email are required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/clients/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          projectBudget: 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Something went wrong. Please check your inputs.");
      }
    } catch (err: any) {
      setError("Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-12 bg-white">
      
      {/* LEFT COLUMN: Branding & Value Proposition (Dark Panel) */}
      <div className="relative hidden md:flex md:col-span-5 bg-zinc-950 text-zinc-100 flex-col justify-between p-8 md:p-12 overflow-hidden md:border-r border-zinc-900">
        
        {/* Background Gradients & Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293706_1px,transparent_1px),linear-gradient(to_bottom,#1f293706_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

        {/* Content Top */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900/80 border border-zinc-800 rounded-full text-xs font-semibold text-emerald-400 shadow-sm mb-8">
            <Sparkles className="w-3.5 h-3.5" /> Client Portal
          </div>
          
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Let's build <br />
            something <span className="text-emerald-400">extraordinary</span>.
          </h1>
          
          <p className="text-xs md:text-sm text-zinc-400 mt-4 max-w-md leading-relaxed">
            Welcome to the Shahriar onboarding portal. Share your project requirements on the right to auto-create your client profile and project workspace.
          </p>
        </div>

        {/* Value Points List */}
        <div className="relative z-10 my-10 space-y-5 max-w-md">
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Instant Registration</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Your workspace and account manager profile are initialized dynamically on submit.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Centralized Tracking</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Access sent proposals, review digital agreements, and track financial transactions securely.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-md">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">24-Hour Alignment</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Our operations team reviews your service requests and contacts you within one business day.
              </p>
            </div>
          </div>
        </div>

        {/* Content Footer */}
        <div className="relative z-10 pt-4 border-t border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
          <span>Shahriar Agency Platform</span>
          <span className="text-zinc-500 font-semibold normal-case">
            Need help? <a href="mailto:info@shahriar.com" className="text-emerald-400 hover:underline">info@shahriar.com</a>
          </span>
        </div>
      </div>

      {/* RIGHT COLUMN: Onboarding Form & Success Panel (Flat, Clean) */}
      <div className="md:col-span-7 flex flex-col justify-center p-8 sm:p-12 md:p-16 lg:p-24 bg-white overflow-y-auto">
        <div className="w-full max-w-2xl mx-auto">
          
          {success ? (
            /* Success State (Flat/Borderless) */
            <div className="text-center py-6 animate-in fade-in zoom-in duration-300">
              <Confetti />
              
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm shadow-emerald-100">
                <Check className="w-8 h-8 stroke-[2.5px]" />
              </div>

              <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
                Profile Onboarded Successfully!
              </h1>
              
              <p className="text-xs md:text-sm text-zinc-500 mt-4 leading-relaxed">
                Thank you for choosing Shahriar. We have successfully registered your company profile and services request in our database.
              </p>

              <div className="bg-zinc-50 border border-zinc-150 rounded-2xl p-5 my-7 text-left space-y-2.5 max-w-md mx-auto">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Submitted Details</div>
                <div className="text-sm font-bold text-zinc-900">{formData.name}</div>
                {formData.companyName && <div className="text-xs text-zinc-650 font-semibold">{formData.companyName}</div>}
                <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5 border-t border-zinc-200/70 pt-2.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" /> {formData.email}
                </div>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                An onboarding specialist has been assigned to your profile. We will contact you at your business email to schedule a kick-off call.
              </p>
            </div>
          ) : (
            /* Form State (Flat/Borderless) */
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight font-sans">Onboarding Request</h2>
                <p className="text-xs text-zinc-550 mt-1.5 font-medium">
                  Please fill out the details below. Required fields are marked with an asterisk (*).
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-750 border border-red-150 px-4 py-3.5 rounded-xl text-xs font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-xs md:text-sm">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-zinc-400" /> Full Name <span className="text-emerald-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all"
                      placeholder="e.g. Shahriar Fardows"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-zinc-400" /> Contact Email <span className="text-emerald-500 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all"
                      placeholder="e.g. client@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-zinc-400" /> Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all"
                      placeholder="e.g. Acme Corporation"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-zinc-400" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all"
                      placeholder="e.g. +880 1700-000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-zinc-400" /> Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all"
                    placeholder="e.g. https://mybrand.com"
                  />
                </div>

                <div>
                  <label className="block text-zinc-700 font-bold mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-zinc-400" /> Brief Project Notes
                  </label>
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-zinc-50/50 border border-zinc-200/80 rounded-xl px-4 py-3.5 text-xs md:text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:bg-white focus:ring-1 focus:ring-zinc-900/5 transition-all resize-none"
                    placeholder="Outline your targets, features, timeline expectations..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl text-xs md:text-sm transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Onboarding Request <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}

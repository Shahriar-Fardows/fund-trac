"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit2,
  X,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";

interface ProjectPlan {
  _id: string;
  name: string;
  description: string;
  docLink: string;
  status?: string;
  createdAt: string;
}

const getStatusConfig = (status?: string) => {
  const s = (status || "Planning").toLowerCase();
  switch (s) {
    case "working":
      return {
        bg: "bg-blue-50 text-blue-700 border-blue-200/50",
        hoverBorder: "hover:border-blue-400/80 hover:shadow-blue-500/10",
        iconBg: "bg-blue-600 text-white shadow-blue-500/20",
        indicator: "bg-blue-500",
      };
    case "implementation":
      return {
        bg: "bg-indigo-50 text-indigo-700 border-indigo-200/50",
        hoverBorder: "hover:border-indigo-400/80 hover:shadow-indigo-500/10",
        iconBg: "bg-indigo-600 text-white shadow-indigo-500/20",
        indicator: "bg-indigo-500",
      };
    case "completed":
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200/50",
        hoverBorder: "hover:border-emerald-400/80 hover:shadow-emerald-500/10",
        iconBg: "bg-emerald-500 text-white shadow-emerald-500/20",
        indicator: "bg-emerald-500",
      };
    case "planning":
    default:
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200/50",
        hoverBorder: "hover:border-amber-400/80 hover:shadow-amber-500/10",
        iconBg: "bg-amber-500 text-white shadow-amber-500/20",
        indicator: "bg-amber-500",
      };
  }
};

export default function ProjectPlansPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState<ProjectPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProjectPlan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    docLink: "",
    status: "Planning",
  });

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/project-plans", {
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
      });
      if (res.ok) {
        setPlans(await res.json());
      }
    } catch (e) {
      console.error("Error fetching project plans:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  const handleAddClick = () => {
    setEditingPlan(null);
    setFormData({ name: "", description: "", docLink: "", status: "Planning" });
    setShowModal(true);
  };

  const handleEditClick = (plan: ProjectPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      docLink: plan.docLink,
      status: plan.status || "Planning",
    });
    setShowModal(true);
  };

  const handleDeleteClick = async (plan: ProjectPlan) => {
    const result = await Swal.fire({
      title: "Delete Project Plan?",
      text: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/project-plans/${plan._id}`, {
        method: "DELETE",
        headers: {
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
      });

      if (res.ok) {
        Swal.fire({
          title: "Deleted!",
          text: "Project plan has been deleted successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPlans();
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to delete project plan.", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.description.trim() || !formData.docLink.trim()) {
      Swal.fire("Error", "All fields are required.", "error");
      return;
    }

    // Basic URL validation
    try {
      new URL(formData.docLink.trim());
    } catch (err) {
      Swal.fire("Error", "Please provide a valid document link URL.", "error");
      return;
    }

    try {
      const isEdit = !!editingPlan;
      const url = isEdit ? `/api/project-plans/${editingPlan._id}` : "/api/project-plans";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        Swal.fire({
          title: isEdit ? "Updated!" : "Created!",
          text: isEdit ? "Project plan updated successfully." : "New project plan added successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowModal(false);
        fetchPlans();
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to save project plan.", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const query = searchQuery.toLowerCase();
      return (
        plan.name.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)
      );
    });
  }, [plans, searchQuery]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Project Plans & Documents</h1>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Access official project documentation, guides, plan proposals, and shared files.
              </p>
            </div>
            
            {user?.role === "admin" && (
              <button
                onClick={handleAddClick}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Project Plan
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search plans by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50"
              />
            </div>
          </div>

          {/* Plans Grid */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            {loading ? (
              <div className="py-12 text-center text-zinc-400 text-xs">
                Loading project plans...
              </div>
            ) : filteredPlans.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                No project plans found. {user?.role === "admin" && 'Click "Add Project Plan" to get started.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPlans.map((plan) => {
                  const config = getStatusConfig(plan.status);
                  return (
                    <div
                      key={plan._id}
                      className={`group relative bg-white border border-zinc-200 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${config.hoverBorder}`}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl ${config.iconBg} flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-105`}>
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-bold text-base text-zinc-900 tracking-tight line-clamp-1 group-hover:text-zinc-950">
                                {plan.name}
                              </h3>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-block text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                                  Document Plan
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border ${config.bg}`}>
                              <span className={`w-1 h-1 rounded-full ${config.indicator}`} />
                              {plan.status || "Planning"}
                            </span>
                            {user?.role === "admin" && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                  onClick={() => handleEditClick(plan)}
                                  className="p-1.5 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-50 rounded-lg transition-colors"
                                  title="Edit Plan"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(plan)}
                                  className="p-1.5 text-zinc-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Plan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      <p className="text-sm text-zinc-600 leading-relaxed min-h-[48px] line-clamp-3">
                        {plan.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                          Created Date
                        </span>
                        <span className="text-sm text-zinc-700 font-semibold mt-0.5">
                          {new Date(plan.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <a
                        href={plan.docLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-sm hover:shadow hover:gap-2"
                      >
                        View Doc <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px]"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
              <h2 className="text-sm font-bold text-zinc-900">
                {editingPlan ? `Edit Project Plan: ${editingPlan.name}` : "Add New Project Plan"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-zinc-600 font-bold mb-1.5">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                  placeholder="e.g. Next.js Migration Proposal"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold mb-1.5">Short Description *</label>
                <textarea
                  rows={3}
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none resize-none"
                  placeholder="e.g. Architectural outline and timeline for migrating the core dashboard to Next.js 15 App Router."
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold mb-1.5">Document Link (URL) *</label>
                <input
                  type="url"
                  required
                  value={formData.docLink}
                  onChange={(e) => setFormData({ ...formData, docLink: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                  placeholder="e.g. https://docs.google.com/document/d/... or Notion link"
                />
              </div>

              <div>
                <label className="block text-zinc-600 font-bold mb-1.5">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none bg-white"
                >
                  <option value="Planning">Planning</option>
                  <option value="Working">Working</option>
                  <option value="Implementation">Implementation</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div className="border-t border-zinc-200 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingPlan ? "Save Changes" : "Add Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/Sidebar";
import Navbar from "@/app/components/Navbar";
import { useRouter } from "next/navigation";
import {
  Plus,
  Briefcase,
  Search,
  Share2,
  Mail,
  Phone,
  Globe,
  Trash2,
  Edit2,
  X,
  Eye,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import Swal from "sweetalert2";

interface ClientProfile {
  _id: string;
  name: string;
  companyName?: string;
  email: string;
  phone?: string;
  website?: string;
  status: "pending" | "lead" | "active" | "inactive";
  notes?: string;
  services: string[];
  projectBudget: number;
  onboardedVia: "admin" | "public_form";
  onboardedAt: string;
  createdAt: string;
}

interface Proposal {
  _id: string;
  proposalNumber?: string;
  clientName: string;
  clientEmail: string;
  projectName?: string;
  totalPrice?: number;
  currency: string;
  status: string;
  createdAt: string;
}

interface Transaction {
  _id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  client?: string;
  project?: string;
  status: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-blue-50 text-blue-700 border-blue-200",
  lead: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-zinc-100 text-zinc-650 border-zinc-200",
};

const AVAILABLE_SERVICES = [
  "Web Development",
  "App Development",
  "Software Development",
  "UI/UX Design",
  "SEO & Digital Marketing",
  "Graphics Design",
  "Dedicated Hiring",
  "Support & Maintenance",
];

export default function ClientsPage() {
  const { user } = useUser();
  const router = useRouter();

  // State
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modals / Details
  const [activeClient, setActiveClient] = useState<ClientProfile | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    phone: "",
    website: "",
    status: "lead" as "pending" | "lead" | "active" | "inactive",
    notes: "",
    services: [] as string[],
    projectBudget: 0,
  });

  const fetchClients = async () => {
    try {
      const res = await fetch("/api/clients", {
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      if (res.ok) setClients(await res.json());
    } catch (e) {
      console.error("Error fetching clients:", e);
    }
  };

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals", {
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      if (res.ok) setProposals(await res.json());
    } catch (e) {
      console.error("Error fetching proposals:", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions", {
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });
      if (res.ok) setTransactions(await res.json());
    } catch (e) {
      console.error("Error fetching transactions:", e);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([fetchClients(), fetchProposals(), fetchTransactions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  // Open Form for Add
  const handleAddClick = () => {
    setEditingClient(null);
    setFormData({
      name: "",
      email: "",
      companyName: "",
      phone: "",
      website: "",
      status: "lead",
      notes: "",
      services: [],
      projectBudget: 0,
    });
    setShowFormModal(true);
  };

  // Open Form for Edit
  const handleEditClick = (client: ClientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClient(client);
    setFormData({
      name: client.name || "",
      email: client.email || "",
      companyName: client.companyName || "",
      phone: client.phone || "",
      website: client.website || "",
      status: client.status || "lead",
      notes: client.notes || "",
      services: client.services || [],
      projectBudget: client.projectBudget || 0,
    });
    setShowFormModal(true);
  };

  // Delete Client
  const handleDeleteClick = async (client: ClientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Delete Client Profile?",
      text: `Are you sure you want to delete the profile for ${client.name}? This will remove their archived details.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, delete profile",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: "DELETE",
        headers: { "x-user-role": user?.role || "", "x-user-email": user?.email || "", "x-user-name": user?.name || "" },
      });

      if (res.ok) {
        Swal.fire({
          title: "Deleted!",
          text: "Client profile has been deleted successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchClients();
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to delete client.", "error");
      }
    } catch (e: any) {
      Swal.fire("Error", e.message, "error");
    }
  };

  // Approve Client (Pending -> Lead)
  const handleApproveClient = async (client: ClientProfile, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Approve Client Profile?",
      text: `Are you sure you want to approve ${client.name}? This will change their status from pending to lead.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#71717a",
      confirmButtonText: "Yes, approve client",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/clients/${client._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user?.role || "",
          "x-user-email": user?.email || "",
          "x-user-name": user?.name || "",
        },
        body: JSON.stringify({ status: "lead" }),
      });

      if (res.ok) {
        Swal.fire({
          title: "Approved!",
          text: "Client profile is now approved as a Lead.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchClients();
        if (activeClient && activeClient._id === client._id) {
          setActiveClient({ ...activeClient, status: "lead" });
        }
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to approve client.", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Submit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      Swal.fire("Error", "Name and email are required fields.", "error");
      return;
    }

    try {
      const isEdit = !!editingClient;
      const url = isEdit ? `/api/clients/${editingClient._id}` : "/api/clients";
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
          text: isEdit ? "Client profile updated successfully." : "New client profile created successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowFormModal(false);
        fetchClients();
      } else {
        const err = await res.json();
        Swal.fire("Error", err.error || "Failed to save client profile.", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message, "error");
    }
  };

  // Service toggle selection
  const handleServiceChange = (service: string) => {
    setFormData((prev) => {
      const alreadySelected = prev.services.includes(service);
      if (alreadySelected) {
        return { ...prev, services: prev.services.filter((s) => s !== service) };
      } else {
        return { ...prev, services: [...prev.services, service] };
      }
    });
  };

  // Share Intake Link
  const handleShareLink = () => {
    const intakeUrl = `${window.location.origin}/clients/onboard`;
    navigator.clipboard.writeText(intakeUrl);
    Swal.fire({
      title: "Intake Link Copied!",
      text: "The client onboarding form link has been copied to your clipboard. Share it with your prospective client so they auto-register when submitting.",
      icon: "success",
      confirmButtonColor: "#0f172a",
      confirmButtonText: "Awesome",
    });
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (client.companyName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [clients, searchQuery, statusFilter]);

  // Client proposals and transactions counts for listing
  const clientRelations = useMemo(() => {
    const maps: Record<string, { proposals: Proposal[]; transactions: Transaction[] }> = {};
    clients.forEach((c) => {
      maps[c._id] = {
        proposals: proposals.filter((p) => p.clientEmail.toLowerCase() === c.email.toLowerCase() || p.clientName.toLowerCase() === c.name.toLowerCase()),
        transactions: transactions.filter((t) => t.client && t.client.toLowerCase() === c.name.toLowerCase()),
      };
    });
    return maps;
  }, [clients, proposals, transactions]);

  // Client Detail View Matches
  const activeClientProposals = useMemo(() => {
    if (!activeClient) return [];
    return proposals.filter(
      (p) => p.clientEmail.toLowerCase() === activeClient.email.toLowerCase() || p.clientName.toLowerCase() === activeClient.name.toLowerCase()
    );
  }, [activeClient, proposals]);

  const activeClientTransactions = useMemo(() => {
    if (!activeClient) return [];
    return transactions.filter((t) => t.client && t.client.toLowerCase() === activeClient.name.toLowerCase());
  }, [activeClient, transactions]);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar />
      <div className="flex-grow pl-64 flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 px-8 pb-8 space-y-6">
          
          {/* Header section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-zinc-900">Client Profiles</h1>
              <p className="text-xs text-zinc-500 font-medium mt-1">
                Manage your agency clients, track details, check associated proposals, and share the onboarding intake form.
              </p>
            </div>
            
            <div className="flex gap-2.5">
              <button
                onClick={handleShareLink}
                className="flex items-center gap-2 px-3.5 py-2 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <Share2 className="w-4 h-4" /> Share Onboarding Form
              </button>
              
              {user?.role === "admin" && (
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Client
                </button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, company, services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 placeholder:text-zinc-400 bg-zinc-50/50"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto border border-zinc-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-900 bg-white font-medium text-zinc-700"
              >
                <option value="all">All Clients</option>
                <option value="pending">Pending Approval</option>
                <option value="lead">Leads</option>
                <option value="active">Active Clients</option>
                <option value="inactive">Inactive Clients</option>
              </select>
            </div>
          </div>

          {/* Clients Table / Grid */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 font-semibold text-zinc-500 uppercase">
                    <th className="pb-3 pl-2">Client Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Services Interested</th>
                    <th className="pb-3 text-center">Status</th>
                    <th className="pb-3 text-center">Links</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400">
                        Loading client profiles...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-400">
                        <Briefcase className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                        No clients found. Click "Add Client" or share the onboarding form link!
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((c) => {
                      const relations = clientRelations[c._id] || { proposals: [], transactions: [] };
                      return (
                        <tr
                          key={c._id}
                          onClick={() => {
                            setActiveClient(c);
                            setShowDetailsModal(true);
                          }}
                          className="hover:bg-zinc-50/75 transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 pl-2">
                            <div className="font-bold text-zinc-900">{c.name}</div>
                            {c.companyName && (
                              <div className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                                {c.companyName}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5">
                            <div className="text-zinc-700 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-zinc-400" /> {c.email}
                            </div>
                            {c.phone && (
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-2.5 h-2.5 text-zinc-400" /> {c.phone}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[280px]">
                              {c.services.length === 0 ? (
                                <span className="text-[10px] text-zinc-400">No services selected</span>
                              ) : (
                                c.services.slice(0, 2).map((s) => (
                                  <span
                                    key={s}
                                    className="px-1.5 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200 rounded text-[10px] font-medium"
                                  >
                                    {s}
                                  </span>
                                ))
                              )}
                              {c.services.length > 2 && (
                                <span className="px-1.5 py-0.5 bg-zinc-200 text-zinc-800 rounded text-[10px] font-bold">
                                  +{c.services.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 text-center">
                            <span
                              className={`inline-flex items-center font-bold px-2.5 py-0.5 rounded-full border text-[10px] capitalize ${
                                STATUS_STYLES[c.status]
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="flex justify-center gap-3 text-[10px] font-semibold text-zinc-500">
                              <span
                                className="flex items-center gap-0.5 cursor-pointer hover:underline"
                                title="Linked Proposals"
                              >
                                Proposals: <strong className="text-zinc-950 font-bold ml-0.5">{relations.proposals.length}</strong>
                              </span>
                              <span
                                className="flex items-center gap-0.5 cursor-pointer hover:underline"
                                title="Linked Ledger Transactions"
                              >
                                Ledger: <strong className="text-zinc-950 font-bold ml-0.5">{relations.transactions.length}</strong>
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 text-right pr-2">
                            <div className="inline-flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => {
                                  setActiveClient(c);
                                  setShowDetailsModal(true);
                                }}
                                className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              {user?.role === "admin" && (
                                <>
                                  {c.status === "pending" && (
                                    <button
                                      onClick={(e) => handleApproveClient(c, e)}
                                      className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                                      title="Approve Client"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleEditClick(c, e)}
                                    className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                                    title="Edit Profile"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => handleDeleteClick(c, e)}
                                    className="p-1.5 text-zinc-500 hover:text-red-650 hover:bg-red-50 rounded-md transition-colors"
                                    title="Delete Profile"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
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

      {/* Add / Edit Client Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-[1.5px]" onClick={() => setShowFormModal(false)} />
          <div className="relative w-full max-w-xl bg-white border border-zinc-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-white">
              <h2 className="text-sm font-bold text-zinc-900">
                {editingClient ? `Edit Profile: ${editingClient.name}` : "Add Client Profile"}
              </h2>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                    placeholder="e.g. john@company.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                    placeholder="e.g. +1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Website URL</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none"
                    placeholder="e.g. https://company.com"
                  />
                </div>
                <div>
                  <label className="block text-zinc-550 font-bold mb-1.5">Onboarding Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none bg-white"
                  >
                    <option value="pending">Pending Approval</option>
                    <option value="lead">Lead</option>
                    <option value="active">Active Client</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-550 font-bold mb-1.5">Private Profile Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-xs focus:ring-1 focus:ring-zinc-950 focus:outline-none resize-none"
                  placeholder="Record agency notes, special agreements, or project updates..."
                />
              </div>

              <div className="border-t border-zinc-150 pt-4 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-zinc-200 text-zinc-700 bg-white hover:bg-zinc-50 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  {editingClient ? "Save Changes" : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Details Drawer / Modal */}
      {showDetailsModal && activeClient && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowDetailsModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
          <div
            className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  Client Profile Detail
                </span>
                <h2 className="text-base font-bold text-zinc-900 truncate mt-0.5">{activeClient.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                {user?.role === "admin" && (
                  <>
                    <button
                      onClick={(e) => {
                        setShowDetailsModal(false);
                        handleEditClick(activeClient, e);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={async (e) => {
                        await handleDeleteClick(activeClient, e);
                        setShowDetailsModal(false);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-lg text-[11px] font-semibold transition-colors shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-zinc-200 text-zinc-650 hover:text-zinc-900 rounded-lg bg-zinc-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Profile Details Grid */}
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3.5">
                <h3 className="font-bold text-zinc-800 text-xs flex items-center gap-1.5 border-b border-zinc-200 pb-2">
                  <Info className="w-3.5 h-3.5 text-zinc-400" /> Basic Information
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Email Address</div>
                    <a
                      href={`mailto:${activeClient.email}`}
                      className="text-zinc-850 hover:text-blue-600 font-semibold flex items-center gap-1.5 mt-0.5 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-400" /> {activeClient.email}
                    </a>
                  </div>
                  
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Phone Number</div>
                    {activeClient.phone ? (
                      <a
                        href={`tel:${activeClient.phone}`}
                        className="text-zinc-850 hover:text-blue-600 font-semibold flex items-center gap-1.5 mt-0.5 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-zinc-400" /> {activeClient.phone}
                      </a>
                    ) : (
                      <div className="text-zinc-450 italic mt-0.5">Not provided</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5">
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Company Name</div>
                    <div className="font-bold text-zinc-800 mt-0.5">
                      {activeClient.companyName || <span className="text-zinc-400 font-medium italic">N/A</span>}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Website URL</div>
                    {activeClient.website ? (
                      <a
                        href={activeClient.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-1 mt-0.5"
                      >
                        <Globe className="w-3.5 h-3.5 text-zinc-400" /> Visit Site <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <div className="text-zinc-450 italic mt-0.5">Not provided</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5">
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Project Budget</div>
                    <div className="font-bold text-zinc-900 mt-0.5 text-sm">
                      ${activeClient.projectBudget.toLocaleString()}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Client Status</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center font-bold px-2 py-0.5 rounded-full border text-[10px] capitalize ${
                          STATUS_STYLES[activeClient.status]
                        }`}
                      >
                        {activeClient.status}
                      </span>
                      {user?.role === "admin" && activeClient.status === "pending" && (
                        <button
                          onClick={(e) => {
                            handleApproveClient(activeClient, e);
                            setShowDetailsModal(false);
                          }}
                          className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-colors shadow-sm"
                        >
                          Approve Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1.5 border-t border-zinc-200 mt-2.5">
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Registered Via</div>
                    <div className="font-medium text-zinc-700 capitalize mt-0.5">
                      {activeClient.onboardedVia === "public_form" ? "Public Intake Form" : "Manually by Admin"}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-zinc-400 font-medium text-[10px]">Onboarding Date</div>
                    <div className="font-medium text-zinc-700 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      {new Date(activeClient.onboardedAt || activeClient.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Client Services Badge */}
              <div className="space-y-2">
                <h3 className="font-bold text-zinc-800 text-xs">Interested Services</h3>
                <div className="flex flex-wrap gap-1.5">
                  {activeClient.services.length === 0 ? (
                    <span className="text-zinc-450 italic">No specific service selection recorded.</span>
                  ) : (
                    activeClient.services.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-zinc-900 text-white border border-zinc-950 rounded-full font-semibold"
                      >
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Private Notes */}
              {activeClient.notes && (
                <div className="space-y-2">
                  <h3 className="font-bold text-zinc-800 text-xs">Profile Notes</h3>
                  <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 text-zinc-700 leading-relaxed whitespace-pre-line">
                    {activeClient.notes}
                  </div>
                </div>
              )}

              {/* Linked Proposals */}
              <div className="space-y-3">
                <h3 className="font-bold text-zinc-800 text-xs flex items-center justify-between border-b border-zinc-100 pb-1.5">
                  <span>Linked Project Proposals</span>
                  <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-650 font-bold border border-zinc-200">
                    {activeClientProposals.length} Total
                  </span>
                </h3>
                
                {activeClientProposals.length === 0 ? (
                  <div className="text-zinc-400 italic py-2">
                    No proposals sent or matched to this client's name or email.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {activeClientProposals.map((p) => (
                      <div
                        key={p._id}
                        onClick={() => router.push(`/dashboard/proposals/${p._id}`)}
                        className="flex items-center justify-between border border-zinc-150 rounded-xl p-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <div className="font-bold text-zinc-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-zinc-400" />
                            {p.projectName || "Project Proposal"}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {p.proposalNumber || p._id} · {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-zinc-900">
                            {p.currency === "USD" ? "$" : "Tk "}{(p.totalPrice || 0).toLocaleString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] rounded font-bold border capitalize ${
                              p.status === "signed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : p.status === "sent" || p.status === "viewed"
                                ? "bg-blue-50 text-blue-700 border-blue-100"
                                : "bg-zinc-50 text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {p.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Linked Ledger Transactions */}
              <div className="space-y-3">
                <h3 className="font-bold text-zinc-800 text-xs flex items-center justify-between border-b border-zinc-100 pb-1.5">
                  <span>Linked Income / Transactions</span>
                  <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] text-zinc-650 font-bold border border-zinc-200">
                    {activeClientTransactions.length} Total
                  </span>
                </h3>
                
                {activeClientTransactions.length === 0 ? (
                  <div className="text-zinc-400 italic py-2">
                    No income ledger transactions recorded or matched to this client's name.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {activeClientTransactions.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => router.push(`/dashboard/transactions`)}
                        className="flex items-center justify-between border border-zinc-150 rounded-xl p-3 hover:bg-zinc-50 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-zinc-800 truncate flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 bg-emerald-50 rounded-full p-0.5 border border-emerald-100" />
                            {t.description}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                            {t.category} · {new Date(t.date).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-zinc-900">
                            {t.currency === "USD" ? "$" : "Tk "}{t.amount.toLocaleString()}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] rounded font-bold border capitalize ${
                              t.status === "completed"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : t.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-100"
                                : "bg-zinc-50 text-zinc-650 border-zinc-200"
                            }`}
                          >
                            {t.status}
                          </span>
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-zinc-50 border-t border-zinc-200 text-center">
              <span className="text-[10px] text-zinc-400 font-medium">
                Client Profile ID: <strong className="font-mono text-zinc-600">{activeClient._id}</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

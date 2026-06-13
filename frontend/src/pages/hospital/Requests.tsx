import * as React from "react";
import { useState, useEffect } from "react";
import { Activity, Plus, Check, RefreshCw, MapPin, Trash2, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { Badge } from "@/components/ui/atoms/Badge";
import { FormField } from "@/components/ui/molecules/form-field";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split } from "@/components/layout/primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import type { BloodRequest } from "@/types/request";

export interface Organization {
  id: string;
  name: string;
  type: "hospital" | "blood_bank";
  location: string;
  contact: string;
  status: "active" | "suspended";
}

export interface DonorProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  blood_group: string;
  location: string;
  last_donation: string;
  status: "active" | "inactive";
  total_donations: number;
}

const HospitalRequests: React.FC = () => {
  const { user } = useAuthStore();
  const hospitalName = user?.name || "Hospital";

  const [requests, setRequests]           = useState<BloodRequest[]>([]);
  const [donors, setDonors]               = useState<DonorProfile[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm]       = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [isModalOpen, setIsModalOpen]     = useState(false);

  // Form states
  const [bloodGroup, setBloodGroup] = useState("");
  const [volume, setVolume]         = useState("");
  const [urgency, setUrgency]       = useState<"normal" | "urgent" | "emergency">("normal");

  // Real-time validation errors
  const [errors, setErrors] = useState<{ bloodGroup?: string; volume?: string }>({});

  // Match states
  const [matchingItem, setMatchingItem]   = useState<BloodRequest | null>(null);
  const [matchStep, setMatchStep]         = useState<"searching" | "results" | "confirmed">("searching");
  const [selectedBank, setSelectedBank]   = useState<string | null>(null);

  // Delete confirmation
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deletingId, setDeletingId]         = useState<string | null>(null); // for exit animation

  // ── Persistence ──────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqRes, usersRes] = await Promise.all([
          api.get("/requests"),
          api.get("/donors/all-users"),
        ]);
        
        setRequests(reqRes.data);

        const allUsers: any[] = usersRes.data;
        const orgsList: Organization[] = allUsers
          .filter(u => u.role === "hospital" || u.role === "blood_bank")
          .map(u => ({
            id: u.id,
            name: u.full_name || u.name || "Organization",
            type: u.role as "hospital" | "blood_bank",
            location: u.address || "Main City",
            contact: u.phone_number || "N/A",
            status: u.is_active ? "active" : "suspended",
          }));
        setOrganizations(orgsList);

        const donorsList: DonorProfile[] = allUsers
          .filter(u => u.role === "donor")
          .map(u => ({
            id: u.id,
            name: u.full_name || u.name || "Donor",
            email: u.email,
            phone: u.phone_number || "N/A",
            blood_group: u.blood_group || "O+",
            location: u.address || "Main City",
            last_donation: u.last_donation || "Never",
            status: u.is_active ? "active" : "inactive",
            total_donations: u.total_donations || 0,
          }));
        setDonors(donorsList);
      } catch (err) {
        console.error("Error fetching requests page data:", err);
      }
    };
    fetchData();
  }, []);

  // ── Validation ────────────────────────────────────────────
  const validateBloodGroup = (val: string) => {
    if (!val) {
      setErrors(prev => ({ ...prev, bloodGroup: "Blood group is required" }));
      return false;
    }
    setErrors(prev => { const c = { ...prev }; delete c.bloodGroup; return c; });
    return true;
  };

  const validateVolume = (val: string) => {
    const n = parseInt(val, 10);
    if (!val) {
      setErrors(prev => ({ ...prev, volume: "Volume is required" }));
      return false;
    }
    if (isNaN(n) || n <= 0) {
      setErrors(prev => ({ ...prev, volume: "Volume must be a positive number" }));
      return false;
    }
    if (n > 5000) {
      setErrors(prev => ({ ...prev, volume: "Volume cannot exceed 5,000 ml (5L) per request" }));
      return false;
    }
    setErrors(prev => { const c = { ...prev }; delete c.volume; return c; });
    return true;
  };

  const handleBloodGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setBloodGroup(e.target.value);
    validateBloodGroup(e.target.value);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(e.target.value);
    validateVolume(e.target.value);
  };

  // ── Create ────────────────────────────────────────────────
  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBloodGroup(bloodGroup) || !validateVolume(volume)) return;

    try {
      const payload = {
        hospital_id: user?.id,
        blood_group: bloodGroup,
        quantity_ml: parseInt(volume, 10),
        priority: urgency,
        reason: "Emergency blood request",
      };

      const response = await api.post("/requests/", payload);
      setRequests([response.data, ...requests]);
      setBloodGroup(""); setVolume(""); setUrgency("normal"); setErrors({});
      setIsModalOpen(false);
    } catch (err) {
      console.error("Failed to create request:", err);
      alert("Failed to create request. Please try again.");
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const initiateDelete = (id: string) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeletingId(deleteTargetId);
    setDeleteTargetId(null);

    try {
      await api.delete(`/requests/${deletingId}`);
      setTimeout(() => {
        setRequests(requests.filter(r => r.id !== deletingId));
        setDeletingId(null);
      }, 320);
    } catch (err) {
      console.error("Failed to delete request:", err);
      alert("Failed to delete request. Please try again.");
      setDeletingId(null);
    }
  };

  const cancelDelete = () => setDeleteTargetId(null);

  // ── Auto-Match ────────────────────────────────────────────
  const startMatching = (req: BloodRequest) => {
    setMatchingItem(req);
    setMatchStep("searching");
    setSelectedBank(null);
    setTimeout(() => setMatchStep("results"), 1500);
  };

  const confirmTransfer = async () => {
    if (!matchingItem || !selectedBank) return;

    try {
      const bankOrg = organizations.find(o => o.name === selectedBank);
      if (!bankOrg) {
        alert("Selected blood bank center not found.");
        return;
      }

      const transferPayload = {
        sender_id: bankOrg.id,
        receiver_id: user?.id,
        request_id: matchingItem.id,
        status: "in_transit",
        tracking_number: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      // Create a transfer in the backend
      await api.post("/transfers/", transferPayload);

      // Update request status to matched/in_progress in the backend
      await api.patch(`/requests/${matchingItem.id}`, { status: "in_progress" });

      // Update local requests state
      setRequests(requests.map(r =>
        r.id === matchingItem.id ? { ...r, status: "in_progress" as any } : r
      ));

      setMatchStep("confirmed");
      setTimeout(() => setMatchingItem(null), 1000);
    } catch (err) {
      console.error("Failed to create transfer/match request:", err);
      alert("Failed to confirm matching. Please try again.");
    }
  };

  const getMatchResults = () => {
    if (!matchingItem) return [];

    const banks = organizations.filter(o => o.type === "blood_bank" && o.status === "active");

    return banks.map(bank => {
      let dist = "1.2 miles away";
      let eta = "15 mins";
      if (bank.name.includes("Red Cross")) {
        dist = "3.4 miles away";
        eta = "28 mins";
      } else if (bank.name.includes("Hope")) {
        dist = "5.8 miles away";
        eta = "40 mins";
      }

      return {
        name: bank.name,
        dist,
        eta,
        stock: `450ml`,
        hasStock: true,
      };
    });
  };

  // ── Filtering ─────────────────────────────────────────────
  const filteredRequests = requests.filter(req => {
    const matchesSearch =
      req.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.blood_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = urgencyFilter === "all" || req.priority === urgencyFilter;
    return matchesSearch && matchesFilter;
  });

  // ── Badge helpers ─────────────────────────────────────────
  const getUrgencyBadge = (u: string) => {
    if (u === "emergency") return <Badge variant="danger"  className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Emergency</Badge>;
    if (u === "urgent")    return <Badge variant="warning" className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Urgent</Badge>;
    return                        <Badge variant="info"    className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":    return <Badge variant="outline" className="px-2 py-0.5 rounded text-xs">Pending Match</Badge>;
      case "in_progress": return <Badge variant="warning" className="px-2 py-0.5 rounded text-xs">In Transit</Badge>;
      case "completed":  return <Badge variant="success" className="px-2 py-0.5 rounded text-xs">Delivered</Badge>;
      case "cancelled":  return <Badge variant="danger" className="px-2 py-0.5 rounded text-xs">Cancelled</Badge>;
      default: return null;
    }
  };

  const isFormInvalid = !!(errors.bloodGroup || errors.volume || !bloodGroup || !volume);

  // ── Render ────────────────────────────────────────────────
  return (
    <DashboardLayout title="Request Management">
      <Stack gap="lg">

        {/* Header */}
        <Split
          slots={{
            left: (
              <div>
                <h2 className="text-xl font-bold text-text-primary">Emergency Requests</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Initiate requests and match them with local suppliers using AI route optimization.
                </p>
              </div>
            ),
            right: (
              <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Request
              </Button>
            ),
          }}
        />

        {/* Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search by ID or Blood Type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Urgency:</span>
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text-primary"
                  >
                    <option value="all">All Levels</option>
                    <option value="emergency">Emergency</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              ),
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                  <th className="p-4">Request ID</th>
                  <th className="p-4">Hospital</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Volume (ml)</th>
                  <th className="p-4">Urgency</th>
                  <th className="p-4">Date Created</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const isExiting = deletingId === req.id;
                    const isOwnRequest = req.hospital_id === user?.id;
                    const canDelete = isOwnRequest && req.status !== "completed" && req.status !== "cancelled";
                    const hospitalNameStr = isOwnRequest ? hospitalName : (organizations.find(o => o.id === req.hospital_id)?.name || "Unknown Hospital");

                    return (
                      <tr
                        key={req.id}
                        className="hover:bg-border/5 transition-all duration-300"
                        style={isExiting ? {
                          opacity: 0,
                          transform: "translateX(-8px) scale(0.98)",
                          transition: "opacity 300ms ease, transform 300ms ease",
                        } : {
                          opacity: 1,
                          transform: "translateX(0) scale(1)",
                          transition: "opacity 300ms ease, transform 300ms ease, background-color 150ms ease",
                        }}
                      >
                        <td className="p-4 font-mono font-semibold">{req.id}</td>
                        <td className="p-4 text-xs font-medium text-text-primary">{hospitalNameStr}</td>
                        <td className="p-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {req.blood_group}
                          </span>
                        </td>
                        <td className="p-4 font-medium">{req.quantity_ml} ml</td>
                        <td className="p-4">{getUrgencyBadge(req.priority || "normal")}</td>
                        <td className="p-4 text-text-secondary">{new Date(req.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <Stack gap="xs">
                            {getStatusBadge(req.status)}
                            {req.status === "pending" && (
                              <span className="text-[10px] text-text-secondary leading-tight block">
                                Broadcasted to {organizations.filter(o => o.type === "blood_bank" && o.status === "active").length} banks &amp;{" "}
                                {donors.filter(d => d.blood_group === req.blood_group && d.status === "active").length || 0} matching donors
                              </span>
                            )}
                          </Stack>
                        </td>
                        <td className="p-4">
                          <Row gap="xs" className="justify-end items-center">
                            {/* Auto-match — only for pending */}
                            {req.status === "pending" && (
                              <Button
                                onClick={() => startMatching(req)}
                                variant="primary"
                                size="sm"
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1 px-3"
                              >
                                <RefreshCw className="h-3 w-3" /> Auto-Match
                              </Button>
                            )}
                            {req.status !== "pending" && (
                              <span className="text-xs text-text-secondary font-medium italic">Matched</span>
                            )}

                            {/* ── Delete button — only for hospital's own requests ── */}
                            {canDelete && (
                              <button
                                onClick={() => initiateDelete(req.id)}
                                title="Delete this request"
                                className={[
                                  "group inline-flex items-center justify-center h-8 w-8 rounded-lg",
                                  "border border-transparent text-text-secondary/50",
                                  "hover:border-danger/30 hover:bg-danger/8 hover:text-danger",
                                  "transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger",
                                ].join(" ")}
                              >
                                <Trash2 className="h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110" />
                              </button>
                            )}
                          </Row>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-text-secondary">
                      No requests found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Delete Confirmation Dialog ── */}
        {deleteTargetId && (() => {
          const target = requests.find(r => r.id === deleteTargetId);
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
              <div className="w-full max-w-sm bg-surface rounded-xl border border-border shadow-floating overflow-hidden animate-scale-in">
                {/* Warning header */}
                <div className="px-6 py-4 border-b border-border bg-danger/5 flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-4.5 w-4.5 text-danger" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary">Delete Request</h3>
                    <p className="text-xs text-text-secondary mt-0.5">This action cannot be undone</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-bold text-text-primary font-mono">{target?.id}</span>?{" "}
                    This request for{" "}
                    <span className="font-bold text-primary">{target?.blood_group} — {target?.quantity_ml} ml</span>{" "}
                    will be permanently removed and all nearby blood banks and donors will be notified of the cancellation.
                  </p>
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 flex gap-3 justify-end">
                  <Button variant="secondary" size="sm" onClick={cancelDelete}>
                    Keep Request
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={confirmDelete}
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Request
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Create Request Modal ── */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-md bg-surface rounded-lg border border-border shadow-card overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">Create Emergency Request</h3>
              </div>
              <form onSubmit={handleCreateRequest} className="p-6">
                <Stack gap="md">
                  <FormField label="Blood Type / Group" required error={errors.bloodGroup}>
                    <select
                      value={bloodGroup}
                      onChange={handleBloodGroupChange}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${errors.bloodGroup ? "border-danger" : "border-border"}`}
                    >
                      <option value="">Select blood type</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField
                    label="Volume Required (ml)"
                    required
                    error={errors.volume}
                    helperText={!errors.volume ? "Typical units are multiples of 450 ml." : undefined}
                  >
                    <Input
                      type="number"
                      placeholder="e.g. 450"
                      value={volume}
                      onChange={handleVolumeChange}
                      className={errors.volume ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Urgency Level" required>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as "normal" | "urgent" | "emergency")}
                      className="w-full h-11 rounded-md border border-border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="normal">Normal Priority</option>
                      <option value="urgent">Urgent Supply</option>
                      <option value="emergency">Emergency Release (ASAP)</option>
                    </select>
                  </FormField>

                  <Row gap="sm" className="justify-end pt-4 border-t border-border mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setErrors({}); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isFormInvalid}>
                      Submit Request
                    </Button>
                  </Row>
                </Stack>
              </form>
            </div>
          </div>
        )}

        {/* ── AI Auto-Match Modal ── */}
        {matchingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-surface rounded-lg border border-border shadow-card overflow-hidden animate-scale-in">
              <div className="px-6 py-4 border-b border-border bg-amber-500/5">
                <Row gap="sm" className="items-center">
                  <Activity className="h-5 w-5 text-amber-500 animate-pulse" />
                  <h3 className="text-lg font-bold text-text-primary">AI Route Matching System</h3>
                </Row>
              </div>

              <div className="p-6">
                {matchStep === "searching" && (
                  <Stack gap="md" className="py-12 items-center text-center">
                    <div className="h-12 w-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <div>
                      <h4 className="text-base font-bold text-text-primary">Querying Nearby Inventories...</h4>
                      <p className="text-xs text-text-secondary mt-1 max-w-xs">
                        Optimizing transit routes for {matchingItem.blood_group} ({matchingItem.quantity_ml} ml)
                      </p>
                    </div>
                  </Stack>
                )}

                {matchStep === "results" && (
                  <Stack gap="md">
                    <div>
                      <h4 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Available Matches Found</h4>
                      <p className="text-xs text-text-secondary mt-0.5">Select a blood bank supplier to initiate immediate courier delivery.</p>
                    </div>
                    <Stack gap="xs" className="max-h-60 overflow-y-auto mt-2">
                      {getMatchResults().length > 0 ? (
                        getMatchResults().map(bank => (
                          <label 
                            key={bank.name} 
                            className={`flex items-center justify-between p-3.5 border rounded-lg transition-all ${
                              bank.hasStock 
                                ? "cursor-pointer hover:bg-border/10 border-border" 
                                : "opacity-55 cursor-not-allowed bg-border/5 border-border/50"
                            }`}
                          >
                            <Row gap="sm" className="items-center">
                              <input
                                type="radio" name="supplier" value={bank.name}
                                disabled={!bank.hasStock}
                                checked={selectedBank === bank.name}
                                onChange={() => setSelectedBank(bank.name)}
                                className="h-4 w-4 text-primary focus:ring-primary disabled:opacity-50"
                              />
                              <div>
                                <p className="font-semibold text-sm text-text-primary">{bank.name}</p>
                                <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                                  <MapPin className="h-3 w-3 text-danger" /> {bank.dist} • Est. ETA: {bank.eta}
                                </p>
                              </div>
                            </Row>
                            <Badge variant={bank.hasStock ? "success" : "danger"} className="text-xs font-semibold">
                              {bank.stock} Stock
                            </Badge>
                          </label>
                        ))
                      ) : (
                        <p className="text-xs text-text-secondary italic text-center py-4">No blood bank matching compatibility matrix available.</p>
                      )}
                    </Stack>
                    <Row gap="sm" className="justify-end pt-4 border-t border-border mt-4">
                      <Button variant="secondary" onClick={() => setMatchingItem(null)}>Cancel</Button>
                      <Button onClick={confirmTransfer} disabled={!selectedBank}>Request Transfer</Button>
                    </Row>
                  </Stack>
                )}

                {matchStep === "confirmed" && (
                  <Stack gap="md" className="py-12 items-center text-center">
                    <div className="h-12 w-12 rounded-full bg-success/10 border border-success/20 text-success flex items-center justify-center">
                      <Check className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text-primary">Inbound Courier Request Created!</h4>
                      <p className="text-xs text-text-secondary mt-1">
                        Track this transit on the <strong>Transfers</strong> dashboard.
                      </p>
                    </div>
                  </Stack>
                )}
              </div>
            </div>
          </div>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default HospitalRequests;
export { HospitalRequests };

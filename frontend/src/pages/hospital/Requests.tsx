import * as React from "react";
import { useState, useEffect } from "react";
import { Activity, Plus, Check, RefreshCw, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { Badge } from "@/components/ui/atoms/Badge";
import { FormField } from "@/components/ui/molecules/form-field";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split } from "@/components/layout/primitives";

interface RequestItem {
  id: string;
  blood_group: string;
  volume: number;
  urgency: "normal" | "urgent" | "emergency";
  status: "pending" | "matched" | "in_transit" | "delivered";
  created_at: string;
}

const INITIAL_REQUESTS: RequestItem[] = [
  { id: "REQ-001", blood_group: "O-", volume: 450, urgency: "emergency", status: "pending", created_at: "2026-06-13 14:10" },
  { id: "REQ-002", blood_group: "A+", volume: 900, urgency: "urgent", status: "in_transit", created_at: "2026-06-13 12:30" },
  { id: "REQ-003", blood_group: "B-", volume: 600, urgency: "normal", status: "delivered", created_at: "2026-06-12 18:22" },
  { id: "REQ-004", blood_group: "AB-", volume: 450, urgency: "emergency", status: "matched", created_at: "2026-06-13 09:15" },
];

const MOCK_DONOR_PROFILES = [
  { name: "Sarah Jenkins", blood_group: "O-" },
  { name: "Michael Chang", blood_group: "A+" },
  { name: "Emily Rodriguez", blood_group: "B+" },
  { name: "James O'Connor", blood_group: "O+" },
  { name: "Alisha Patel", blood_group: "AB-" },
  { name: "David Kim", blood_group: "AB+" },
  { name: "Elena Rostova", blood_group: "B-" },
];

const HospitalRequests: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [bloodGroup, setBloodGroup] = useState("");
  const [volume, setVolume] = useState("");
  const [urgency, setUrgency] = useState<"normal" | "urgent" | "emergency">("normal");
  
  // Real-time error states
  const [errors, setErrors] = useState<{ bloodGroup?: string; volume?: string }>({});

  // Match states
  const [matchingItem, setMatchingItem] = useState<RequestItem | null>(null);
  const [matchStep, setMatchStep] = useState<"searching" | "results" | "confirmed">("searching");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Load from localStorage or defaults
  useEffect(() => {
    const saved = localStorage.getItem("mock_requests");
    if (saved) {
      setRequests(JSON.parse(saved));
    } else {
      setRequests(INITIAL_REQUESTS);
      localStorage.setItem("mock_requests", JSON.stringify(INITIAL_REQUESTS));
    }
  }, []);

  const saveRequests = (updated: RequestItem[]) => {
    setRequests(updated);
    localStorage.setItem("mock_requests", JSON.stringify(updated));
  };

  // Real-time validation
  const validateBloodGroup = (val: string) => {
    if (!val) {
      setErrors(prev => ({ ...prev, bloodGroup: "Blood group is required" }));
      return false;
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.bloodGroup;
      return copy;
    });
    return true;
  };

  const validateVolume = (val: string) => {
    const volNum = parseInt(val, 10);
    if (!val) {
      setErrors(prev => ({ ...prev, volume: "Volume is required" }));
      return false;
    }
    if (isNaN(volNum) || volNum <= 0) {
      setErrors(prev => ({ ...prev, volume: "Volume must be a positive number" }));
      return false;
    }
    if (volNum > 5000) {
      setErrors(prev => ({ ...prev, volume: "Volume cannot exceed 5,000 ml (5L) per request" }));
      return false;
    }
    setErrors(prev => {
      const copy = { ...prev };
      delete copy.volume;
      return copy;
    });
    return true;
  };

  const handleBloodGroupChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBloodGroup(val);
    validateBloodGroup(val);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVolume(val);
    validateVolume(val);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const isBgValid = validateBloodGroup(bloodGroup);
    const isVolValid = validateVolume(volume);

    if (!isBgValid || !isVolValid) return;

    const newReq: RequestItem = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      blood_group: bloodGroup,
      volume: parseInt(volume, 10),
      urgency,
      status: "pending",
      created_at: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    const updated = [newReq, ...requests];
    saveRequests(updated);

    // Reset Form
    setBloodGroup("");
    setVolume("");
    setUrgency("normal");
    setErrors({});
    setIsModalOpen(false);
  };

  // Trigger AI match simulation
  const startMatching = (req: RequestItem) => {
    setMatchingItem(req);
    setMatchStep("searching");
    setSelectedBank(null);

    // Simulate search loading
    setTimeout(() => {
      setMatchStep("results");
    }, 1500);
  };

  const confirmTransfer = () => {
    if (!matchingItem || !selectedBank) return;

    // Update request state
    const updatedRequests = requests.map(r => 
      r.id === matchingItem.id ? { ...r, status: "matched" as const } : r
    );
    saveRequests(updatedRequests);

    // Create a new mock transfer
    const savedTransfers = localStorage.getItem("mock_transfers");
    const transfers = savedTransfers ? JSON.parse(savedTransfers) : [
      { id: "TR-501", request_id: "REQ-002", source: "Red Cross Center", blood_group: "A+", volume: 900, status: "in_transit", eta: "15 mins" },
      { id: "TR-502", request_id: "REQ-004", source: "City General Blood Bank", blood_group: "AB-", volume: 450, status: "pending", eta: "45 mins" },
    ];

    const newTransfer = {
      id: `TR-${Math.floor(500 + Math.random() * 500)}`,
      request_id: matchingItem.id,
      source: selectedBank,
      blood_group: matchingItem.blood_group,
      volume: matchingItem.volume,
      status: "pending",
      eta: "35 mins",
    };

    localStorage.setItem("mock_transfers", JSON.stringify([newTransfer, ...transfers]));

    setMatchStep("confirmed");
    setTimeout(() => {
      setMatchingItem(null);
    }, 1000);
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = req.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          req.blood_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = urgencyFilter === "all" || req.urgency === urgencyFilter;
    return matchesSearch && matchesFilter;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge variant="danger" className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Emergency</Badge>;
      case "urgent":
        return <Badge variant="warning" className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Urgent</Badge>;
      default:
        return <Badge variant="info" className="uppercase text-[10px] tracking-wider px-2.5 py-0.5">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="px-2 py-0.5 rounded text-xs">Pending Match</Badge>;
      case "matched":
        return <Badge variant="info" className="px-2 py-0.5 rounded text-xs bg-sky-500/10 text-sky-500 border border-sky-500/20">Matched</Badge>;
      case "in_transit":
        return <Badge variant="warning" className="px-2 py-0.5 rounded text-xs">In Transit</Badge>;
      case "delivered":
        return <Badge variant="success" className="px-2 py-0.5 rounded text-xs">Delivered</Badge>;
      default:
        return null;
    }
  };

  const isFormInvalid = !!(errors.bloodGroup || errors.volume || !bloodGroup || !volume);

  return (
    <DashboardLayout title="Request Management">
      <Stack gap="lg">
        {/* Header Summary */}
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

        {/* Toolbar & Table */}
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
                  filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-border/5 transition-colors">
                      <td className="p-4 font-mono font-semibold">{req.id}</td>
                      <td className="p-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {req.blood_group}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{req.volume} ml</td>
                      <td className="p-4">{getUrgencyBadge(req.urgency)}</td>
                      <td className="p-4 text-text-secondary">{req.created_at}</td>
                      <td className="p-4">
                        <Stack gap="xs">
                          {getStatusBadge(req.status)}
                          {req.status === "pending" && (
                            <span className="text-[10px] text-text-secondary leading-tight block">
                              Broadcasted to 4 banks & {MOCK_DONOR_PROFILES.filter(d => d.blood_group === req.blood_group).length || 1} matching donors
                            </span>
                          )}
                        </Stack>
                      </td>
                      <td className="p-4 text-right">
                        {req.status === "pending" ? (
                          <Button
                            onClick={() => startMatching(req)}
                            variant="primary"
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 ml-auto text-xs py-1 px-3"
                          >
                            <RefreshCw className="h-3 w-3 animate-spin-slow" /> Auto-Match
                          </Button>
                        ) : (
                          <span className="text-xs text-text-secondary font-medium italic">Matched</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      No requests found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Request Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface rounded-lg border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">Create Emergency Request</h3>
              </div>
              <form onSubmit={handleCreateRequest} className="p-6">
                <Stack gap="md">
                  <FormField label="Blood Type / Group" required error={errors.bloodGroup}>
                    <select
                      value={bloodGroup}
                      onChange={handleBloodGroupChange}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.bloodGroup ? "border-danger" : "border-border"
                      }`}
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </FormField>

                  <FormField 
                    label="Volume Required (ml)" 
                    required 
                    error={errors.volume} 
                    helperText={!errors.volume ? "Typical units are multiples of 450ml." : undefined}
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
                      onChange={(e) => setUrgency(e.target.value as any)}
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

        {/* Modal: AI Auto-Matching Simulation */}
        {matchingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-lg bg-surface rounded-lg border border-border shadow-card overflow-hidden">
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
                        Optimizing transit routes and testing compatibility for type {matchingItem.blood_group} ({matchingItem.volume}ml)
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
                      <label className="flex items-center justify-between p-3.5 border border-border rounded-lg cursor-pointer hover:bg-border/10 transition-all">
                        <Row gap="sm" className="items-center">
                          <input
                            type="radio"
                            name="supplier"
                            value="City General Blood Bank"
                            checked={selectedBank === "City General Blood Bank"}
                            onChange={() => setSelectedBank("City General Blood Bank")}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="font-semibold text-sm text-text-primary">City General Blood Bank</p>
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-danger" /> 1.2 miles away • Est. ETA: 15 mins
                            </p>
                          </div>
                        </Row>
                        <Badge variant="success" className="text-xs font-semibold">1,800ml Stock</Badge>
                      </label>

                      <label className="flex items-center justify-between p-3.5 border border-border rounded-lg cursor-pointer hover:bg-border/10 transition-all">
                        <Row gap="sm" className="items-center">
                          <input
                            type="radio"
                            name="supplier"
                            value="Red Cross Depot"
                            checked={selectedBank === "Red Cross Depot"}
                            onChange={() => setSelectedBank("Red Cross Depot")}
                            className="h-4 w-4 text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="font-semibold text-sm text-text-primary">Red Cross Depot</p>
                            <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-danger" /> 3.4 miles away • Est. ETA: 28 mins
                            </p>
                          </div>
                        </Row>
                        <Badge variant="success" className="text-xs font-semibold">900ml Stock</Badge>
                      </label>
                    </Stack>

                    <Row gap="sm" className="justify-end pt-4 border-t border-border mt-4">
                      <Button variant="secondary" onClick={() => setMatchingItem(null)}>
                        Cancel
                      </Button>
                      <Button onClick={confirmTransfer} disabled={!selectedBank}>
                        Request Transfer
                      </Button>
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
                        Courier dispatch order created. Track this transit on the **Transfers** dashboard.
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

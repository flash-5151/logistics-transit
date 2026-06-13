import * as React from "react";
import { useState, useEffect } from "react";
import { Building, Plus, Trash2, ToggleLeft, ToggleRight, Phone, MapPin, CheckCircle, Building2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Badge } from "@/components/ui/atoms/Badge";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { FormField } from "@/components/ui/molecules/form-field";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Grid, Stack, Row, Split } from "@/components/layout/primitives";

interface Organization {
  id: string;
  name: string;
  type: "hospital" | "blood_bank";
  location: string;
  contact: string;
  status: "active" | "suspended";
}

const DEFAULT_ORGANIZATIONS: Organization[] = [
  { id: "ORG-001", name: "Saint Mary Emergency Hospital", type: "hospital", location: "Downtown District", contact: "+1 (555) 019-8831", status: "active" },
  { id: "ORG-002", name: "City General Blood Bank", type: "blood_bank", location: "Eastgate Sector", contact: "+1 (555) 012-7489", status: "active" },
  { id: "ORG-003", name: "Red Cross Depot", type: "blood_bank", location: "Northside Suburbs", contact: "+1 (555) 014-9928", status: "active" },
  { id: "ORG-004", name: "Valley Health Hospital", type: "hospital", location: "Southside Valley", contact: "+1 (555) 018-2947", status: "active" },
  { id: "ORG-005", name: "Saint Mary Clinic", type: "hospital", location: "Westside Heights", contact: "+1 (555) 015-6677", status: "suspended" },
];

const SECTOR_OPTIONS = [
  "Downtown District",
  "Northside Suburbs",
  "Eastgate Sector",
  "Southside Valley",
  "Westside Heights",
  "Industrial Zone"
];

const AdminOrganizations: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "hospital" | "blood_bank">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [type, setType] = useState<"hospital" | "blood_bank" | "">("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; type?: string; location?: string; contact?: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem("mock_organizations");
    if (saved) {
      setOrganizations(JSON.parse(saved));
    } else {
      setOrganizations(DEFAULT_ORGANIZATIONS);
      localStorage.setItem("mock_organizations", JSON.stringify(DEFAULT_ORGANIZATIONS));
    }
  }, []);

  const saveOrganizations = (updated: Organization[]) => {
    setOrganizations(updated);
    localStorage.setItem("mock_organizations", JSON.stringify(updated));
  };

  // Real-time validations
  const validateField = (field: string, val: string) => {
    const newErrors = { ...errors };

    if (field === "name") {
      if (!val) {
        newErrors.name = "Organization name is required";
      } else if (val.trim().length < 3) {
        newErrors.name = "Name must be at least 3 characters";
      } else {
        delete newErrors.name;
      }
    }

    if (field === "type") {
      if (!val) {
        newErrors.type = "Organization type is required";
      } else {
        delete newErrors.type;
      }
    }

    if (field === "location") {
      if (!val) {
        newErrors.location = "Location sector selection is required";
      } else {
        delete newErrors.location;
      }
    }

    if (field === "contact") {
      const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
      if (!val) {
        newErrors.contact = "Contact number is required";
      } else if (!phoneRegex.test(val)) {
        newErrors.contact = "Please input a valid phone number";
      } else {
        delete newErrors.contact;
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: string, val: string, setter: (v: string) => void) => {
    setter(val);
    validateField(field, val);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    validateField("name", name);
    validateField("type", type);
    validateField("location", location);
    validateField("contact", contact);

    if (errors.name || errors.type || errors.location || errors.contact || !name || !type || !location || !contact) {
      return;
    }

    const newOrg: Organization = {
      id: `ORG-${Math.floor(100 + Math.random() * 900)}`,
      name,
      type: type as any,
      location,
      contact,
      status: "active"
    };

    const updated = [newOrg, ...organizations];
    saveOrganizations(updated);

    // Reset Form
    setName("");
    setType("");
    setLocation("");
    setContact("");
    setErrors({});
    setIsModalOpen(false);

    setSuccessMsg(`Registered organization "${newOrg.name}" successfully.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const handleToggleStatus = (id: string) => {
    const updated = organizations.map(org => {
      if (org.id === id) {
        const nextStatus = org.status === "active" ? "suspended" as const : "active" as const;
        return { ...org, status: nextStatus };
      }
      return org;
    });
    saveOrganizations(updated);
  };

  const handleDelete = (id: string, orgName: string) => {
    if (confirm(`Are you sure you want to remove ${orgName}?`)) {
      const updated = organizations.filter(org => org.id !== id);
      saveOrganizations(updated);
    }
  };

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          org.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || org.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const hospitalCount = organizations.filter(o => o.type === "hospital").length;
  const bloodBankCount = organizations.filter(o => o.type === "blood_bank").length;

  const isFormInvalid = !!(errors.name || errors.type || errors.location || errors.contact || !name || !type || !location || !contact);

  return (
    <DashboardLayout title="Organization Management">
      <Stack gap="lg">
        {/* Banner Alert */}
        {successMsg && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success animate-fade-in">
            <Row gap="sm" className="items-center">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </Row>
          </div>
        )}

        <Split
          slots={{
            left: (
              <div>
                <h2 className="text-xl font-bold text-text-primary">Manage Hospitals & Blood Banks</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Configure logistics endpoints, register new supply centers, and moderate active status.
                </p>
              </div>
            ),
            right: (
              <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 shrink-0">
                <Plus className="h-4 w-4" /> Register Organization
              </Button>
            ),
          }}
        />

        {/* Global Summary Metric Cards */}
        <Grid cols={1} sm={3} gap="md">
          <StatCard
            title="Total Endpoints"
            value={`${organizations.length}`}
            icon={<Building className="text-primary" />}
            trend={<span className="text-xs text-text-secondary font-medium">System network endpoints</span>}
          />
          <StatCard
            title="Hospitals Registered"
            value={`${hospitalCount}`}
            icon={<Building2 className="text-info" />}
            trend={<span className="text-xs text-info font-semibold">Active emergency sinks</span>}
          />
          <StatCard
            title="Blood Banks Registered"
            value={`${bloodBankCount}`}
            icon={<Building className="text-success" />}
            trend={<span className="text-xs text-success font-semibold">Active supply hubs</span>}
          />
        </Grid>

        {/* Spaced Search & Filter Control Header */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-surface p-4 rounded-xl border border-border shadow-sm">
          <div className="w-full md:max-w-md">
            <SearchInput
              placeholder="Search by name or district location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
            />
          </div>

          <div className="flex bg-[#251C1A]/5 p-1 rounded-full border border-border/80 shrink-0 select-none">
            <button
              onClick={() => setTypeFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                typeFilter === "all" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              All ({organizations.length})
            </button>
            <button
              onClick={() => setTypeFilter("hospital")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                typeFilter === "hospital" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Hospitals ({hospitalCount})
            </button>
            <button
              onClick={() => setTypeFilter("blood_bank")}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-all cursor-pointer ${
                typeFilter === "blood_bank" ? "bg-primary text-white shadow-sm" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Blood Banks ({bloodBankCount})
            </button>
          </div>
        </div>

        {/* Organizations Grid section */}
        <div className="mt-2">
          {filteredOrgs.length > 0 ? (
            <Grid cols={1} md={2} gap="lg">
              {filteredOrgs.map((org) => {
                const isHospital = org.type === "hospital";
                const isActive = org.status === "active";
                return (
                  <div
                    key={org.id}
                    className={`p-6 rounded-xl border bg-surface hover:shadow-md transition-all flex flex-col justify-between min-h-[180px] ${
                      isHospital ? "border-l-4 border-l-info border-border" : "border-l-4 border-l-success border-border"
                    }`}
                  >
                    <Stack gap="sm">
                      <Row gap="sm" className="items-start justify-between">
                        <Stack gap="xs">
                          <Row gap="xs" className="items-center">
                            <Badge variant={isHospital ? "info" : "success"} className="text-xs uppercase font-extrabold tracking-wider px-2.5 py-0.5 rounded-md">
                              {isHospital ? "Hospital" : "Blood Bank"}
                            </Badge>
                            <span className="text-xs text-text-secondary font-mono font-semibold">({org.id})</span>
                          </Row>
                          <h3 className="font-extrabold text-lg text-text-primary tracking-tight mt-1">{org.name}</h3>
                        </Stack>

                        <Badge variant={isActive ? "success" : "outline"} className={`text-xs py-1 px-3 font-extrabold shrink-0 ${
                          isActive ? "bg-success/15 text-success border-success/30" : "bg-border/20 text-text-secondary border-border"
                        }`}>
                          {org.status.toUpperCase()}
                        </Badge>
                      </Row>

                      <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-border/10 text-sm">
                        <Row gap="xs" className="items-center text-text-secondary">
                          <MapPin className="h-4 w-4 text-text-secondary/80 shrink-0" />
                          <span className="font-medium">Location: <strong className="font-bold text-text-primary">{org.location}</strong></span>
                        </Row>
                        <Row gap="xs" className="items-center text-text-secondary">
                          <Phone className="h-4 w-4 text-text-secondary/80 shrink-0" />
                          <span className="font-medium">Contact: <strong className="font-bold text-text-primary">{org.contact}</strong></span>
                        </Row>
                      </div>
                    </Stack>

                    {/* Admin actions row */}
                    <Row gap="xs" className="justify-end mt-5 pt-3 border-t border-border/30">
                      <Button
                        onClick={() => handleToggleStatus(org.id)}
                        variant="secondary"
                        size="sm"
                        className="flex items-center gap-1.5 text-xs font-bold py-1.5 px-3 rounded-lg border border-border hover:bg-border/10 cursor-pointer"
                      >
                        {isActive ? (
                          <>
                            <ToggleRight className="h-4 w-4 text-success" /> Suspend
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-4 w-4 text-text-secondary" /> Activate
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => handleDelete(org.id, org.name)}
                        className="p-1.5 rounded-lg border border-danger/20 hover:bg-danger/5 text-danger transition-colors cursor-pointer shrink-0"
                        title="Remove organization"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Row>
                  </div>
                );
              })}
            </Grid>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
              <Building className="h-10 w-10 text-text-secondary/40 mx-auto mb-2" />
              <p className="text-text-secondary text-sm font-medium">No organizations matched your search filter.</p>
            </div>
          )}
        </div>

        {/* Modal: Register New Organization */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-primary/5">
                <h3 className="text-lg font-bold text-text-primary">Register Organization</h3>
              </div>
              <form onSubmit={handleRegister} className="p-6">
                <Stack gap="md">
                  <FormField label="Organization Name" required error={errors.name}>
                    <Input
                      placeholder="e.g. Saint Mary Clinic"
                      value={name}
                      onChange={(e) => handleInputChange("name", e.target.value, setName)}
                      className={errors.name ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Organization Type" required error={errors.type}>
                    <select
                      value={type}
                      onChange={(e) => handleInputChange("type", e.target.value, setType as any)}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.type ? "border-danger" : "border-border"
                      }`}
                    >
                      <option value="">Select type</option>
                      <option value="hospital">Hospital</option>
                      <option value="blood_bank">Blood Bank</option>
                    </select>
                  </FormField>

                  <FormField label="District Location Sector" required error={errors.location}>
                    <select
                      value={location}
                      onChange={(e) => handleInputChange("location", e.target.value, setLocation)}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.location ? "border-danger" : "border-border"
                      }`}
                    >
                      <option value="">Select location sector</option>
                      {SECTOR_OPTIONS.map((sec) => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField 
                    label="Contact Phone Number" 
                    required 
                    error={errors.contact}
                    helperText={!errors.contact ? "Format: +1 (555) 012-3456" : undefined}
                  >
                    <Input
                      placeholder="+1 (555) 000-0000"
                      value={contact}
                      onChange={(e) => handleInputChange("contact", e.target.value, setContact)}
                      className={errors.contact ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <Row gap="sm" className="justify-end pt-4 border-t border-border mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); setErrors({}); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isFormInvalid}>
                      Register
                    </Button>
                  </Row>
                </Stack>
              </form>
            </div>
          </div>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default AdminOrganizations;
export { AdminOrganizations };

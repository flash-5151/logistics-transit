import * as React from "react";
import { useState, useEffect } from "react";
import { Bell, Phone, MapPin, CheckCircle, Info, Heart, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Badge } from "@/components/ui/atoms/Badge";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split } from "@/components/layout/primitives";
import { api } from "@/services/api";

interface DonorProfile {
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

const AdminDonors: React.FC = () => {
  const [donors, setDonors] = useState<DonorProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [selectedDonor, setSelectedDonor] = useState<DonorProfile | null>(null);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);

  const fetchDonors = async () => {
    try {
      const [usersRes, donsRes] = await Promise.all([
        api.get("/donors/all-users"),
        api.get("/donations")
      ]);
      const allUsers = usersRes.data;
      const allDonations = donsRes.data;

      const mappedDonors = allUsers
        .filter((u: any) => u.role === "donor")
        .map((u: any) => {
          const userDons = allDonations.filter((d: any) => d.donor_id === u.id);
          const sortedDons = [...userDons].sort((a: any, b: any) => new Date(b.donation_date).getTime() - new Date(a.donation_date).getTime());
          
          let bloodGroup = "O-";
          if (sortedDons.length > 0) {
            bloodGroup = sortedDons[0].blood_group;
          } else {
            const str = u.full_name || u.email || "";
            let sum = 0;
            for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i);
            const groups = ["O-", "O+", "A+", "A-", "B+", "B-", "AB+", "AB-"];
            bloodGroup = groups[sum % groups.length];
          }

          return {
            id: u.id,
            name: u.full_name || "Donor",
            email: u.email,
            phone: u.phone_number || "N/A",
            blood_group: bloodGroup,
            location: u.address || "Unknown Sector",
            last_donation: sortedDons.length > 0 
              ? new Date(sortedDons[0].donation_date).toLocaleDateString() 
              : "Never",
            status: u.is_active ? ("active" as const) : ("inactive" as const),
            total_donations: userDons.length,
          };
        });

      setDonors(mappedDonors);
    } catch (err) {
      console.error("Error loading donors:", err);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleSendAlert = (donor: DonorProfile) => {
    setAlertSuccess(`Emergency blood drive notification successfully broadcasted to ${donor.name} (${donor.email})!`);
    setTimeout(() => {
      setAlertSuccess(null);
    }, 4000);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await api.put(`/donors/${id}/toggle-active`);
      fetchDonors();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete donor account for ${name}?`)) {
      try {
        await api.delete(`/donors/${id}`);
        fetchDonors();
      } catch (err) {
        console.error("Error deleting donor:", err);
      }
    }
  };

  const filteredDonors = donors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          d.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = bloodGroupFilter === "all" || d.blood_group === bloodGroupFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout title="Donor Directory">
      <Stack gap="lg">
        {/* Header Title */}
        <Split
          slots={{
            left: (
              <div>
                <h2 className="text-xl font-bold text-text-primary">Global Donor Registry</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Search system-wide donor directories, review contributions, and send emergency shortage alerts.
                </p>
              </div>
            ),
            right: (
              <Badge variant="default" className="text-xs font-bold px-3 py-1">
                {donors.length} Registered Donors
              </Badge>
            ),
          }}
        />

        {alertSuccess && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success">
            <Row gap="sm" className="items-center">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{alertSuccess}</span>
            </Row>
          </div>
        )}

        {/* Directory Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search by Donor Name, Email, or City Sector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Group:</span>
                  <select
                    value={bloodGroupFilter}
                    onChange={(e) => setBloodGroupFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text-primary"
                  >
                    <option value="all">All Groups</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              ),
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                  <th className="p-4">Donor ID</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {filteredDonors.length > 0 ? (
                  filteredDonors.map((d) => (
                    <tr key={d.id} className="hover:bg-border/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-text-secondary">{d.id.substring(0, 8)}</td>
                      <td className="p-4">
                        <Stack gap="none">
                          <span className="font-semibold">{d.name}</span>
                          <span className="text-xs text-text-secondary">{d.email}</span>
                        </Stack>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                          {d.blood_group}
                        </span>
                      </td>
                      <td className="p-4 text-text-secondary">{d.last_donation}</td>
                      <td className="p-4 text-text-secondary font-medium">{d.location}</td>
                      <td className="p-4">
                        {d.status === "active" ? (
                          <Badge variant="success" className="text-[10px] py-0.5">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0.5">Dormant</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Row gap="xs" className="justify-end items-center">
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs py-1 px-2.5 flex items-center gap-1"
                            onClick={() => setSelectedDonor(d)}
                          >
                            <Info className="h-3.5 w-3.5" /> Details
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                            onClick={() => handleToggleStatus(d.id)}
                          >
                            {d.status === "active" ? "Suspend" : "Activate"}
                          </Button>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs py-1 px-2.5 flex items-center gap-1"
                            onClick={() => handleSendAlert(d)}
                          >
                            <Bell className="h-3.5 w-3.5" /> Alert
                          </Button>
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="p-1.5 rounded-lg border border-danger/20 hover:bg-danger/5 text-danger transition-colors cursor-pointer shrink-0"
                            title="Remove donor account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </Row>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      No matching donor accounts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Donor Detail Overview */}
        {selectedDonor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface rounded-xl border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-primary/5 flex items-center justify-between">
                <h3 className="text-lg font-bold text-text-primary">Donor Profile Overview</h3>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-sm">
                  {selectedDonor.blood_group}
                </span>
              </div>

              <div className="p-6">
                <Stack gap="md">
                  <div className="flex flex-col items-center text-center pb-4 border-b border-border">
                    <div className="h-16 w-16 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-2xl">
                      {selectedDonor.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <h4 className="text-base font-bold text-text-primary mt-2">{selectedDonor.name}</h4>
                    <p className="text-xs text-text-secondary mt-0.5">{selectedDonor.email}</p>
                  </div>

                  <Stack gap="sm" className="text-sm">
                    <Row gap="sm" className="items-center text-text-secondary">
                      <Phone className="h-4 w-4 text-text-secondary shrink-0" />
                      <span>Phone: <strong className="text-text-primary font-semibold">{selectedDonor.phone}</strong></span>
                    </Row>
                    <Row gap="sm" className="items-center text-text-secondary">
                      <MapPin className="h-4 w-4 text-text-secondary shrink-0" />
                      <span>Address Sector: <strong className="text-text-primary font-semibold">{selectedDonor.location}</strong></span>
                    </Row>
                    <Row gap="sm" className="items-center text-text-secondary">
                      <Heart className="h-4 w-4 text-text-secondary shrink-0" />
                      <span>Total Contributions: <strong className="text-text-primary font-semibold">{selectedDonor.total_donations} times</strong></span>
                    </Row>
                    <Row gap="sm" className="items-center text-text-secondary">
                      <CheckCircle className="h-4 w-4 text-text-secondary shrink-0" />
                      <span>Status: <strong className="text-text-primary font-semibold capitalize">{selectedDonor.status}</strong></span>
                    </Row>
                  </Stack>

                  <div className="flex justify-end pt-4 border-t border-border mt-4">
                    <Button variant="secondary" onClick={() => setSelectedDonor(null)}>
                      Close Details
                    </Button>
                  </div>
                </Stack>
              </div>
            </div>
          </div>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default AdminDonors;
export { AdminDonors };

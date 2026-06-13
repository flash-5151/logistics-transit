import * as React from "react";
import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Calendar, ShieldAlert } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { Badge } from "@/components/ui/atoms/Badge";
import { FormField } from "@/components/ui/molecules/form-field";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split } from "@/components/layout/primitives";

interface InventoryItem {
  id: string;
  blood_group: string;
  volume: number;
  expiry_date: string;
  location: string;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "BAG-801", blood_group: "O-", volume: 450, expiry_date: "2026-06-18", location: "Fridge-A4" }, // Expiring soon
  { id: "BAG-802", blood_group: "A+", volume: 900, expiry_date: "2026-07-10", location: "Fridge-B1" },
  { id: "BAG-803", blood_group: "O+", volume: 1350, expiry_date: "2026-07-22", location: "Fridge-A1" },
  { id: "BAG-804", blood_group: "AB-", volume: 450, expiry_date: "2026-06-15", location: "Fridge-C2" }, // Expiring soon
  { id: "BAG-805", blood_group: "B+", volume: 1800, expiry_date: "2026-08-01", location: "Fridge-B3" },
];

const BloodBankInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form states
  const [bloodGroup, setBloodGroup] = useState("");
  const [volume, setVolume] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [location, setLocation] = useState("");
  
  // Validation errors
  const [errors, setErrors] = useState<{ bloodGroup?: string; volume?: string; expiryDate?: string; location?: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem("mock_inventory");
    if (saved) {
      setInventory(JSON.parse(saved));
    } else {
      setInventory(DEFAULT_INVENTORY);
      localStorage.setItem("mock_inventory", JSON.stringify(DEFAULT_INVENTORY));
    }
  }, []);

  const saveInventory = (updated: InventoryItem[]) => {
    setInventory(updated);
    localStorage.setItem("mock_inventory", JSON.stringify(updated));
  };

  // Real-time validations
  const validateForm = (field: string, val: string) => {
    const newErrors = { ...errors };

    if (field === "bloodGroup") {
      if (!val) newErrors.bloodGroup = "Blood group is required";
      else delete newErrors.bloodGroup;
    }

    if (field === "volume") {
      const vol = parseInt(val, 10);
      if (!val) newErrors.volume = "Volume is required";
      else if (isNaN(vol) || vol <= 0) newErrors.volume = "Volume must be greater than 0";
      else if (vol > 10000) newErrors.volume = "Volume cannot exceed 10,000ml";
      else delete newErrors.volume;
    }

    if (field === "expiryDate") {
      if (!val) {
        newErrors.expiryDate = "Expiry date is required";
      } else {
        const expDate = new Date(val);
        const today = new Date();
        today.setHours(0,0,0,0);
        if (expDate <= today) {
          newErrors.expiryDate = "Expiry date must be in the future";
        } else {
          delete newErrors.expiryDate;
        }
      }
    }

    if (field === "location") {
      if (!val) newErrors.location = "Storage location (e.g. Fridge-A1) is required";
      else delete newErrors.location;
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    validateForm(field, value);
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.bloodGroup || errors.volume || errors.expiryDate || errors.location || !bloodGroup || !volume || !expiryDate || !location) {
      return;
    }

    const newItem: InventoryItem = {
      id: `BAG-${Math.floor(800 + Math.random() * 200)}`,
      blood_group: bloodGroup,
      volume: parseInt(volume, 10),
      expiry_date: expiryDate,
      location,
    };

    const updated = [newItem, ...inventory];
    saveInventory(updated);

    // Reset
    setBloodGroup("");
    setVolume("");
    setExpiryDate("");
    setLocation("");
    setIsAddModalOpen(false);
  };

  const handleUpdateVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || errors.volume) return;

    const updated = inventory.map(item => 
      item.id === editingItem.id ? { ...item, volume: editingItem.volume } : item
    );
    saveInventory(updated);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm("Are you sure you want to discard this inventory item?")) {
      const updated = inventory.filter(item => item.id !== id);
      saveInventory(updated);
    }
  };

  // Helper to check if a date is within 7 days
  const isExpiringSoon = (dateStr: string) => {
    const exp = new Date(dateStr);
    const today = new Date();
    const diffTime = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  const expiringBags = inventory.filter(item => isExpiringSoon(item.expiry_date));

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = bloodGroupFilter === "all" || item.blood_group === bloodGroupFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout title="Inventory Management">
      <Stack gap="lg">
        {/* Header Summary */}
        <Split
          slots={{
            left: (
              <div>
                <h2 className="text-xl font-bold text-text-primary">Blood Bag Stock</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Perform inventory auditing, update volumes, and log storage locations.
                </p>
              </div>
            ),
            right: (
              <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add Stock
              </Button>
            ),
          }}
        />

        {/* Expiry Alarm Banner */}
        {expiringBags.length > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600">
            <Row gap="sm" className="items-start">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Critical Expiry Warning ({expiringBags.length} items)</p>
                <p className="text-xs mt-1">
                  The following storage units contain blood bags nearing their 35-day shelf-life limit. Prioritize matching:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expiringBags.map(item => (
                    <span key={item.id} className="inline-flex text-[10px] font-bold bg-amber-500/20 px-2 py-0.5 rounded font-mono">
                      {item.id} ({item.blood_group}) - {item.location} (Exp: {item.expiry_date})
                    </span>
                  ))}
                </div>
              </div>
            </Row>
          </div>
        )}

        {/* Inventory Table Toolbar & Grid */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search by Bag ID or Fridge Location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Type:</span>
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
                  <th className="p-4">Bag ID</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Volume (ml)</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => {
                    const isExp = isExpiringSoon(item.expiry_date);
                    return (
                      <tr key={item.id} className="hover:bg-border/5 transition-colors">
                        <td className="p-4 font-mono font-semibold">{item.id}</td>
                        <td className="p-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                            {item.blood_group}
                          </span>
                        </td>
                        <td className="p-4 font-medium">{item.volume} ml</td>
                        <td className="p-4">
                          <Row gap="xs" className="items-center">
                            <Calendar className="h-4 w-4 text-text-secondary" />
                            <span className={isExp ? "text-danger font-semibold" : ""}>{item.expiry_date}</span>
                          </Row>
                        </td>
                        <td className="p-4 text-text-secondary font-mono">{item.location}</td>
                        <td className="p-4">
                          {isExp ? (
                            <Badge variant="danger" className="text-[10px] uppercase font-bold py-0.5">Expiring</Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px] uppercase font-bold py-0.5">Stable</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Row gap="xs" className="justify-end">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-1.5 rounded hover:bg-border/30 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                              title="Edit volume"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-1.5 rounded hover:bg-danger/10 text-text-secondary hover:text-danger transition-colors cursor-pointer"
                              title="Discard"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </Row>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-secondary">
                      No inventory records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Stock Form */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface rounded-lg border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">Add Blood Inventory</h3>
              </div>
              <form onSubmit={handleAddStock} className="p-6">
                <Stack gap="md">
                  <FormField label="Blood Group" required error={errors.bloodGroup}>
                    <select
                      value={bloodGroup}
                      onChange={(e) => handleInputChange("bloodGroup", e.target.value, setBloodGroup)}
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

                  <FormField label="Volume (ml)" required error={errors.volume}>
                    <Input
                      type="number"
                      placeholder="e.g. 450"
                      value={volume}
                      onChange={(e) => handleInputChange("volume", e.target.value, setVolume)}
                      className={errors.volume ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Expiry Date" required error={errors.expiryDate}>
                    <Input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => handleInputChange("expiryDate", e.target.value, setExpiryDate)}
                      className={errors.expiryDate ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Storage Unit Location" required error={errors.location}>
                    <Input
                      placeholder="e.g. Fridge-A3"
                      value={location}
                      onChange={(e) => handleInputChange("location", e.target.value, setLocation)}
                      className={errors.location ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <Row gap="sm" className="justify-end pt-4 border-t border-border mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setIsAddModalOpen(false); setErrors({}); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!!(errors.bloodGroup || errors.volume || errors.expiryDate || errors.location || !bloodGroup || !volume || !expiryDate || !location)}>
                      Add Stock
                    </Button>
                  </Row>
                </Stack>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Edit Volume Form */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-surface rounded-lg border border-border shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-bold text-text-primary">Update Bag Volume ({editingItem.id})</h3>
              </div>
              <form onSubmit={handleUpdateVolume} className="p-6">
                <Stack gap="md">
                  <FormField label="Adjust Volume (ml)" required error={errors.volume}>
                    <Input
                      type="number"
                      value={editingItem.volume}
                      onChange={(e) => {
                        const val = e.target.value;
                        const vol = parseInt(val, 10);
                        let errStr = "";
                        if (!val) errStr = "Volume is required";
                        else if (isNaN(vol) || vol <= 0) errStr = "Volume must be greater than 0";

                        setErrors(prev => ({ ...prev, volume: errStr || undefined }));
                        setEditingItem({ ...editingItem, volume: vol });
                      }}
                      className={errors.volume ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <Row gap="sm" className="justify-end pt-4 border-t border-border mt-2">
                    <Button type="button" variant="secondary" onClick={() => { setEditingItem(null); setErrors({}); }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!!errors.volume}>
                      Update
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

export default BloodBankInventory;
export { BloodBankInventory };

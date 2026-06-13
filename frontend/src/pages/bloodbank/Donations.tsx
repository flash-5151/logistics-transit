import * as React from "react";
import { useState, useEffect } from "react";
import { HeartHandshake, CheckCircle, Mail, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { Badge } from "@/components/ui/atoms/Badge";
import { FormField } from "@/components/ui/molecules/form-field";
import { Stack, Row, Split, Grid } from "@/components/layout/primitives";

interface DonationRecord {
  id: string;
  donor_name: string;
  donor_email: string;
  blood_group: string;
  volume: number;
  date: string;
}

const DEFAULT_DONATIONS: DonationRecord[] = [
  { id: "DON-001", donor_name: "Sarah Jenkins", donor_email: "sarah.j@example.com", blood_group: "O-", volume: 450, date: "2026-06-12" },
  { id: "DON-002", donor_name: "Michael Chang", donor_email: "mchang@example.com", blood_group: "A+", volume: 500, date: "2026-06-10" },
  { id: "DON-003", donor_name: "Emily Rodriguez", donor_email: "emily.rod@example.com", blood_group: "B+", volume: 450, date: "2026-06-08" },
];

const BloodBankDonations: React.FC = () => {
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [volume, setVolume] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Validation errors
  const [errors, setErrors] = useState<{ donorName?: string; donorEmail?: string; bloodGroup?: string; volume?: string; date?: string }>({});

  useEffect(() => {
    const saved = localStorage.getItem("mock_donations");
    if (saved) {
      setDonations(JSON.parse(saved));
    } else {
      setDonations(DEFAULT_DONATIONS);
      localStorage.setItem("mock_donations", JSON.stringify(DEFAULT_DONATIONS));
    }
  }, []);

  const saveDonations = (updated: DonationRecord[]) => {
    setDonations(updated);
    localStorage.setItem("mock_donations", JSON.stringify(updated));
  };

  // Real-time validations
  const validateField = (field: string, val: string) => {
    const newErrors = { ...errors };

    if (field === "donorName") {
      if (!val) newErrors.donorName = "Donor name is required";
      else if (val.trim().length < 3) newErrors.donorName = "Name must be at least 3 characters";
      else delete newErrors.donorName;
    }

    if (field === "donorEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!val) newErrors.donorEmail = "Email address is required";
      else if (!emailRegex.test(val)) newErrors.donorEmail = "Invalid email format";
      else delete newErrors.donorEmail;
    }

    if (field === "bloodGroup") {
      if (!val) newErrors.bloodGroup = "Blood group is required";
      else delete newErrors.bloodGroup;
    }

    if (field === "volume") {
      const volNum = parseInt(val, 10);
      if (!val) newErrors.volume = "Volume is required";
      else if (isNaN(volNum) || volNum < 100 || volNum > 1000) {
        newErrors.volume = "Volume must be between 100 and 1,000 ml";
      } else delete newErrors.volume;
    }

    if (field === "date") {
      if (!val) {
        newErrors.date = "Donation date is required";
      } else {
        const donationDate = new Date(val);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        if (donationDate >= tomorrow) {
          newErrors.date = "Donation date cannot be in the future";
        } else delete newErrors.date;
      }
    }

    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    validateField(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Final checks
    if (errors.donorName || errors.donorEmail || errors.bloodGroup || errors.volume || errors.date || !donorName || !donorEmail || !bloodGroup || !volume || !date) {
      return;
    }

    const newDonation: DonationRecord = {
      id: `DON-${Math.floor(100 + Math.random() * 900)}`,
      donor_name: donorName,
      donor_email: donorEmail,
      blood_group: bloodGroup,
      volume: parseInt(volume, 10),
      date,
    };

    // 1. Add to Donations history
    const updatedDonations = [newDonation, ...donations];
    saveDonations(updatedDonations);

    // 2. Automatically sync / insert into Inventory in localStorage
    const savedInventory = localStorage.getItem("mock_inventory");
    const currentInventory = savedInventory ? JSON.parse(savedInventory) : [];
    
    // Calculate expiry date: 35 days from donation date
    const expDate = new Date(date);
    expDate.setDate(expDate.getDate() + 35);
    const expStr = expDate.toISOString().split("T")[0];

    const newInventoryItem = {
      id: `BAG-${Math.floor(800 + Math.random() * 200)}`,
      blood_group: bloodGroup,
      volume: parseInt(volume, 10),
      expiry_date: expStr,
      location: `Fridge-${["A", "B", "C"][Math.floor(Math.random() * 3)]}${Math.floor(1 + Math.random() * 4)}`,
    };

    localStorage.setItem("mock_inventory", JSON.stringify([newInventoryItem, ...currentInventory]));

    // Success notification
    setSuccessMessage(`Donation successfully logged! A new stock unit (${newInventoryItem.id}) has been added to inventory.`);
    
    // Reset Form
    setDonorName("");
    setDonorEmail("");
    setBloodGroup("");
    setVolume("");
    setErrors({});
    
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000);
  };

  const isFormInvalid = !!(
    errors.donorName || errors.donorEmail || errors.bloodGroup || errors.volume || errors.date ||
    !donorName || !donorEmail || !bloodGroup || !volume || !date
  );

  return (
    <DashboardLayout title="Log Donations">
      <Stack gap="lg">
        {/* Header Summary */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">Physical Donation Registry</h2>
          <p className="text-sm text-text-secondary mt-1">
            Register individual blood collections. Logs will automatically update active inventory units.
          </p>
        </div>

        {successMessage && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success">
            <Row gap="sm" className="items-center">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{successMessage}</span>
            </Row>
          </div>
        )}

        <Grid cols={1} md={5} gap="lg" className="items-start">
          {/* Donation Form Card */}
          <div className="md:col-span-3 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-primary" /> Record New Donation
            </h3>
            
            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <Grid cols={1} sm={2} gap="md">
                  <FormField label="Donor Full Name" required error={errors.donorName}>
                    <Input
                      placeholder="Sarah Jenkins"
                      value={donorName}
                      onChange={(e) => handleInputChange("donorName", e.target.value, setDonorName)}
                      leftIcon={<User className="h-4 w-4 text-text-secondary" />}
                      className={errors.donorName ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Donor Email Address" required error={errors.donorEmail}>
                    <Input
                      type="email"
                      placeholder="sarah@example.com"
                      value={donorEmail}
                      onChange={(e) => handleInputChange("donorEmail", e.target.value, setDonorEmail)}
                      leftIcon={<Mail className="h-4 w-4 text-text-secondary" />}
                      className={errors.donorEmail ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>
                </Grid>

                <Grid cols={1} sm={3} gap="md">
                  <FormField label="Blood Type" required error={errors.bloodGroup}>
                    <select
                      value={bloodGroup}
                      onChange={(e) => handleInputChange("bloodGroup", e.target.value, setBloodGroup)}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.bloodGroup ? "border-danger" : "border-border"
                      }`}
                    >
                      <option value="">Select</option>
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

                  <FormField label="Collection Date" required error={errors.date}>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleInputChange("date", e.target.value, setDate)}
                      className={errors.date ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>
                </Grid>

                <Button type="submit" disabled={isFormInvalid} className="w-full mt-4">
                  Register Donation Log
                </Button>
              </Stack>
            </form>
          </div>

          {/* History Panel */}
          <div className="md:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4">
              Recently Logged
            </h3>
            
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {donations.map((d) => (
                <div key={d.id} className="py-3.5 first:pt-0 last:pb-0">
                  <Split
                    slots={{
                      left: (
                        <div>
                          <p className="font-semibold text-sm text-text-primary">{d.donor_name}</p>
                          <p className="text-xs text-text-secondary mt-0.5 font-mono">{d.donor_email}</p>
                        </div>
                      ),
                      right: (
                        <div className="text-right">
                          <Badge variant="default" className="text-xs font-bold">{d.blood_group}</Badge>
                          <p className="text-xs text-text-secondary mt-1 font-semibold">{d.volume} ml</p>
                        </div>
                      ),
                    }}
                  />
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-medium text-text-secondary uppercase tracking-wider">
                    <span>ID: {d.id}</span>
                    <span>•</span>
                    <span>Logged on: {d.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
};

export default BloodBankDonations;
export { BloodBankDonations };

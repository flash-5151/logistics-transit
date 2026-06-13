import * as React from "react";
import { useState, useEffect } from "react";
import { HeartHandshake, CheckCircle, Mail, User } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Input } from "@/components/ui/atoms/Input";
import { FormField } from "@/components/ui/molecules/form-field";
import { Stack, Row, Grid } from "@/components/layout/primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";

interface DonationRecord {
  id: string;
  donor_name: string;
  donor_email: string;
  blood_group: string;
  volume: number;
  date: string;
}

const BloodBankDonations: React.FC = () => {
  const { user } = useAuthStore();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [volume, setVolume] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Validation errors
  const [errors, setErrors] = useState<{ donorName?: string; donorEmail?: string; bloodGroup?: string; volume?: string; date?: string }>({});

  const fetchDonations = async () => {
    try {
      const [donsRes, usersRes] = await Promise.all([
        api.get("/donations"),
        api.get("/donors/all-users")
      ]);

      const filtered = donsRes.data
        .filter((d: any) => d.blood_bank_id === user?.id)
        .map((d: any) => {
          const donorObj = usersRes.data.find((u: any) => u.id === d.donor_id);
          return {
            id: d.id,
            donor_name: donorObj ? (donorObj.full_name || donorObj.name) : "Anonymous Donor",
            donor_email: donorObj ? donorObj.email : "N/A",
            blood_group: d.blood_group,
            volume: d.quantity_ml,
            date: new Date(d.donation_date).toLocaleDateString(),
          };
        });
      setDonations(filtered);
    } catch (err) {
      console.error("Error loading donations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchDonations();
    }
  }, [user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (errors.donorName || errors.donorEmail || errors.bloodGroup || errors.volume || errors.date || !donorName || !donorEmail || !bloodGroup || !volume || !date) {
      return;
    }

    try {
      // 1. Fetch all users to see if donor exists
      const usersRes = await api.get("/donors/all-users");
      let donor = usersRes.data.find((u: any) => u.email === donorEmail && u.role === "donor");

      // 2. If donor does not exist, create account on-the-fly
      if (!donor) {
        const registerPayload = {
          email: donorEmail,
          password: "Password123!",
          full_name: donorName,
          role: "donor",
          address: "Downtown District",
          phone_number: "+1 (555) 000-0000",
          is_active: true
        };
        const regRes = await api.post("/auth/register", registerPayload);
        donor = regRes.data;
      }

      // 3. Calculate expiry: 35 days from donation date
      const expDate = new Date(date);
      expDate.setDate(expDate.getDate() + 35);

      // 4. Post donation record
      const donationPayload = {
        donor_id: donor.id,
        blood_bank_id: user?.id,
        blood_group: bloodGroup,
        quantity_ml: parseInt(volume, 10),
        expiry_date: expDate.toISOString()
      };

      await api.post("/donations/", donationPayload);

      setSuccessMessage(`Donation successfully logged for ${donorName}! Active stock has been updated.`);
      
      // Reset Form
      setDonorName("");
      setDonorEmail("");
      setBloodGroup("");
      setVolume("");
      setErrors({});
      
      fetchDonations();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (err) {
      console.error("Error logging donation:", err);
      alert("Failed to log donation. Please try again.");
    }
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
                      placeholder="e.g. Sarah Jenkins"
                      value={donorName}
                      onChange={(e) => handleInputChange("donorName", e.target.value, setDonorName)}
                      className={errors.donorName ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Donor Email Address" required error={errors.donorEmail}>
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="e.g. sarah.j@example.com"
                        value={donorEmail}
                        onChange={(e) => handleInputChange("donorEmail", e.target.value, setDonorEmail)}
                        className={errors.donorEmail ? "border-danger focus-visible:ring-danger pl-9" : "pl-9"}
                      />
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-text-secondary/60" />
                    </div>
                  </FormField>
                </Grid>

                <Grid cols={1} sm={3} gap="md">
                  <FormField label="Blood Group" required error={errors.bloodGroup}>
                    <select
                      value={bloodGroup}
                      onChange={(e) => handleInputChange("bloodGroup", e.target.value, setBloodGroup)}
                      className={`w-full h-11 rounded-md border bg-surface text-text-primary px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary ${
                        errors.bloodGroup ? "border-danger" : "border-border"
                      }`}
                    >
                      <option value="">Group</option>
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

                  <FormField label="Volume Collected (ml)" required error={errors.volume}>
                    <Input
                      type="number"
                      placeholder="e.g. 450"
                      value={volume}
                      onChange={(e) => handleInputChange("volume", e.target.value, setVolume)}
                      className={errors.volume ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>

                  <FormField label="Donation Date" required error={errors.date}>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => handleInputChange("date", e.target.value, setDate)}
                      className={errors.date ? "border-danger focus-visible:ring-danger" : ""}
                    />
                  </FormField>
                </Grid>

                <Row gap="sm" className="justify-end pt-4 border-t border-border mt-2">
                  <Button type="submit" disabled={isFormInvalid}>
                    Save Donation Record
                  </Button>
                </Row>
              </Stack>
            </form>
          </div>

          {/* Recent Records list */}
          <div className="md:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              Recent Logged Collections
            </h3>

            {loading ? (
              <p className="text-xs text-text-secondary">Loading history...</p>
            ) : donations.length > 0 ? (
              <Stack gap="sm" className="max-h-[360px] overflow-y-auto pr-1">
                {donations.map((don) => (
                  <div key={don.id} className="p-3.5 border border-border/80 hover:bg-border/5 rounded-xl transition-all shadow-xs flex items-center justify-between">
                    <Row gap="xs" className="items-center">
                      <div className="h-8 w-8 rounded-full bg-[#251C1A]/5 text-primary flex items-center justify-center shrink-0">
                        <User className="h-4.5 w-4.5" />
                      </div>
                      <Stack gap="none">
                        <p className="font-bold text-xs text-text-primary leading-tight">{don.donor_name}</p>
                        <p className="text-[10px] text-text-secondary mt-0.5">{don.date} • Type {don.blood_group}</p>
                      </Stack>
                    </Row>
                    <span className="text-xs font-bold text-success">+{don.volume} ml</span>
                  </div>
                ))}
              </Stack>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg text-text-secondary text-xs italic">
                No recent collections registered.
              </div>
            )}
          </div>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
};

export default BloodBankDonations;
export { BloodBankDonations };

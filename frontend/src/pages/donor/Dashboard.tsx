import * as React from "react";
import { useState, useEffect } from "react";
import { HeartHandshake, Shield, Award, CheckCircle, Navigation, MapPin, Calendar } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid } from "@/components/layout/primitives/Grid";
import { Stack } from "@/components/layout/primitives/Stack";
import { Row } from "@/components/layout/primitives";
import { Button } from "@/components/ui/atoms/Button";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import type { BloodRequest } from "@/types/request";

interface DonationRecord {
  id: string;
  blood_group: string;
  volume: number;
  date: string;
  location?: string;
  certificate_url?: string;
}

const DonorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const donorName = user?.name || "Donor";

  const [bloodType, setBloodType] = useState<string>(() => localStorage.getItem("donor_blood_type") || "O-");
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqsRes, donsRes, usersRes] = await Promise.all([
          api.get("/requests"),
          api.get("/donations"),
          api.get("/donors/all-users"),
        ]);
        setRequests(reqsRes.data);
        setOrganizations(usersRes.data);

        // Filter donations belonging to this donor
        const mappedDons = donsRes.data
          .filter((d: any) => d.donor_id === user?.id)
          .map((d: any) => {
            const bb = usersRes.data.find((u: any) => u.id === d.blood_bank_id);
            return {
              id: d.id,
              blood_group: d.blood_group,
              volume: d.quantity_ml,
              date: new Date(d.donation_date).toLocaleDateString(),
              location: bb ? (bb.full_name || bb.name) : "Blood Bank Center",
              certificate_url: "#",
            };
          });
        setDonations(mappedDons);
      } catch (err) {
        console.error("Error loading donor dashboard data:", err);
      }
    };
    fetchData();
  }, [user]);

  const handleBloodTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setBloodType(val);
    localStorage.setItem("donor_blood_type", val);
  };

  // Find matching alerts for the donor's blood type
  const matchingAlerts = requests.filter(r => r.status === "pending" && r.blood_group === bloodType);

  const getHospitalName = (hospitalId: string) => {
    const org = organizations.find(o => o.id === hospitalId);
    return org ? (org.full_name || org.name) : "Hospital";
  };

  const handlePledgeDonation = (req: BloodRequest) => {
    setSuccessMsg(`Pledge confirmed! 450ml of type ${bloodType} pledged for request ${req.id.substring(0, 8)}. Please visit a blood bank center to complete donation.`);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const getBadgeTier = (count: number) => {
    if (count >= 10) return "Gold Savior";
    if (count >= 5) return "Silver Giver";
    return "Bronze Contributor";
  };

  return (
    <DashboardLayout title="Donor Dashboard">
      <Stack gap="lg">
        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success animate-fade-in">
            <Row gap="sm" className="items-center">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </Row>
          </div>
        )}

        {/* Profile and Blood Type Setting */}
        <div className="bg-surface p-6 rounded-lg border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Welcome Back, {donorName}</h2>
            <p className="text-text-secondary text-sm mt-0.5">Track your impacts, explore regional needs, and pledge blood logs.</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-border/20 border border-border rounded-lg">
            <span className="text-xs font-semibold text-text-secondary select-none">My Blood Type:</span>
            <select
              value={bloodType}
              onChange={handleBloodTypeChange}
              className="bg-transparent border-none text-primary font-bold focus:outline-none cursor-pointer pr-1 text-sm"
            >
              <option value="A+" className="bg-surface text-text-primary font-semibold">A+</option>
              <option value="A-" className="bg-surface text-text-primary font-semibold">A-</option>
              <option value="B+" className="bg-surface text-text-primary font-semibold">B+</option>
              <option value="B-" className="bg-surface text-text-primary font-semibold">B-</option>
              <option value="AB+" className="bg-surface text-text-primary font-semibold">AB+</option>
              <option value="AB-" className="bg-surface text-text-primary font-semibold">AB-</option>
              <option value="O+" className="bg-surface text-text-primary font-semibold">O+</option>
              <option value="O-" className="bg-surface text-text-primary font-semibold">O-</option>
            </select>
          </div>
        </div>

        <Grid cols={1} md={3} gap="md">
          <StatCard
            title="My Donations"
            value={`${donations.length} times`}
            icon={<HeartHandshake className="text-primary" />}
            trend={
              <span className="text-xs text-success font-semibold">
                Last contribution synced
              </span>
            }
          />
          <StatCard
            title="Shortage Alerts"
            value={`${matchingAlerts.length} Active`}
            icon={<Shield className="text-danger" />}
            trend={
              <span className="text-xs text-text-secondary font-medium">
                Matching type {bloodType}
              </span>
            }
          />
          <StatCard
            title="Donor Rank"
            value={getBadgeTier(donations.length)}
            icon={<Award className="text-warning" />}
            trend={
              <span className="text-xs text-success font-semibold">
                XP: {donations.length * 100} points
              </span>
            }
          />
        </Grid>

        <Grid cols={1} lg={5} gap="lg" className="items-start">
          {/* Urgent Local Shortage Alerts matching user blood group */}
          <div className="lg:col-span-3 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-danger animate-pulse" /> Emergency Alerts for Type {bloodType}
            </h3>
            <p className="text-xs text-text-secondary mb-4 font-medium">
              We match hospital requests directly to your profile. Pledge a donation to book an immediate dispatch courier slot.
            </p>

            {matchingAlerts.length > 0 ? (
              <Stack gap="md">
                {matchingAlerts.map(alert => {
                  const isEmergency = alert.priority === "emergency";
                  const isUrgent = alert.priority === "urgent";
                  return (
                    <div 
                      key={alert.id} 
                      className={`p-5 rounded-xl border-l-4 bg-surface shadow-sm border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all hover:shadow-md ${
                        isEmergency 
                          ? "border-l-danger border-danger/10" 
                          : isUrgent 
                          ? "border-l-warning border-warning/10" 
                          : "border-l-info border-info/10"
                      }`}
                    >
                      <Row gap="md" className="items-center flex-1">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 select-none ${
                          isEmergency 
                            ? "bg-danger/10 text-danger border border-danger/20" 
                            : isUrgent 
                            ? "bg-warning/10 text-warning border border-warning/20" 
                            : "bg-info/10 text-info border border-info/20"
                        }`}>
                          {alert.blood_group}
                        </div>
                        <Stack gap="xs" className="flex-1">
                          <Row gap="xs" className="items-center">
                            <span className={`text-xs font-extrabold uppercase tracking-wider ${
                              isEmergency ? "text-danger" : isUrgent ? "text-warning" : "text-info"
                            }`}>
                              {(alert.priority || "normal").toUpperCase()} ALERT
                            </span>
                            <span className="text-xs text-text-secondary font-mono font-semibold">• {alert.id.substring(0, 8)}</span>
                          </Row>
                          <h4 className="font-bold text-sm text-text-primary">
                            {getHospitalName(alert.hospital_id)} requesting <span className="text-primary font-bold">{alert.quantity_ml} ml</span> of {alert.blood_group} blood
                          </h4>
                          <p className="text-xs text-text-secondary flex items-center gap-1 leading-none">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-text-secondary/60" /> Broadcasted {new Date(alert.created_at).toLocaleDateString()}
                          </p>
                        </Stack>
                      </Row>

                      <Button
                        onClick={() => handlePledgeDonation(alert)}
                        className="bg-primary hover:bg-primary-dark text-white font-bold text-xs py-2.5 px-4 shrink-0 cursor-pointer shadow-sm w-full md:w-auto rounded-lg transition-colors"
                      >
                        Pledge Donation
                      </Button>
                    </div>
                  );
                })}
              </Stack>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
                <p className="text-text-secondary text-sm font-medium italic">No active shortage alerts match type {bloodType} today.</p>
              </div>
            )}
          </div>

          {/* Quick timeline tracking */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Recent Donations
            </h3>

            {donations.length > 0 ? (
              <Stack gap="sm" className="max-h-[350px] overflow-y-auto pr-1">
                {donations.map((don) => (
                  <div key={don.id} className="p-4 border border-border bg-surface hover:bg-border/5 rounded-xl flex items-center justify-between transition-colors shadow-sm">
                    <Row gap="sm" className="items-center">
                      <div className="h-9 w-9 rounded-full bg-success/10 text-success flex items-center justify-center shrink-0">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <Stack gap="xs">
                        <p className="font-bold text-xs text-text-primary leading-tight">{don.location}</p>
                        <p className="text-xs text-text-secondary font-medium">Donated on {don.date} • Type {don.blood_group}</p>
                      </Stack>
                    </Row>
                    <span className="font-bold text-success text-sm shrink-0">+{don.volume} ml</span>
                  </div>
                ))}
              </Stack>
            ) : (
              <div className="text-center py-8 border border-dashed border-border rounded-lg text-text-secondary text-xs">
                No recent donations synced. Your physical donation records will show here.
              </div>
            )}
          </div>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
};

export { DonorDashboard };

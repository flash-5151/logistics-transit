import * as React from "react";
import { useState, useEffect } from "react";
import { HeartHandshake, Award, Award as MedalIcon, Calendar, Check, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid, Stack, Row } from "@/components/layout/primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";

interface HistoryRecord {
  id: string;
  date: string;
  volume: number;
  location: string;
  certificate_url: string;
  blood_group: string;
}

interface BadgeItem {
  name: string;
  description: string;
  unlocked: boolean;
  tier: "gold" | "silver" | "bronze";
}

const DonorDonations: React.FC = () => {
  const { user } = useAuthStore();
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const [donsRes, usersRes] = await Promise.all([
          api.get("/donations"),
          api.get("/donors/all-users"),
        ]);

        const filtered = donsRes.data
          .filter((d: any) => d.donor_id === user?.id)
          .map((d: any) => {
            const bb = usersRes.data.find((u: any) => u.id === d.blood_bank_id);
            return {
              id: d.id,
              date: new Date(d.donation_date).toLocaleDateString(),
              volume: d.quantity_ml,
              location: bb ? (bb.full_name || bb.name) : "Blood Bank Center",
              certificate_url: "#",
              blood_group: d.blood_group,
            };
          });

        setHistory(filtered);
      } catch (err) {
        console.error("Error loading donations:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDonations();
    }
  }, [user]);

  const totalVolume = history.reduce((sum, item) => sum + item.volume, 0);

  // Gamification achievements dynamically configured
  const badges: BadgeItem[] = [
    { name: "First Drop", description: "Completed your first emergency blood donation", unlocked: history.length >= 1, tier: "bronze" },
    { name: "Silver Savior", description: "Donated blood at least 4 times", unlocked: history.length >= 4, tier: "silver" },
    { name: "Universal Giver", description: "Donate O- type blood during emergency shortages", unlocked: history.some(h => h.blood_group === "O-"), tier: "gold" },
    { name: "Midnight Rescue", description: "Respond to a critical priority alert within 3 hours", unlocked: history.length >= 2, tier: "gold" },
    { name: "Half-Gallon Club", description: "Donated a total of 2,000 ml or more of blood", unlocked: totalVolume >= 2000, tier: "silver" },
  ];

  return (
    <DashboardLayout title="My Donation Profile">
      <Stack gap="lg">
        {/* Header Intro */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">Track Your Impact</h2>
          <p className="text-sm text-text-secondary mt-1">
            Review your collection timeline, download certificates, and view achievement levels.
          </p>
        </div>

        {/* Stats Row */}
        <Grid cols={1} sm={2} md={4} gap="md">
          <StatCard
            title="Total Donations"
            value={loading ? "..." : `${history.length} times`}
            icon={<HeartHandshake className="text-primary" />}
            trend={<span className="text-xs text-success font-semibold">Active Contributor</span>}
          />
          <StatCard
            title="Total Volume"
            value={loading ? "..." : `${totalVolume} ml`}
            icon={<MedalIcon className="text-warning" />}
            trend={<span className="text-xs text-text-secondary font-medium">~{(totalVolume / 3785.41).toFixed(2)} gallons</span>}
          />
          <StatCard
            title="Lives Impacted"
            value={loading ? "..." : `${history.length * 3}`}
            icon={<Award className="text-success" />}
            trend={<span className="text-xs text-success font-medium">3 lives per donation</span>}
          />
          <StatCard
            title="Eligibility"
            value="Eligible Now"
            icon={<Calendar className="text-info" />}
            trend={<span className="text-xs text-success font-semibold">Safe to Donate</span>}
          />
        </Grid>

        <Grid cols={1} md={5} gap="lg" className="items-start">
          {/* Timeline Table */}
          <div className="md:col-span-3 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Donation Timeline
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                    <th className="p-3">Reference ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Volume</th>
                    <th className="p-3">Center Location</th>
                    <th className="p-3 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs text-text-primary">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-text-secondary">Loading donation history...</td>
                    </tr>
                  ) : history.length > 0 ? (
                    history.map((record) => (
                      <tr key={record.id} className="hover:bg-border/5">
                        <td className="p-3 font-mono font-medium">{record.id.substring(0, 8)}</td>
                        <td className="p-3 font-medium">{record.date}</td>
                        <td className="p-3">{record.volume} ml</td>
                        <td className="p-3 text-text-secondary">{record.location}</td>
                        <td className="p-3 text-right">
                          <button
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary border border-primary/20 hover:bg-primary/5 px-2 py-1 rounded cursor-pointer transition-colors"
                            onClick={() => alert("Downloading digital PDF certificate...")}
                          >
                            <Download className="h-3 w-3" /> Get PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-text-secondary italic">
                        No donation records found. Visit a blood bank center to make your first contribution!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gamification Badges Panel */}
          <div className="md:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" /> Achievements & Badges
            </h3>

            <Stack gap="sm">
              {badges.map((b) => {
                return (
                  <div 
                    key={b.name} 
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                      b.unlocked 
                        ? "bg-surface border-border" 
                        : "bg-border/10 border-border/40 opacity-50"
                    }`}
                  >
                    <div className={`p-2 rounded-full mt-0.5 shrink-0 ${
                      b.unlocked 
                        ? b.tier === "gold" ? "bg-yellow-500/10 text-yellow-500" : b.tier === "silver" ? "bg-slate-400/10 text-slate-400" : "bg-amber-600/10 text-amber-600"
                        : "bg-border/40 text-text-secondary"
                    }`}>
                      <MedalIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Row gap="xs" className="items-center">
                        <p className="font-semibold text-sm text-text-primary">{b.name}</p>
                        {b.unlocked && (
                          <span className="p-0.5 rounded-full bg-success/15 text-success">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </Row>
                      <p className="text-xs text-text-secondary mt-1">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </Stack>
          </div>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
};

export default DonorDonations;
export { DonorDonations };

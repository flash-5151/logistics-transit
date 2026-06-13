import * as React from "react";
import { useState, useEffect } from "react";
import { HeartHandshake, Award, Award as MedalIcon, Calendar, Check, Download } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid, Stack, Row } from "@/components/layout/primitives";

interface HistoryRecord {
  id: string;
  date: string;
  volume: number;
  location: string;
  certificate_url: string;
}

const HISTORY_DATA: HistoryRecord[] = [
  { id: "DON-992", date: "2026-04-12", volume: 450, location: "Red Cross Center", certificate_url: "#" },
  { id: "DON-841", date: "2025-11-02", volume: 500, location: "City General Blood Bank", certificate_url: "#" },
  { id: "DON-702", date: "2025-06-15", volume: 450, location: "Saint Mary Hospital", certificate_url: "#" },
  { id: "DON-501", date: "2025-01-22", volume: 450, location: "Red Cross Center", certificate_url: "#" },
];

interface BadgeItem {
  name: string;
  description: string;
  unlocked: boolean;
  tier: "gold" | "silver" | "bronze";
}

const BADGES: BadgeItem[] = [
  { name: "First Drop", description: "Completed your first emergency blood donation", unlocked: true, tier: "bronze" },
  { name: "Silver Savior", description: "Donated blood at least 4 times", unlocked: true, tier: "silver" },
  { name: "Universal Giver", description: "Donate O- type blood during emergency shortages", unlocked: false, tier: "gold" },
  { name: "Midnight Rescue", description: "Respond to a critical priority alert within 3 hours", unlocked: false, tier: "gold" },
  { name: "Half-Gallon Club", description: "Donated a total of 2,000 ml or more of blood", unlocked: false, tier: "silver" },
];

const DonorDonations: React.FC = () => {
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    // We can fetch from local storage if the blood bank logged something under their email
    const savedDonations = localStorage.getItem("mock_donations");
    if (savedDonations) {
      const allDons = JSON.parse(savedDonations);
      // Filter donations that might belong to the user
      // For this static bypass mock, we will just merge the default user history with any newly logged logs
      const formattedMock = allDons.map((d: any) => ({
        id: d.id,
        date: d.date,
        volume: d.volume,
        location: "Logged Center",
        certificate_url: "#",
      }));
      
      // Filter out defaults so we don't duplicate
      const combined = [...formattedMock.filter((x: any) => !HISTORY_DATA.some(y => y.id === x.id)), ...HISTORY_DATA];
      setHistory(combined);
    } else {
      setHistory(HISTORY_DATA);
    }
  }, []);

  const totalVolume = history.reduce((sum, item) => sum + item.volume, 0);

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
            value={`${history.length} times`}
            icon={<HeartHandshake className="text-primary" />}
            trend={<span className="text-xs text-success font-semibold">Active Contributor</span>}
          />
          <StatCard
            title="Total Volume"
            value={`${totalVolume} ml`}
            icon={<MedalIcon className="text-warning" />}
            trend={<span className="text-xs text-text-secondary font-medium">~0.6 gallons</span>}
          />
          <StatCard
            title="Lives Impacted"
            value={`${history.length * 3}`}
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
                  {history.map((record) => (
                    <tr key={record.id} className="hover:bg-border/5">
                      <td className="p-3 font-mono font-medium">{record.id}</td>
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
                  ))}
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
              {BADGES.map((b) => {
                // If Silver Savior and user has >= 4 donations, force unlock
                const isSilverSavior = b.name === "Silver Savior";
                const isHalfGallon = b.name === "Half-Gallon Club";
                const actuallyUnlocked = b.unlocked || 
                  (isSilverSavior && history.length >= 4) ||
                  (isHalfGallon && totalVolume >= 2000);

                return (
                  <div 
                    key={b.name} 
                    className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                      actuallyUnlocked 
                        ? "bg-surface border-border" 
                        : "bg-border/10 border-border/40 opacity-50"
                    }`}
                  >
                    <div className={`p-2 rounded-full mt-0.5 shrink-0 ${
                      actuallyUnlocked 
                        ? b.tier === "gold" ? "bg-yellow-500/10 text-yellow-500" : b.tier === "silver" ? "bg-slate-400/10 text-slate-400" : "bg-amber-600/10 text-amber-600"
                        : "bg-border/40 text-text-secondary"
                    }`}>
                      <MedalIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <Row gap="xs" className="items-center">
                        <p className="font-semibold text-sm text-text-primary">{b.name}</p>
                        {actuallyUnlocked && (
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

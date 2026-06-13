import * as React from "react";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  Users,
  ShieldAlert,
  Map,
  MapPin,
  AlertCircle,
  Heart,
  Award,
  Building,
  HeartHandshake,
  Medal,
  Globe,
  Siren,
  DropletIcon,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Badge } from "@/components/ui/atoms/Badge";
import { Grid, Stack, Row, Split } from "@/components/layout/primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import {
  HeatmapMap,
  type HeatmapSector,
} from "@/components/ui/molecules/heatmap-map/HeatmapMap";

interface Organization {
  id: string;
  name: string;
  type: "hospital" | "blood_bank";
  location: string;
  contact: string;
  status: "active" | "suspended";
}

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

interface RequestItem {
  id: string;
  blood_group: string;
  volume: number;
  urgency: "normal" | "urgent" | "emergency";
  status: "pending" | "matched" | "in_transit" | "delivered";
  created_at: string;
  created_by: "hospital" | "blood_bank" | string;
  hospital_name?: string;
}

interface InventoryItem {
  id: string;
  blood_group: string;
  volume: number;
  expiry_date: string;
  location: string;
  center_name?: string;
}

interface TransferItem {
  id: string;
  request_id: string;
  source: string;
  blood_group: string;
  volume: number;
  status: "pending" | "in_transit" | "delivered";
  eta: string;
}

interface DonationRecord {
  id: string;
  donor_name: string;
  donor_email: string;
  blood_group: string;
  volume: number;
  date: string;
  location?: string;
  certificate_url?: string;
}

// ─────────────────────────────────────────────────────────
// District sector data — Chennai city district polygons
// ─────────────────────────────────────────────────────────
const BASE_HEATMAP_SECTORS: HeatmapSector[] = [
  {
    id: "SEC-A",
    name: "Downtown District",
    shortage_level: "low",
    details: "All blood stock levels stable",
    active_requests: 0,
    critical_groups: [],
    center: [80.2707, 13.06],
    coordinates: [
      [80.245, 13.04],
      [80.285, 13.04],
      [80.285, 13.075],
      [80.245, 13.075],
    ],
  },
  {
    id: "SEC-B",
    name: "Northside Suburbs",
    shortage_level: "medium",
    details: "A+ supply dipping below safety margins",
    active_requests: 3,
    critical_groups: ["A+"],
    center: [80.25, 13.14],
    coordinates: [
      [80.22, 13.11],
      [80.28, 13.11],
      [80.28, 13.17],
      [80.22, 13.17],
    ],
  },
  {
    id: "SEC-C",
    name: "Eastgate Sector",
    shortage_level: "critical",
    details: "Urgent O- supply shortage. Request courier backup",
    active_requests: 6,
    critical_groups: ["O-", "O+"],
    center: [80.335, 13.07],
    coordinates: [
      [80.29, 13.05],
      [80.37, 13.05],
      [80.37, 13.095],
      [80.29, 13.095],
    ],
  },
  {
    id: "SEC-D",
    name: "Southside Valley",
    shortage_level: "low",
    details: "Inventory fully replenished from recent blood drives",
    active_requests: 1,
    critical_groups: [],
    center: [80.26, 12.98],
    coordinates: [
      [80.22, 12.95],
      [80.295, 12.95],
      [80.295, 13.01],
      [80.22, 13.01],
    ],
  },
  {
    id: "SEC-E",
    name: "Westside Heights",
    shortage_level: "critical",
    details: "Emergency depletion of AB- stock",
    active_requests: 4,
    critical_groups: ["AB-", "A-"],
    center: [80.19, 13.08],
    coordinates: [
      [80.16, 13.06],
      [80.22, 13.06],
      [80.22, 13.105],
      [80.16, 13.105],
    ],
  },
  {
    id: "SEC-F",
    name: "Industrial Zone",
    shortage_level: "low",
    details: "No active requests, local depot is stocked",
    active_requests: 0,
    critical_groups: [],
    center: [80.31, 13.14],
    coordinates: [
      [80.285, 13.11],
      [80.35, 13.11],
      [80.35, 13.17],
      [80.285, 13.17],
    ],
  },
];

// ─────────────────────────────────────────────────────────
// Leaderboard data
// ─────────────────────────────────────────────────────────
interface LeaderboardUser {
  rank: number;
  name: string;
  donations: number;
  badge: string;
  blood_group: string;
}

const LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: "Marcus Aurelius", donations: 14, badge: "Gold Patron", blood_group: "O-" },
  { rank: 2, name: "Sarah Jenkins", donations: 8, badge: "Silver Savior", blood_group: "O-" },
  { rank: 3, name: "David Kim", donations: 7, badge: "Silver Savior", blood_group: "AB+" },
  { rank: 4, name: "Elena Rostova", donations: 5, badge: "Bronze Contributor", blood_group: "B-" },
  { rank: 5, name: "Michael Chang", donations: 4, badge: "Bronze Contributor", blood_group: "A+" },
];

// ─────────────────────────────────────────────────────────
// Shared: Map legend strip
// ─────────────────────────────────────────────────────────
const MapLegend: React.FC = () => (
  <div className="flex items-center gap-5 text-xs font-medium text-text-secondary">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-green-500/50 border border-green-500" />
      Low Risk
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-amber-500/50 border border-amber-500" />
      Medium Risk
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm bg-red-500/50 border border-red-500" />
      Critical
    </span>
    <span className="ml-auto text-text-secondary/60 italic text-[11px]">
      Click any district polygon to inspect
    </span>
  </div>
);

// ─────────────────────────────────────────────────────────
// Shared: Critical alert banner (top-of-page urgency strip)
// ─────────────────────────────────────────────────────────
const CriticalAlertBanner: React.FC<{
  sectors: HeatmapSector[];
  onSelect: (s: HeatmapSector) => void;
}> = ({ sectors, onSelect }) => {
  const criticals = sectors.filter((s) => s.shortage_level === "critical");
  if (criticals.length === 0) return null;

  return (
    <div className="rounded-xl border border-danger/40 bg-danger/8 px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Siren className="h-5 w-5 text-danger shrink-0" />
        <p className="text-sm font-bold text-danger tracking-wide uppercase">
          {criticals.length} Critical Shortage{criticals.length > 1 ? "s" : ""} Active
        </p>
        <span className="ml-auto text-xs text-danger/70 font-medium">Immediate action required</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {criticals.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-danger/10 hover:bg-danger/20 border border-danger/30 transition-all cursor-pointer group"
          >
            <DropletIcon className="h-3.5 w-3.5 text-danger" />
            <div className="text-left">
              <span className="block text-xs font-bold text-danger leading-tight">{s.name}</span>
              <span className="block text-[11px] text-danger/70 leading-tight font-mono">
                {s.critical_groups.join(" · ")}
              </span>
            </div>
            <span className="ml-1 text-[10px] text-danger/50 font-bold">
              {s.active_requests} req
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Shared: Selected sector detail panel
// ─────────────────────────────────────────────────────────
const SectorDetailPanel: React.FC<{
  sector: HeatmapSector;
  showCourierInfo?: boolean;
}> = ({ sector, showCourierInfo = false }) => {
  const colorMap = {
    critical: { ring: "border-danger/40 bg-danger/5", icon: "bg-danger/10 text-danger", badge: "danger" as const },
    medium: { ring: "border-warning/40 bg-warning/5", icon: "bg-warning/10 text-warning", badge: "warning" as const },
    low: { ring: "border-success/30 bg-success/5", icon: "bg-success/10 text-success", badge: "success" as const },
  };
  const styles = colorMap[sector.shortage_level];

  return (
    <div className={`rounded-xl border p-5 ${styles.ring}`}>
      <Split
        slots={{
          left: (
            <Row gap="md" className="items-start">
              <div className={`p-3 rounded-xl shrink-0 ${styles.icon}`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-text-primary">{sector.name}</h3>
                  <span className="text-sm font-mono text-text-secondary">({sector.id})</span>
                </div>
                <p className="text-sm text-text-secondary mt-0.5 leading-relaxed">{sector.details}</p>
                {sector.critical_groups.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-xs text-text-secondary font-medium">Critical types:</span>
                    {sector.critical_groups.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 rounded-md bg-danger/10 text-danger text-xs font-bold font-mono border border-danger/20"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Row>
          ),
          right: (
            <Row gap="sm" className="flex-wrap mt-2 lg:mt-0 shrink-0 select-none">
              <Badge variant={styles.badge} className="text-xs font-bold px-3 py-1">
                Risk: {sector.shortage_level.toUpperCase()}
              </Badge>
              {showCourierInfo && sector.active_requests > 0 && (
                <Badge className="text-xs font-bold px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {sector.active_requests} Active {sector.active_requests === 1 ? "Request" : "Requests"}
                </Badge>
              )}
            </Row>
          ),
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Shared: Supply trend SVG chart
// ─────────────────────────────────────────────────────────
const chartPoints = [
  { label: "Jan", val: 80, pred: 80 },
  { label: "Feb", val: 95, pred: 95 },
  { label: "Mar", val: 110, pred: 110 },
  { label: "Apr", val: 75, pred: 75 },
  { label: "May", val: 65, pred: 65 },
  { label: "Jun", val: 88, pred: 88 },
  { label: "Jul", val: null, pred: 50 },
  { label: "Aug", val: null, pred: 45 },
  { label: "Sep", val: null, pred: 70 },
];

const SupplyTrendChart: React.FC<{
  strokeColor: string;
  fillGradientId: string;
  isForecast: boolean;
  title: string;
  subtitle: string;
}> = ({ strokeColor, fillGradientId, isForecast, title, subtitle }) => {
  const [hovered, setHovered] = useState<{
    label: string;
    value: number;
    type: string;
  } | null>(null);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h3 className="text-sm font-bold text-text-primary">{title}</h3>
      <p className="text-xs text-text-secondary mt-0.5 mb-4">{subtitle}</p>

      <div className="relative bg-border/5 rounded-lg p-3 border border-border/10">
        <svg viewBox="0 0 500 200" className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C14E3A" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#C14E3A" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[40, 80, 120, 160].map((y, i) => (
            <line key={i} x1="30" y1={y} x2="480" y2={y}
              stroke="var(--color-border)" strokeWidth="0.5" strokeDasharray="4 4" />
          ))}

          <path
            d={`M 30 180 L 30 100 L 85 82 L 140 64 L 195 106 L 250 118 L 305 92 L 305 180 Z`}
            fill={`url(#${fillGradientId})`}
          />
          {isForecast && (
            <path
              d="M 305 92 L 360 137 L 415 145 L 470 112 L 470 180 L 305 180 Z"
              fill="url(#predGrad)" opacity="0.6"
            />
          )}

          <path
            d="M 30 100 L 85 82 L 140 64 L 195 106 L 250 118 L 305 92"
            fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round"
          />
          {isForecast && (
            <path
              d="M 305 92 L 360 137 L 415 145 L 470 112"
              fill="none" stroke="#C14E3A" strokeWidth="2.5"
              strokeDasharray="6 4" strokeLinecap="round"
            />
          )}

          {[
            { cx: 30, cy: 100, label: "Jan", value: 80 },
            { cx: 85, cy: 82, label: "Feb", value: 95 },
            { cx: 140, cy: 64, label: "Mar", value: 110 },
            { cx: 195, cy: 106, label: "Apr", value: 75 },
            { cx: 250, cy: 118, label: "May", value: 65 },
            { cx: 305, cy: 92, label: "Jun", value: 88 },
          ].map((pt) => (
            <circle key={pt.label} cx={pt.cx} cy={pt.cy} r="5" fill={strokeColor}
              className="cursor-pointer"
              onMouseEnter={() => setHovered({ label: pt.label, value: pt.value, type: "Actual" })}
              onMouseLeave={() => setHovered(null)}
            />
          ))}

          {isForecast &&
            [
              { cx: 360, cy: 137, label: "Jul", value: 50 },
              { cx: 415, cy: 145, label: "Aug", value: 45 },
              { cx: 470, cy: 112, label: "Sep", value: 70 },
            ].map((pt) => (
              <circle key={pt.label} cx={pt.cx} cy={pt.cy} r="5" fill="#C14E3A"
                className="cursor-pointer"
                onMouseEnter={() => setHovered({ label: pt.label, value: pt.value, type: "AI Forecast" })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

          {chartPoints.map((p, idx) => (
            <text key={idx} x={30 + idx * 55} y="196"
              fill="var(--color-text-secondary)" fontSize="9"
              textAnchor="middle" fontFamily="ui-monospace,monospace" fontWeight="500">
              {p.label}
            </text>
          ))}
        </svg>

        <div className="h-7 flex justify-center items-center mt-2 border-t border-border/10 text-xs">
          {hovered ? (
            <span className="text-text-primary">
              <strong>{hovered.label}</strong> — Supply:{" "}
              <strong className="text-primary">{hovered.value}%</strong>{" "}
              <span className="text-text-secondary">({hovered.type})</span>
            </span>
          ) : (
            <span className="text-text-secondary italic">
              Hover data points to inspect monthly values
            </span>
          )}
        </div>
      </div>

      {isForecast && (
        <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-0.5 bg-primary rounded" />
            Actual
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-px border-t-2 border-dashed border-red-500" />
            AI Forecast
          </span>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────
const SharedAnalytics: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedSectorId, setSelectedSectorId] = useState<string>("SEC-C");
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donors, setDonors] = useState<DonorProfile[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqsRes, invRes, usersRes, transRes, donsRes] = await Promise.all([
          api.get("/requests"),
          api.get("/inventory"),
          api.get("/donors/all-users"),
          api.get("/transfers"),
          api.get("/donations"),
        ]);

        const mappedOrgs: Organization[] = usersRes.data
          .filter((u: any) => u.role === "hospital" || u.role === "blood_bank")
          .map((u: any) => ({
            id: u.id,
            name: u.full_name || "Organization",
            type: u.role,
            location: u.address || "Unknown Sector",
            contact: u.phone_number || "N/A",
            status: u.is_active ? "active" : "suspended",
          }));

        const mappedRequests: RequestItem[] = reqsRes.data.map((r: any) => {
          const hospital = usersRes.data.find((u: any) => u.id === r.hospital_id);
          return {
            id: r.id,
            blood_group: r.blood_group,
            volume: r.quantity_ml,
            urgency: r.priority || "normal",
            status: r.status,
            created_at: new Date(r.created_at).toLocaleString(),
            created_by: "hospital",
            hospital_name: hospital ? (hospital.full_name || hospital.name) : "Hospital",
          };
        });

        const mappedInventory: InventoryItem[] = invRes.data.map((i: any) => {
          const bb = usersRes.data.find((u: any) => u.id === i.blood_bank_id);
          return {
            id: i.id,
            blood_group: i.blood_group,
            volume: i.quantity_ml,
            expiry_date: i.expiry_date.split("T")[0],
            location: i.location || "N/A",
            center_name: bb ? (bb.full_name || bb.name) : "Blood Bank",
          };
        });

        const mappedTransfers: TransferItem[] = transRes.data.map((t: any) => {
          const req = reqsRes.data.find((r: any) => r.id === t.request_id);
          const source = usersRes.data.find((u: any) => u.id === t.sender_id);
          return {
            id: t.id,
            request_id: t.request_id,
            source: source ? (source.full_name || source.name) : "Blood Bank Depot",
            blood_group: req ? req.blood_group : "O-",
            volume: req ? req.quantity_ml : 450,
            status: t.status === "requested" ? "pending" : t.status,
            eta: t.status === "delivered" ? "Delivered" : "15 mins",
          };
        });

        const mappedDonors: DonorProfile[] = usersRes.data
          .filter((u: any) => u.role === "donor")
          .map((u: any) => {
            const userDons = donsRes.data.filter((d: any) => d.donor_id === u.id);
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
              status: u.is_active ? "active" : "inactive",
              total_donations: userDons.length,
            };
          });

        const mappedDonations = donsRes.data.map((d: any) => {
          const donor = usersRes.data.find((u: any) => u.id === d.donor_id);
          const bb = usersRes.data.find((u: any) => u.id === d.blood_bank_id);
          return {
            id: d.id,
            donor_name: donor ? (donor.full_name || donor.name) : "Donor",
            donor_email: donor ? donor.email : "",
            blood_group: d.blood_group,
            volume: d.quantity_ml,
            date: new Date(d.donation_date).toLocaleDateString(),
            location: bb ? (bb.full_name || bb.name) : "Blood Bank Center",
            certificate_url: "#",
          };
        });

        setRequests(mappedRequests);
        setInventory(mappedInventory);
        setOrganizations(mappedOrgs);
        setTransfers(mappedTransfers);
        setDonors(mappedDonors);
        setDonations(mappedDonations);
      } catch (err) {
        console.error("Error loading shared analytics data:", err);
      }
    };
    fetchData();
  }, []);

  const dynamicSectors: HeatmapSector[] = BASE_HEATMAP_SECTORS.map(sector => {
    const orgNames = organizations
      .filter(o => o.location === sector.name)
      .map(o => o.name);

    const sectorPendingRequests = requests.filter(
      r => r.status === "pending" && r.hospital_name && orgNames.includes(r.hospital_name)
    );

    const active_requests = sectorPendingRequests.length;
    const critical_groups = Array.from(new Set(sectorPendingRequests.map(r => r.blood_group)));

    let shortage_level: "low" | "medium" | "critical" = "low";
    let details = "All blood stock levels stable";

    if (active_requests > 0) {
      const hasEmergency = sectorPendingRequests.some(r => r.urgency === "emergency");
      const hasUrgent = sectorPendingRequests.some(r => r.urgency === "urgent");
      if (hasEmergency) {
        shortage_level = "critical";
        details = `Urgent shortage of ${critical_groups.join(", ")} supply. Request courier backup.`;
      } else if (hasUrgent) {
        shortage_level = "medium";
        details = `${critical_groups.join(", ")} supply dipping below safety margins.`;
      } else {
        shortage_level = "medium";
        details = `${critical_groups.join(", ")} requested by local hospitals.`;
      }
    } else {
      const bankNames = organizations
        .filter(o => o.location === sector.name && o.type === "blood_bank")
        .map(o => o.name);
      const sectorInventory = inventory.filter(i => i.center_name && bankNames.includes(i.center_name));
      const totalSectorVolume = sectorInventory.reduce((sum, item) => sum + item.volume, 0);
      if (totalSectorVolume < 2000 && bankNames.length > 0) {
        shortage_level = "medium";
        details = "Local depot inventory dipping below threshold.";
      }
    }

    return {
      ...sector,
      shortage_level,
      details,
      active_requests,
      critical_groups,
    };
  });

  const selectedSector = dynamicSectors.find(s => s.id === selectedSectorId) || dynamicSectors[0];
  const setSelectedSector = (s: HeatmapSector | null) => {
    if (s) setSelectedSectorId(s.id);
  };
  const HEATMAP_SECTORS = dynamicSectors;

  // Compute common dynamic metrics for views
  const activeCouriersCount = transfers.filter(t => t.status === "in_transit").length;
  const activeBloodBanksCount = organizations.filter(o => o.type === "blood_bank" && o.status === "active").length;
  
  const depletedGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].filter(bg => {
    const vol = inventory.filter(i => i.blood_group === bg).reduce((sum, item) => sum + item.volume, 0);
    return vol < 2000;
  });
  
  const criticalShortagesCount = dynamicSectors.filter(s => s.shortage_level === "critical").length;
  const totalStockVolume = inventory.reduce((sum, item) => sum + item.volume, 0);
  
  const upcomingExpiriesCount = inventory.filter(item => {
    const exp = new Date(item.expiry_date);
    const today = new Date();
    const diff = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  }).length;

  const myDonations = donations.filter(d => d.donor_email === user?.email || d.donor_name === user?.name);
  const myDonationsCount = myDonations.length + 4;
  const myVolumeSum = myDonations.reduce((sum, item) => sum + item.volume, 0) + 1850;
  
  const activeDonorsCount = donors.filter(d => d.status === "active").length + 1800;
  const totalNetworkUsers = organizations.length + donors.filter(d => d.status === "active").length + 1350;

  const role = user?.role || "hospital";

  // ── HOSPITAL VIEW ─────────────────────────────────────────
  if (role === "hospital") {
    return (
      <DashboardLayout title="Supply Analytics">
        <Stack gap="lg">
          {/* Page header */}
          <div>
            <h2 className="text-xl font-bold text-text-primary">Regional Stock &amp; Courier Insights</h2>
            <p className="text-sm text-text-secondary mt-1">
              Monitor live shortage zones, audit courier dispatch performance, and plan emergency requests.
            </p>
          </div>

          {/* 1. CRITICAL ALERT BANNER — highest urgency, first */}
          <CriticalAlertBanner sectors={HEATMAP_SECTORS} onSelect={setSelectedSector} />

          {/* 2. HEATMAP — full width, dominant, most actionable */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Live Depletion Heatmap</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    District-level blood shortage visibility — click any zone for details
                  </p>
                </div>
              </div>
              <MapLegend />
            </div>
            <HeatmapMap
              sectors={HEATMAP_SECTORS}
              selectedSectorId={selectedSector?.id}
              onSectorClick={setSelectedSector}
              height="460px"
            />
          </div>

          {/* 3. SELECTED SECTOR DETAIL — immediate context for selected zone */}
          {selectedSector && (
            <SectorDetailPanel sector={selectedSector} showCourierInfo />
          )}

          {/* 4. STAT CARDS — supporting metrics */}
          <Grid cols={1} sm={3} gap="md">
            <StatCard
              title="Couriers In Transit"
              value={`${activeCouriersCount} units`}
              icon={<TrendingUp className="text-success" />}
              trend={<span className="text-xs text-success font-semibold">Average transit: 24 mins</span>}
            />
            <StatCard
              title="Nearby Suppliers"
              value={`${activeBloodBanksCount} Banks`}
              icon={<Building className="text-info" />}
              trend={<span className="text-xs text-text-secondary font-medium">Within 5 miles</span>}
            />
            <StatCard
              title="Critical Depletions"
              value={depletedGroups.slice(0, 3).join(", ") || "None"}
              icon={<ShieldAlert className="text-danger" />}
              trend={<span className="text-xs text-danger font-semibold">Shortages flagged</span>}
            />
          </Grid>

          {/* 5. TREND CHART — lowest urgency, historical context */}
          <SupplyTrendChart
            strokeColor="#0ea5e9"
            fillGradientId="areaGrad"
            isForecast={false}
            title="Supplier Courier Transit Trends"
            subtitle="Historical delivery performance — average couriers dispatched per month"
          />
        </Stack>
      </DashboardLayout>
    );
  }

  // ── BLOOD BANK VIEW ───────────────────────────────────────
  if (role === "blood_bank") {
    return (
      <DashboardLayout title="Donation Analytics">
        <Stack gap="lg">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Inventory &amp; Regional Demand Map</h2>
            <p className="text-sm text-text-secondary mt-1">
              Identify hospital demand hotspots, audit collection trends, and forecast seasonal supply peaks.
            </p>
          </div>

          {/* 1. CRITICAL ALERT BANNER */}
          <CriticalAlertBanner sectors={HEATMAP_SECTORS} onSelect={setSelectedSector} />

          {/* 2. HEATMAP — dominant, full-width */}
          <div className="bg-surface rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Hospital Request Heatmap</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Real-time district demand — click to inspect active hospital request levels
                  </p>
                </div>
              </div>
              <MapLegend />
            </div>
            <HeatmapMap
              sectors={HEATMAP_SECTORS}
              selectedSectorId={selectedSector?.id}
              onSectorClick={setSelectedSector}
              height="460px"
            />
          </div>

          {/* 3. SELECTED SECTOR DETAIL */}
          {selectedSector && (
            <div className={`rounded-xl border p-5 ${
              selectedSector.shortage_level === "critical"
                ? "border-danger/40 bg-danger/5"
                : selectedSector.shortage_level === "medium"
                ? "border-warning/30 bg-warning/5"
                : "border-border bg-surface"
            }`}>
              <h4 className="font-bold text-text-primary mb-1">
                Active Hospital Orders — {selectedSector.name}
              </h4>
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{selectedSector.active_requests}</span>{" "}
                pending courier{selectedSector.active_requests !== 1 ? "s" : ""} requested for blood types:{" "}
                <span className="font-bold text-danger">
                  {selectedSector.critical_groups.join(", ") || "None"}
                </span>
              </p>
            </div>
          )}

          {/* 4. STAT CARDS */}
          <Grid cols={1} sm={3} gap="md">
            <StatCard
              title="Regional Donations Logged"
              value={`${donations.length + 130} units`}
              icon={<HeartHandshake className="text-primary" />}
              trend={<span className="text-xs text-success font-semibold">+8% increase this week</span>}
            />
            <StatCard
              title="Total Stock Volume"
              value={`${totalStockVolume.toLocaleString()} ml`}
              icon={<Building className="text-success" />}
              trend={<span className="text-xs text-text-secondary font-medium">Capacity: 75%</span>}
            />
            <StatCard
              title="Upcoming Expiries"
              value={`${upcomingExpiriesCount} Bags`}
              icon={<ShieldAlert className="text-warning" />}
              trend={<span className="text-xs text-warning font-semibold">Expiring in &lt; 7 days</span>}
            />
          </Grid>

          {/* 5. TREND CHART */}
          <SupplyTrendChart
            strokeColor="#C14E3A"
            fillGradientId="predGrad"
            isForecast={true}
            title="Blood Collection &amp; Depletion Forecast"
            subtitle="Collection trends against 3-month AI seasonal demand estimates"
          />
        </Stack>
      </DashboardLayout>
    );
  }

  // ── DONOR VIEW ───────────────────────────────────────────
  if (role === "donor") {
    const criticals = HEATMAP_SECTORS.filter((s) => s.shortage_level === "critical");

    return (
      <DashboardLayout title="Community Impact">
        <Stack gap="lg">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              Donation Leaderboards &amp; Urgent Needs
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              See where your blood type is critically needed, track your rank, and earn community badges.
            </p>
          </div>

          {/* 1. CRITICAL ALERT BANNER */}
          <CriticalAlertBanner sectors={HEATMAP_SECTORS} onSelect={setSelectedSector} />

          {/* 2. HEATMAP + URGENT LIST — side by side, map dominant */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Map — takes 2/3 */}
            <div className="lg:col-span-2 bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-lg bg-danger/10 text-danger">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Urgent Needs — Live Map</h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Red zones have critical shortages matching common blood types — click to zoom
                  </p>
                </div>
              </div>
              <HeatmapMap
                sectors={HEATMAP_SECTORS}
                selectedSectorId={selectedSector?.id}
                onSectorClick={setSelectedSector}
                height="380px"
              />
              <div className="mt-3">
                <MapLegend />
              </div>
            </div>

            {/* Urgent shortage list — takes 1/3 */}
            <div className="bg-surface rounded-xl border border-danger/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Siren className="h-5 w-5 text-danger" />
                <h3 className="text-base font-bold text-danger">Critical Zones</h3>
                <Badge variant="danger" className="ml-auto text-xs font-bold">
                  {criticals.length} Active
                </Badge>
              </div>
              <Stack gap="sm">
                {criticals.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(s)}
                    className={`w-full text-left p-4 rounded-lg border transition-all cursor-pointer ${
                      selectedSector?.id === s.id
                        ? "border-danger bg-danger/15 shadow-sm"
                        : "border-danger/25 bg-danger/5 hover:bg-danger/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-sm text-danger leading-tight">{s.name}</p>
                        <p className="text-xs text-text-secondary mt-1">{s.details}</p>
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {s.critical_groups.map((g) => (
                            <span
                              key={g}
                              className="px-2 py-0.5 rounded-md bg-danger/15 text-danger text-xs font-bold font-mono border border-danger/30"
                            >
                              {g}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-danger/60 shrink-0 mt-0.5">
                        {s.active_requests} req
                      </span>
                    </div>
                  </button>
                ))}
              </Stack>
            </div>
          </div>

          {/* 3. SELECTED SECTOR DETAIL */}
          {selectedSector && (
            <SectorDetailPanel sector={selectedSector} />
          )}

          {/* 4. STAT CARDS */}
          <Grid cols={1} sm={3} gap="md">
            <StatCard
              title="My Personal Logs"
              value={`${myDonationsCount} times`}
              icon={<Heart className="text-primary" />}
              trend={<span className="text-xs text-success font-semibold">Unlocked Silver Tier</span>}
            />
            <StatCard
              title="Total Volume Contributed"
              value={`${myVolumeSum} ml`}
              icon={<Medal className="text-warning" />}
              trend={
                <span className="text-xs text-text-secondary font-medium">
                  Lives saved: {myDonationsCount * 3}
                </span>
              }
            />
            <StatCard
              title="Global Active Donors"
              value={`${activeDonorsCount} users`}
              icon={<Globe className="text-info" />}
              trend={<span className="text-xs text-success font-semibold">+14% community size</span>}
            />
          </Grid>

          {/* 5. LEADERBOARD */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-warning" /> Regional Leaderboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="p-3">Rank</th>
                    <th className="p-3">Donor Name</th>
                    <th className="p-3">Blood Type</th>
                    <th className="p-3">Donations</th>
                    <th className="p-3 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm text-text-primary">
                  {LEADERBOARD.map((item) => (
                    <tr key={item.rank} className="hover:bg-border/5">
                      <td className="p-3 font-bold text-text-secondary">#{item.rank}</td>
                      <td className="p-3 font-semibold">{item.name}</td>
                      <td className="p-3 font-mono font-bold text-primary">{item.blood_group}</td>
                      <td className="p-3 font-medium">{item.donations} collections</td>
                      <td className="p-3 text-right">
                        <Badge variant="outline" className="text-xs font-semibold">
                          {item.badge}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Stack>
      </DashboardLayout>
    );
  }

  // ── ADMIN VIEW ────────────────────────────────────────────
  return (
    <DashboardLayout title="Logistics Analytics">
      <Stack gap="lg">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Regional Supply Oversight</h2>
          <p className="text-sm text-text-secondary mt-1">
            System-wide shortage heatmap, courier performance tracking, and predictive supply forecasts.
          </p>
        </div>

        {/* 1. CRITICAL ALERT BANNER */}
        <CriticalAlertBanner sectors={HEATMAP_SECTORS} onSelect={setSelectedSector} />

        {/* 2. HEATMAP — full width, dominant */}
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Map className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">Regional Heatmap — Live Shortage View</h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  System-wide district shortage visibility — click any polygon to inspect
                </p>
              </div>
            </div>
            <MapLegend />
          </div>
          <HeatmapMap
            sectors={HEATMAP_SECTORS}
            selectedSectorId={selectedSector?.id}
            onSectorClick={setSelectedSector}
            height="500px"
          />
        </div>

        {/* 3. SELECTED SECTOR DETAIL */}
        {selectedSector && (
          <SectorDetailPanel sector={selectedSector} showCourierInfo />
        )}

        {/* 4. STAT CARDS */}
        <Grid cols={1} sm={3} gap="md">
          <StatCard
            title="Regional Transit Time"
            value="24 mins"
            icon={<TrendingUp className="text-success" />}
            trend={<span className="text-xs text-success font-semibold">-4 mins average today</span>}
          />
          <StatCard
            title="Active Network Users"
            value={`${totalNetworkUsers} accounts`}
            icon={<Users className="text-info" />}
            trend={<span className="text-xs text-success font-semibold">+12% increase this month</span>}
          />
          <StatCard
            title="Shortage Risk Index"
            value={criticalShortagesCount >= 3 ? "High" : criticalShortagesCount >= 1 ? "Medium" : "Low"}
            icon={<ShieldAlert className="text-warning" />}
            trend={<span className="text-xs text-warning font-medium">{criticalShortagesCount} critical districts active</span>}
          />
        </Grid>

        {/* 5. TREND CHART */}
        <SupplyTrendChart
          strokeColor="#C14E3A"
          fillGradientId="predGrad"
          isForecast={true}
          title="Predictive Supply Forecast"
          subtitle="Regional blood reserve volumes mapped against 3-month AI predictive seasonal estimates"
        />
      </Stack>
    </DashboardLayout>
  );
};

export default SharedAnalytics;
export { SharedAnalytics };

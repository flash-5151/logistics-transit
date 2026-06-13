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
import {
  HeatmapMap,
  type HeatmapSector,
} from "@/components/ui/molecules/heatmap-map/HeatmapMap";

// ─────────────────────────────────────────────────────────
// District sector data — Chennai city district polygons
// ─────────────────────────────────────────────────────────
const HEATMAP_SECTORS: HeatmapSector[] = [
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
  const [selectedSector, setSelectedSector] = useState<HeatmapSector | null>(
    HEATMAP_SECTORS[2] // Default: Eastgate Critical
  );
  const [localHistoryCount, setLocalHistoryCount] = useState(4);
  const [localVolumeSum, setLocalVolumeSum] = useState(1850);

  useEffect(() => {
    const saved = localStorage.getItem("mock_donations");
    if (saved) {
      const all = JSON.parse(saved);
      setLocalHistoryCount(all.length + 4);
      setLocalVolumeSum(
        all.reduce((s: number, d: { volume: number }) => s + d.volume, 0) + 1850
      );
    }
  }, []);

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
              value="3 units"
              icon={<TrendingUp className="text-success" />}
              trend={<span className="text-xs text-success font-semibold">Average transit: 24 mins</span>}
            />
            <StatCard
              title="Nearby Suppliers"
              value="5 Banks"
              icon={<Building className="text-info" />}
              trend={<span className="text-xs text-text-secondary font-medium">Within 5 miles</span>}
            />
            <StatCard
              title="Critical Depletions"
              value="O−, AB−"
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
              value="142 units"
              icon={<HeartHandshake className="text-primary" />}
              trend={<span className="text-xs text-success font-semibold">+8% increase this week</span>}
            />
            <StatCard
              title="Total Stock Volume"
              value="54,200 ml"
              icon={<Building className="text-success" />}
              trend={<span className="text-xs text-text-secondary font-medium">Capacity: 75%</span>}
            />
            <StatCard
              title="Upcoming Expiries"
              value="3 Bags"
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
              value={`${localHistoryCount} times`}
              icon={<Heart className="text-primary" />}
              trend={<span className="text-xs text-success font-semibold">Unlocked Silver Tier</span>}
            />
            <StatCard
              title="Total Volume Contributed"
              value={`${localVolumeSum} ml`}
              icon={<Medal className="text-warning" />}
              trend={
                <span className="text-xs text-text-secondary font-medium">
                  Lives saved: {localHistoryCount * 3}
                </span>
              }
            />
            <StatCard
              title="Global Active Donors"
              value="1,842 users"
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
            value="1,402 accounts"
            icon={<Users className="text-info" />}
            trend={<span className="text-xs text-success font-semibold">+12% increase this month</span>}
          />
          <StatCard
            title="Shortage Risk Index"
            value="Medium"
            icon={<ShieldAlert className="text-warning" />}
            trend={<span className="text-xs text-warning font-medium">2 critical districts active</span>}
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

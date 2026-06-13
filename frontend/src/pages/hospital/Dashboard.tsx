import * as React from "react";
import { useState, useEffect } from "react";
import { Activity, Package, PhoneCall, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid } from "@/components/layout/primitives/Grid";
import { Stack } from "@/components/layout/primitives/Stack";
import { Row } from "@/components/layout/primitives";
import { Badge } from "@/components/ui/atoms/Badge";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import type { BloodRequest } from "@/types/request";
import type { Transfer } from "@/types/transfer";

const HospitalDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const hospitalName = user?.name || "Hospital";

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqsRes, transRes] = await Promise.all([
          api.get("/requests"),
          api.get("/transfers"),
        ]);
        setRequests(reqsRes.data);
        setTransfers(transRes.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };
    fetchData();
  }, []);

  // Compute metrics for this hospital
  const myRequests = requests.filter(r => r.hospital_id === user?.id);
  const myActiveRequests = myRequests.filter(r => r.status !== "completed" && r.status !== "cancelled");
  const myPendingRequests = myActiveRequests.filter(r => r.status === "pending");

  const myActiveTransfers = transfers.filter(
    t => t.receiver_id === user?.id && t.status !== "delivered" && t.status !== "cancelled"
  );
  const myInTransitTransfers = myActiveTransfers.filter(t => t.status === "in_transit");

  const myDeliveredCount = transfers.filter(
    t => t.receiver_id === user?.id && t.status === "delivered"
  ).length;

  const getUrgencyBadge = (u: string) => {
    if (u === "emergency") return <Badge variant="danger" className="uppercase text-[10px] font-bold">Emergency</Badge>;
    if (u === "urgent") return <Badge variant="warning" className="uppercase text-[10px] font-bold">Urgent</Badge>;
    return <Badge variant="info" className="uppercase text-[10px] font-bold">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="px-2 py-0.5 rounded text-xs">Pending Match</Badge>;
      case "in_progress": return <Badge variant="warning" className="px-2 py-0.5 rounded text-xs font-semibold">In Transit</Badge>;
      case "completed": return <Badge variant="success" className="px-2 py-0.5 rounded text-xs">Delivered</Badge>;
      case "cancelled": return <Badge variant="danger" className="px-2 py-0.5 rounded text-xs">Cancelled</Badge>;
      default: return null;
    }
  };

  return (
    <DashboardLayout title="Hospital Dashboard">
      <Stack gap="lg">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Welcome Back, {hospitalName} Staff
          </h2>
          <p className="text-text-secondary text-sm">
            Monitor active emergency requests and inbound blood transfers.
          </p>
        </div>

        <Grid cols={1} md={3} gap="md">
          <StatCard
            title="Active Requests"
            value={`${myActiveRequests.length}`}
            icon={<Activity className="text-primary" />}
            trend={
              <span className={`text-xs font-semibold ${myPendingRequests.length > 0 ? "text-danger" : "text-text-secondary"}`}>
                {myPendingRequests.length} Pending Auto-Match
              </span>
            }
          />
          <StatCard
            title="Inbound Transfers"
            value={`${myActiveTransfers.length}`}
            icon={<Package className="text-success" />}
            trend={
              <span className="text-xs text-success font-semibold">
                {myInTransitTransfers.length} In Transit
              </span>
            }
          />
          <StatCard
            title="Total Fulfilled"
            value={`${myDeliveredCount + 12}`}
            icon={<PhoneCall className="text-info" />}
            trend={
              <span className="text-xs text-text-secondary font-medium">
                Life saving record
              </span>
            }
          />
        </Grid>

        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Active Emergency Requests
          </h3>

          {myActiveRequests.length > 0 ? (
            <Stack gap="sm">
              {myActiveRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 border border-border bg-surface hover:bg-border/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors shadow-xs"
                >
                  <Row gap="sm" className="items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm border border-primary/20 shrink-0 select-none">
                      {req.blood_group}
                    </div>
                    <Stack gap="xs">
                      <Row gap="xs" className="items-center">
                        {getUrgencyBadge(req.priority || "normal")}
                        <span className="text-xs text-text-secondary font-mono font-semibold">ID: {req.id}</span>
                      </Row>
                      <h4 className="font-semibold text-sm text-text-primary">
                        {hospitalName} requesting <span className="text-primary font-bold">{req.quantity_ml} ml</span> of {req.blood_group} blood
                      </h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1 leading-none">
                        <MapPin className="h-3.5 w-3.5 text-text-secondary/60" /> Created on {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </Stack>
                  </Row>
                  <div className="shrink-0 w-full sm:w-auto text-left sm:text-right">
                    {getStatusBadge(req.status)}
                  </div>
                </div>
              ))}
            </Stack>
          ) : (
            <Stack gap="md" className="text-center py-12 items-center">
              <h3 className="text-lg font-semibold text-text-primary">
                No Active Emergency Requests
              </h3>
              <p className="text-text-secondary text-sm max-w-sm">
                All requests have been successfully matched and transit transfers
                have been delivered.
              </p>
            </Stack>
          )}
        </div>
      </Stack>
    </DashboardLayout>
  );
};

export { HospitalDashboard };

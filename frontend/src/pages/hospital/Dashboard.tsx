import * as React from "react";
import { Activity, Package, PhoneCall } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid } from "@/components/layout/primitives/Grid";
import { Stack } from "@/components/layout/primitives/Stack";

const HospitalDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Hospital Dashboard">
      <Stack gap="lg">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Welcome Back, Hospital Staff
          </h2>
          <p className="text-text-secondary text-sm">
            Monitor active emergency requests and inbound blood transfers.
          </p>
        </div>

        <Grid cols={1} md={3} gap="md">
          <StatCard
            title="Active Requests"
            value="14"
            icon={<Activity className="text-primary" />}
            trend={
              <span className="text-xs text-danger font-semibold">
                3 Pending Auto-Match
              </span>
            }
          />
          <StatCard
            title="Inbound Transfers"
            value="6"
            icon={<Package className="text-success" />}
            trend={
              <span className="text-xs text-success font-semibold">
                2 In Transit
              </span>
            }
          />
          <StatCard
            title="Total Fulfilled"
            value="128"
            icon={<PhoneCall className="text-info" />}
            trend={
              <span className="text-xs text-text-secondary font-medium">
                This Month
              </span>
            }
          />
        </Grid>

        <div className="bg-surface p-8 rounded-lg border border-border">
          <Stack gap="md" className="text-center py-12 items-center">
            <h3 className="text-lg font-semibold text-text-primary">
              No Active Emergency Requests
            </h3>
            <p className="text-text-secondary text-sm max-w-sm">
              All requests have been successfully matched and transit transfers
              have been delivered.
            </p>
          </Stack>
        </div>
      </Stack>
    </DashboardLayout>
  );
};

export { HospitalDashboard };

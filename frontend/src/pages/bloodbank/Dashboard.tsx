import * as React from "react";
import { useState, useEffect } from "react";
import { Package, HeartHandshake, AlertTriangle, CheckCircle, Navigation, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { StatCard } from "@/components/ui/molecules/stat-card";
import { Grid } from "@/components/layout/primitives/Grid";
import { Stack } from "@/components/layout/primitives/Stack";
import { Row } from "@/components/layout/primitives";
import { Button } from "@/components/ui/atoms/Button";
import { Badge } from "@/components/ui/atoms/Badge";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";
import type { BloodRequest } from "@/types/request";
import type { BloodInventory } from "@/types/inventory";

const BloodBankDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const bloodBankName = user?.name || "Blood Bank";

  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [inventory, setInventory] = useState<BloodInventory[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [donationsCount, setDonationsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqsRes, invRes, donsRes, usersRes] = await Promise.all([
          api.get("/requests"),
          api.get("/inventory"),
          api.get("/donations"),
          api.get("/donors/all-users"),
        ]);
        setRequests(reqsRes.data);
        setInventory(invRes.data);
        setDonationsCount(donsRes.data.filter((d: any) => d.blood_bank_id === user?.id).length);
        setOrganizations(usersRes.data);
      } catch (err) {
        console.error("Error loading bloodbank dashboard data:", err);
      }
    };
    fetchData();
  }, [user]);

  // Only display inventory logs that belong to this blood bank
  const myInventory = inventory.filter(i => i.blood_bank_id === user?.id);
  const totalStockVolume = myInventory.reduce((sum, item) => sum + item.quantity_ml, 0);

  // Compute critical shortages (any types below 500ml or missing completely)
  const allTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const criticalShortages: string[] = [];
  allTypes.forEach(type => {
    const vol = myInventory.filter(i => i.blood_group === type).reduce((sum, item) => sum + item.quantity_ml, 0);
    if (vol < 500) {
      criticalShortages.push(type);
    }
  });

  const pendingRequests = requests.filter(r => r.status === "pending");

  const getHospitalName = (hospitalId: string) => {
    const org = organizations.find(o => o.id === hospitalId);
    return org ? (org.full_name || org.name) : "Hospital";
  };

  const handleFulfillRequest = async (req: BloodRequest) => {
    const matchedBag = myInventory.find(item => item.blood_group === req.blood_group && item.quantity_ml >= req.quantity_ml);

    if (!matchedBag) {
      setErrorMsg(`Cannot fulfill request: Insufficient stock of type ${req.blood_group} in inventory (${req.quantity_ml}ml required).`);
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    try {
      const transferPayload = {
        sender_id: user?.id,
        receiver_id: req.hospital_id,
        request_id: req.id,
        status: "in_transit",
        tracking_number: `TRK-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      
      // Create transfer
      await api.post("/transfers/", transferPayload);

      // Update request status to in_progress
      await api.patch(`/requests/${req.id}`, { status: "in_progress" });

      // Deduct or remove bag
      if (matchedBag.quantity_ml === req.quantity_ml) {
        await api.delete(`/inventory/${matchedBag.id}`);
      } else {
        await api.put(`/inventory/${matchedBag.id}`, {
          quantity_ml: matchedBag.quantity_ml - req.quantity_ml
        });
      }

      // Re-fetch data
      const [reqsRes, invRes, donsRes] = await Promise.all([
        api.get("/requests"),
        api.get("/inventory"),
        api.get("/donations"),
      ]);
      setRequests(reqsRes.data);
      setInventory(invRes.data);
      setDonationsCount(donsRes.data.filter((d: any) => d.blood_bank_id === user?.id).length);

      setSuccessMsg(`Fulfillment approved! Dispatched courier.`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      console.error("Fulfillment failed:", err);
      setErrorMsg("Failed to fulfill request. Please check connections.");
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "emergency":
        return <Badge variant="danger" className="uppercase text-xs font-bold px-2 py-0.5">Emergency</Badge>;
      case "urgent":
        return <Badge variant="warning" className="uppercase text-xs font-bold px-2 py-0.5">Urgent</Badge>;
      default:
        return <Badge variant="info" className="uppercase text-xs font-bold px-2 py-0.5">Normal</Badge>;
    }
  };

  return (
    <DashboardLayout title="Blood Bank Dashboard">
      <Stack gap="lg">
        {/* Banner Messages */}
        {successMsg && (
          <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success animate-fade-in">
            <Row gap="sm" className="items-center">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{successMsg}</span>
            </Row>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-danger/10 border border-danger/20 rounded-lg text-danger animate-fade-in">
            <Row gap="sm" className="items-center">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span className="text-sm font-semibold">{errorMsg}</span>
            </Row>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Welcome Back, {bloodBankName} Staff
          </h2>
          <p className="text-text-secondary text-sm">
            Manage your stock levels, log donations, and monitor incoming requests.
          </p>
        </div>

        <Grid cols={1} md={3} gap="md">
          <StatCard
            title="Total Stock (ml)"
            value={`${totalStockVolume.toLocaleString()} ml`}
            icon={<Package className="text-primary" />}
            trend={
              <span className="text-xs text-text-secondary font-medium">
                {myInventory.length} bags in cold vault
              </span>
            }
          />
          <StatCard
            title="Donations Logged"
            value={`${donationsCount}`}
            icon={<HeartHandshake className="text-success" />}
            trend={
              <span className="text-xs text-success font-semibold">
                Active collection center
              </span>
            }
          />
          <StatCard
            title="Critical Shortages"
            value={criticalShortages.slice(0, 3).join(", ") || "None"}
            icon={<AlertTriangle className="text-warning" />}
            trend={
              <span className="text-xs text-danger font-semibold">
                Below safety margin
              </span>
            }
          />
        </Grid>

        <Grid cols={1} lg={5} gap="lg" className="items-start">
          {/* Incoming Hospital Broadcasts */}
          <div className="lg:col-span-3 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" /> Incoming Emergency Broadcasts
            </h3>
            <p className="text-xs text-text-secondary mb-4">Hospital emergency requests broadcasted nearby matching compatibility matrices.</p>
            
            {pendingRequests.length > 0 ? (
              <Stack gap="sm">
                {pendingRequests.map((req) => {
                  const hasStock = myInventory.some(i => i.blood_group === req.blood_group && i.quantity_ml >= req.quantity_ml);
                  const isEmergency = req.priority === "emergency";
                  const isUrgent = req.priority === "urgent";
                  
                  return (
                    <div 
                      key={req.id} 
                      className={`p-4 border bg-surface rounded-xl shadow-xs hover:shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all border-l-4 ${
                        isEmergency 
                          ? "border-l-danger border-danger/10" 
                          : isUrgent 
                          ? "border-l-warning border-warning/10" 
                          : "border-l-info border-info/10"
                      }`}
                    >
                      <Row gap="sm" className="items-center flex-1">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-base shrink-0 select-none ${
                          isEmergency 
                            ? "bg-danger/10 text-danger border border-danger/25" 
                            : isUrgent 
                            ? "bg-warning/10 text-warning border border-warning/25" 
                            : "bg-info/10 text-info border border-info/25"
                        }`}>
                          {req.blood_group}
                        </div>
                        <Stack gap="xs" className="flex-1">
                          <Row gap="xs" className="items-center">
                            {getUrgencyBadge(req.priority || "normal")}
                            <span className="text-xs text-text-secondary font-mono font-semibold">ID: {req.id}</span>
                          </Row>
                          <h4 className="font-bold text-sm text-text-primary">
                            {getHospitalName(req.hospital_id)} requesting <span className="text-primary font-bold">{req.quantity_ml} ml</span> of {req.blood_group} blood
                          </h4>
                          <p className="text-xs text-text-secondary flex items-center gap-1 leading-none">
                            <MapPin className="h-3.5 w-3.5 text-text-secondary/80" /> Broadcasted {new Date(req.created_at).toLocaleDateString()}
                          </p>
                        </Stack>
                      </Row>

                      <Button
                        onClick={() => handleFulfillRequest(req)}
                        size="sm"
                        variant={hasStock ? "primary" : "secondary"}
                        className={`text-xs font-bold py-2 px-3 rounded-lg shrink-0 w-full sm:w-auto transition-colors ${
                          hasStock ? "bg-success hover:bg-success-dark text-white border-success" : "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        {hasStock ? "Fulfill Request" : "Out of Stock"}
                      </Button>
                    </div>
                  );
                })}
              </Stack>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
                <p className="text-text-secondary text-sm">No pending hospital requests nearby.</p>
              </div>
            )}
          </div>

          {/* Quick Vault Inventory view */}
          <div className="lg:col-span-2 bg-surface p-6 rounded-lg border border-border shadow-sm">
            <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-success" /> Cold Vault Stock
            </h3>
            
            {myInventory.length > 0 ? (
              <Stack gap="sm" className="max-h-[350px] overflow-y-auto pr-1">
                {myInventory.map((item) => {
                  const expDate = new Date(item.expiry_date);
                  const today = new Date();
                  const diffTime = expDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isNearExpiry = diffDays <= 7;
                  
                  return (
                    <div key={item.id} className="p-3.5 border border-border bg-surface hover:bg-border/5 rounded-xl flex items-center justify-between transition-colors shadow-xs">
                      <Row gap="sm" className="items-center">
                        <div className="h-9 w-9 rounded-full bg-primary/5 text-primary flex items-center justify-center font-bold text-sm border border-primary/10 shrink-0">
                          {item.blood_group}
                        </div>
                        <Stack gap="xs">
                          <Row gap="xs" className="items-center leading-none">
                            <span className="font-bold text-xs text-text-primary">{item.location || "Vault-A"}</span>
                            <span className="text-xs text-text-secondary font-mono font-semibold">({item.id.substring(0, 8)})</span>
                          </Row>
                          <p className={`text-xs font-bold leading-none ${isNearExpiry ? "text-danger" : "text-success"}`}>
                            {isNearExpiry ? `Expiring in ${diffDays} days!` : `Expires: ${new Date(item.expiry_date).toLocaleDateString()}`}
                          </p>
                        </Stack>
                      </Row>
                      <span className="font-extrabold text-xs text-text-primary shrink-0">{item.quantity_ml} ml</span>
                    </div>
                  );
                })}
              </Stack>
            ) : (
              <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface/50">
                <p className="text-text-secondary text-sm">No inventory bags currently in vault.</p>
              </div>
            )}
          </div>
        </Grid>
      </Stack>
    </DashboardLayout>
  );
};

export { BloodBankDashboard };

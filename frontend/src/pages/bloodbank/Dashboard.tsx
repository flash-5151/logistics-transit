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

interface RequestItem {
  id: string;
  blood_group: string;
  volume: number;
  urgency: "normal" | "urgent" | "emergency";
  status: "pending" | "matched" | "in_transit" | "delivered";
  created_at: string;
}

interface InventoryItem {
  id: string;
  blood_group: string;
  volume: number;
  expiry_date: string;
  location: string;
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

const INITIAL_REQUESTS: RequestItem[] = [
  { id: "REQ-001", blood_group: "O-", volume: 450, urgency: "emergency", status: "pending", created_at: "2026-06-13 14:10" },
  { id: "REQ-002", blood_group: "A+", volume: 900, urgency: "urgent", status: "in_transit", created_at: "2026-06-13 12:30" },
  { id: "REQ-003", blood_group: "B-", volume: 600, urgency: "normal", status: "delivered", created_at: "2026-06-12 18:22" },
  { id: "REQ-004", blood_group: "AB-", volume: 450, urgency: "emergency", status: "matched", created_at: "2026-06-13 09:15" },
];

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: "BAG-801", blood_group: "O-", volume: 450, expiry_date: "2026-06-18", location: "Fridge-A4" },
  { id: "BAG-802", blood_group: "A+", volume: 900, expiry_date: "2026-07-10", location: "Fridge-B1" },
  { id: "BAG-803", blood_group: "O+", volume: 1350, expiry_date: "2026-07-22", location: "Fridge-A1" },
  { id: "BAG-804", blood_group: "AB-", volume: 450, expiry_date: "2026-06-15", location: "Fridge-C2" },
  { id: "BAG-805", blood_group: "B+", volume: 1800, expiry_date: "2026-08-01", location: "Fridge-B3" },
];

const BloodBankDashboard: React.FC = () => {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [donationsCount, setDonationsCount] = useState(24);

  useEffect(() => {
    // Load requests
    const savedReq = localStorage.getItem("mock_requests");
    if (savedReq) {
      setRequests(JSON.parse(savedReq));
    } else {
      setRequests(INITIAL_REQUESTS);
      localStorage.setItem("mock_requests", JSON.stringify(INITIAL_REQUESTS));
    }

    // Load inventory
    const savedInv = localStorage.getItem("mock_inventory");
    if (savedInv) {
      setInventory(JSON.parse(savedInv));
    } else {
      setInventory(DEFAULT_INVENTORY);
      localStorage.setItem("mock_inventory", JSON.stringify(DEFAULT_INVENTORY));
    }

    // Load donations count
    const savedDonations = localStorage.getItem("mock_donations");
    if (savedDonations) {
      const dons = JSON.parse(savedDonations);
      setDonationsCount(dons.length + 24);
    }
  }, []);

  const totalStockVolume = inventory.reduce((sum, item) => sum + item.volume, 0);

  // Compute critical shortages (any types below 500ml or missing completely)
  const allTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const criticalShortages: string[] = [];
  allTypes.forEach(type => {
    const vol = inventory.filter(i => i.blood_group === type).reduce((sum, item) => sum + item.volume, 0);
    if (vol < 500) {
      criticalShortages.push(type);
    }
  });

  const pendingRequests = requests.filter(r => r.status === "pending");

  const handleFulfillRequest = (req: RequestItem) => {
    // Find matching bag in inventory
    const matchingBagIndex = inventory.findIndex(item => item.blood_group === req.blood_group && item.volume >= req.volume);

    if (matchingBagIndex === -1) {
      setErrorMsg(`Cannot fulfill request: Insufficient stock of type ${req.blood_group} in inventory (${req.volume}ml required).`);
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    const matchedBag = inventory[matchingBagIndex];

    // Deduct volume or delete the bag
    let updatedInv = [...inventory];
    if (matchedBag.volume === req.volume) {
      // remove the bag
      updatedInv.splice(matchingBagIndex, 1);
    } else {
      // deduct
      updatedInv[matchingBagIndex] = {
        ...matchedBag,
        volume: matchedBag.volume - req.volume
      };
    }

    // Save inventory
    setInventory(updatedInv);
    localStorage.setItem("mock_inventory", JSON.stringify(updatedInv));

    // Update request status to in_transit
    const updatedReqs = requests.map(r => r.id === req.id ? { ...r, status: "in_transit" as const } : r);
    setRequests(updatedReqs);
    localStorage.setItem("mock_requests", JSON.stringify(updatedReqs));

    // Add to mock transfers
    const savedTransfers = localStorage.getItem("mock_transfers");
    const transfers: TransferItem[] = savedTransfers ? JSON.parse(savedTransfers) : [
      { id: "TR-501", request_id: "REQ-002", source: "Red Cross Center", blood_group: "A+", volume: 900, status: "in_transit", eta: "15 mins" },
    ];

    const newTransfer: TransferItem = {
      id: `TR-${Math.floor(500 + Math.random() * 500)}`,
      request_id: req.id,
      source: "City Central Depot",
      blood_group: req.blood_group,
      volume: req.volume,
      status: "in_transit",
      eta: "20 mins"
    };
    
    localStorage.setItem("mock_transfers", JSON.stringify([newTransfer, ...transfers]));

    setSuccessMsg(`Fulfillment approved! Dispatched courier ${newTransfer.id} from Fridge location ${matchedBag.location}.`);
    setTimeout(() => setSuccessMsg(null), 5000);
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
            Welcome Back, Inventory Manager
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
                {inventory.length} bags in cold vault
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
                  const hasStock = inventory.some(i => i.blood_group === req.blood_group && i.volume >= req.volume);
                  const isEmergency = req.urgency === "emergency";
                  const isUrgent = req.urgency === "urgent";
                  
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
                            {getUrgencyBadge(req.urgency)}
                            <span className="text-xs text-text-secondary font-mono font-semibold">ID: {req.id}</span>
                          </Row>
                          <h4 className="font-bold text-sm text-text-primary">
                            Hospital Request for <span className="text-primary font-bold">{req.volume} ml</span>
                          </h4>
                          <p className="text-xs text-text-secondary flex items-center gap-1 leading-none">
                            <MapPin className="h-3.5 w-3.5 text-text-secondary/80" /> Broadcasted {req.created_at}
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
            
            <Stack gap="sm" className="max-h-[350px] overflow-y-auto pr-1">
              {inventory.map((item) => {
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
                          <span className="font-bold text-xs text-text-primary">{item.location}</span>
                          <span className="text-xs text-text-secondary font-mono font-semibold">({item.id})</span>
                        </Row>
                        <p className={`text-xs font-bold leading-none ${isNearExpiry ? "text-danger" : "text-success"}`}>
                          {isNearExpiry ? `Expiring in ${diffDays} days!` : `Expires: ${item.expiry_date}`}
                        </p>
                      </Stack>
                    </Row>
                    <span className="font-extrabold text-xs text-text-primary shrink-0">{item.volume} ml</span>
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

export { BloodBankDashboard };

import * as React from "react";
import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Button } from "@/components/ui/atoms/Button";
import { Badge } from "@/components/ui/atoms/Badge";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split, Grid } from "@/components/layout/primitives";
import { useAuthStore } from "@/store/authStore";
import { api } from "@/services/api";

interface TransferItem {
  id: string;
  request_id: string;
  source: string;
  blood_group: string;
  volume: number;
  status: "pending" | "in_transit" | "delivered";
  eta: string;
}

const HospitalTransfers: React.FC = () => {
  const { user } = useAuthStore();
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchTransfers = async () => {
    try {
      const [transRes, usersRes, reqsRes] = await Promise.all([
        api.get("/transfers"),
        api.get("/donors/all-users"),
        api.get("/requests")
      ]);

      const filtered = transRes.data
        .filter((t: any) => t.receiver_id === user?.id)
        .map((t: any) => {
          const req = reqsRes.data.find((r: any) => r.id === t.request_id);
          const sourceUser = usersRes.data.find((u: any) => u.id === t.sender_id);
          return {
            id: t.id,
            request_id: t.request_id || "N/A",
            source: sourceUser ? (sourceUser.full_name || sourceUser.name) : "Red Cross Center",
            blood_group: req ? req.blood_group : "O-",
            volume: req ? req.quantity_ml : 450,
            status: t.status === "requested" ? "pending" : t.status,
            eta: t.status === "requested" ? "45 mins" : t.status === "in_transit" ? "15 mins" : "--",
          };
        });
      setTransfers(filtered);
    } catch (err) {
      console.error("Error fetching transfers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTransfers();
    }
  }, [user]);

  const advanceStatus = async (id: string) => {
    const t = transfers.find((item) => item.id === id);
    if (!t) return;

    try {
      const nextStatus = t.status === "pending" ? "in_transit" : "delivered";
      await api.patch(`/transfers/${id}`, { status: nextStatus });
      
      if (nextStatus === "delivered" && t.request_id !== "N/A") {
        await api.patch(`/requests/${t.request_id}`, { status: "completed" });
      }
      
      fetchTransfers();
    } catch (err) {
      console.error("Error advancing status:", err);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "in_transit":
        return <Truck className="h-5 w-5 text-sky-500" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Dispatching</Badge>;
      case "in_transit":
        return <Badge variant="warning">In Transit</Badge>;
      case "delivered":
        return <Badge variant="success">Delivered</Badge>;
      default:
        return null;
    }
  };

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.request_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.blood_group.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.source.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout title="Inbound Transfers">
      <Stack gap="lg">
        {/* Header Summary */}
        <div>
          <h2 className="text-xl font-bold text-text-primary">Courier & Transit Logs</h2>
          <p className="text-sm text-text-secondary mt-1">
            Monitor real-time status and estimated arrival times for inbound emergency blood supplies.
          </p>
        </div>

        {/* Transfers Grid */}
        <div className="mt-2">
          {loading ? (
            <p className="text-sm text-text-secondary">Loading transfers...</p>
          ) : filteredTransfers.filter(t => t.status !== "delivered").length > 0 ? (
            <Grid cols={1} md={2} gap="md">
              {filteredTransfers.filter(t => t.status !== "delivered").map((t) => (
                <div key={t.id} className="p-6 bg-surface rounded-lg border border-border shadow-sm flex flex-col justify-between">
                  <Stack gap="md">
                    <Split
                      slots={{
                        left: (
                          <Row gap="sm" className="items-center">
                            <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-text-primary text-sm">{t.id.substring(0, 8)}</p>
                              <p className="text-xs text-text-secondary">Req Ref: <span className="font-mono font-medium">{t.request_id.substring(0, 8)}</span></p>
                            </div>
                          </Row>
                        ),
                        right: getStatusBadge(t.status),
                      }}
                    />

                    {/* Progress Visual Tracker */}
                    <div className="relative mt-4">
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2" />
                      <div 
                        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 transition-all duration-300"
                        style={{ width: t.status === "pending" ? "15%" : t.status === "in_transit" ? "55%" : "100%" }}
                      />
                      <div className="relative flex justify-between">
                        <div className="flex flex-col items-center gap-1 bg-surface px-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                            t.status !== "pending" ? "bg-primary border-primary text-white" : "border-border text-text-secondary"
                          }`}>1</div>
                          <span className="text-[10px] font-medium text-text-secondary">Dispatched</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-surface px-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                            t.status === "in_transit" || t.status === "delivered" ? "bg-primary border-primary text-white" : "border-border text-text-secondary"
                          }`}>2</div>
                          <span className="text-[10px] font-medium text-text-secondary">In Transit</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 bg-surface px-2">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                            t.status === "delivered" ? "bg-primary border-primary text-white" : "border-border text-text-secondary"
                          }`}>3</div>
                          <span className="text-[10px] font-medium text-text-secondary">Delivered</span>
                        </div>
                      </div>
                    </div>

                    <Grid cols={2} gap="sm" className="mt-4 border-t border-border pt-4 text-xs">
                      <div>
                        <span className="text-text-secondary block">Supplier</span>
                        <span className="font-semibold text-text-primary text-sm flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-primary" /> {t.source}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-secondary block">Contents</span>
                        <span className="font-semibold text-text-primary text-sm mt-0.5">
                          Type {t.blood_group} ({t.volume}ml)
                        </span>
                      </div>
                    </Grid>
                  </Stack>

                  <Row gap="sm" className="justify-between items-center border-t border-border pt-4 mt-6">
                    <Row gap="xs" className="text-text-secondary text-xs items-center">
                      <Clock className="h-4 w-4 text-text-secondary" />
                      <span>ETA: <strong className="text-text-primary font-semibold">{t.eta}</strong></span>
                    </Row>
                    <Button 
                      size="sm" 
                      onClick={() => advanceStatus(t.id)}
                      className="text-xs py-1.5 px-3 cursor-pointer"
                    >
                      {t.status === "pending" ? "Ship Transit" : "Mark Received"}
                    </Button>
                  </Row>
                </div>
              ))}
            </Grid>
          ) : (
            <div className="text-center py-12 border border-dashed border-border rounded-lg bg-surface/50 text-text-secondary text-xs italic">
              No active inbound transfers.
            </div>
          )}
        </div>

        {/* Complete Table History */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden mt-4">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search historical logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text-primary"
                  >
                    <option value="all">All States</option>
                    <option value="pending">Pending</option>
                    <option value="in_transit">In Transit</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
              ),
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                  <th className="p-4">Transfer ID</th>
                  <th className="p-4">Request Ref</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Contents</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">ETA/Arrival</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {filteredTransfers.map((t) => (
                  <tr key={t.id} className="hover:bg-border/5 transition-colors">
                    <td className="p-4 font-mono font-semibold">{t.id.substring(0, 8)}</td>
                    <td className="p-4 font-mono text-text-secondary">{t.request_id.substring(0, 8)}</td>
                    <td className="p-4">{t.source}</td>
                    <td className="p-4 font-medium">{t.blood_group} ({t.volume}ml)</td>
                    <td className="p-4">
                      <Row gap="xs" className="items-center">
                        {getStatusIcon(t.status)}
                        <span className="capitalize">{t.status.replace("_", " ")}</span>
                      </Row>
                    </td>
                    <td className="p-4 font-semibold text-text-secondary">{t.eta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Stack>
    </DashboardLayout>
  );
};

export default HospitalTransfers;
export { HospitalTransfers };

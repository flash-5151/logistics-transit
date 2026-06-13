import * as React from "react";
import { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Badge } from "@/components/ui/atoms/Badge";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Split, Grid } from "@/components/layout/primitives";
import { api } from "@/services/api";

interface GlobalInventoryItem {
  id: string;
  center_name: string;
  blood_group: string;
  volume: number;
  expiry_date: string;
  fridge: string;
}

const AdminInventory: React.FC = () => {
  const [globalStock, setGlobalStock] = useState<GlobalInventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchGlobalInventory = async () => {
    try {
      const [invRes, usersRes] = await Promise.all([
        api.get("/inventory"),
        api.get("/donors/all-users")
      ]);

      const formatted = invRes.data.map((item: any) => {
        const bb = usersRes.data.find((u: any) => u.id === item.blood_bank_id);
        return {
          id: item.id,
          center_name: bb ? (bb.full_name || bb.name) : "Red Cross Center",
          blood_group: item.blood_group,
          volume: item.quantity_ml,
          expiry_date: item.expiry_date.split("T")[0],
          fridge: item.location || "N/A",
        };
      });
      setGlobalStock(formatted);
    } catch (err) {
      console.error("Error fetching global inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalInventory();
  }, []);

  const totalVolume = globalStock.reduce((sum, item) => sum + item.volume, 0);

  // Group stock volume by blood group
  const stockByGroup = globalStock.reduce((acc, item) => {
    acc[item.blood_group] = (acc[item.blood_group] || 0) + item.volume;
    return acc;
  }, {} as Record<string, number>);

  const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
  const maxStockVal = Math.max(...bloodGroups.map(bg => stockByGroup[bg] || 0), 1000);

  const filteredInventory = globalStock.filter(item => {
    const matchesSearch = item.center_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.fridge.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = bloodGroupFilter === "all" || item.blood_group === bloodGroupFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <DashboardLayout title="Inventory Control">
      <Stack gap="lg">
        {/* Header Summary */}
        <Split
          slots={{
            left: (
              <div>
                <h2 className="text-xl font-bold text-text-primary">Regional Stock Registry</h2>
                <p className="text-sm text-text-secondary mt-1">
                  Audits and monitors real-time inventory units across all hospitals and blood bank depots in the system.
                </p>
              </div>
            ),
            right: (
              <Badge variant="default" className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary border border-primary/20">
                Total Region Volume: {loading ? "..." : `${totalVolume} ml`}
              </Badge>
            ),
          }}
        />

        {/* Custom Visual Bar Charts */}
        <div className="bg-surface p-6 rounded-lg border border-border shadow-sm">
          <h3 className="text-base font-bold text-text-primary mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> Stock Volume by Blood Group (ml)
          </h3>
          <Grid cols={2} md={4} gap="md">
            {bloodGroups.map(bg => {
              const val = stockByGroup[bg] || 0;
              const percent = (val / maxStockVal) * 100;
              return (
                <div key={bg} className="p-3 border border-border/80 rounded-xl bg-[#251C1A]/5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-primary">{bg}</span>
                    <span className="text-text-secondary font-mono">{val} ml</span>
                  </div>
                  <div className="w-full bg-border/40 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </Grid>
        </div>

        {/* Directory Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search by center name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Type:</span>
                  <select
                    value={bloodGroupFilter}
                    onChange={(e) => setBloodGroupFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary text-text-primary"
                  >
                    <option value="all">All Groups</option>
                    {bloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              ),
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                  <th className="p-4">Bag Reference</th>
                  <th className="p-4">Hold Depot</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Volume</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Internal Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs text-text-primary">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-text-secondary">Loading regional stock...</td>
                  </tr>
                ) : filteredInventory.length > 0 ? (
                  filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-border/5">
                      <td className="p-4 font-mono font-medium">{item.id.substring(0, 8)}</td>
                      <td className="p-4 font-semibold">{item.center_name}</td>
                      <td className="p-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                          {item.blood_group}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{item.volume} ml</td>
                      <td className="p-4 font-mono">{item.expiry_date}</td>
                      <td className="p-4 text-text-secondary">{item.fridge}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-text-secondary italic">
                      No matching blood inventory found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Stack>
    </DashboardLayout>
  );
};

export default AdminInventory;
export { AdminInventory };

import * as React from "react";
import { useState, useEffect } from "react";
import { Building, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/layout/templates/DashboardLayout";
import { Badge } from "@/components/ui/atoms/Badge";
import { TableToolbar } from "@/components/ui/molecules/table-toolbar/table-toolbar";
import { SearchInput } from "@/components/ui/molecules/search-input/search-input";
import { Stack, Row, Split, Grid } from "@/components/layout/primitives";

interface GlobalInventoryItem {
  id: string;
  center_name: string;
  blood_group: string;
  volume: number;
  expiry_date: string;
  fridge: string;
}

const MOCK_GLOBAL_INVENTORY: GlobalInventoryItem[] = [
  { id: "BAG-801", center_name: "Red Cross Center", blood_group: "O-", volume: 450, expiry_date: "2026-06-18", fridge: "Fridge-A4" },
  { id: "BAG-802", center_name: "Red Cross Center", blood_group: "A+", volume: 900, expiry_date: "2026-07-10", fridge: "Fridge-B1" },
  { id: "BAG-803", center_name: "City General Blood Bank", blood_group: "O+", volume: 1350, expiry_date: "2026-07-22", fridge: "Fridge-A1" },
  { id: "BAG-804", center_name: "Saint Mary Depot", blood_group: "AB-", volume: 450, expiry_date: "2026-06-15", fridge: "Fridge-C2" },
  { id: "BAG-805", center_name: "Saint Mary Depot", blood_group: "B+", volume: 1800, expiry_date: "2026-08-01", fridge: "Fridge-B3" },
  { id: "BAG-806", center_name: "City General Blood Bank", blood_group: "O-", volume: 900, expiry_date: "2026-06-25", fridge: "Fridge-A2" },
];

const AdminInventory: React.FC = () => {
  const [globalStock, setGlobalStock] = useState<GlobalInventoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bloodGroupFilter, setBloodGroupFilter] = useState("all");

  useEffect(() => {
    const saved = localStorage.getItem("mock_inventory");
    if (saved) {
      // Merge centers for display in global view
      const localItems = JSON.parse(saved);
      const formatted = localItems.map((item: any) => ({
        ...item,
        center_name: item.center_name || "Red Cross Center",
        fridge: item.location || "Fridge-A1",
      }));
      setGlobalStock(formatted);
    } else {
      setGlobalStock(MOCK_GLOBAL_INVENTORY);
      localStorage.setItem("mock_inventory", JSON.stringify(MOCK_GLOBAL_INVENTORY));
    }
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
                Total Region Volume: {totalVolume} ml
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
                <Stack key={bg} gap="xs" className="p-3 border border-border rounded-lg bg-surface">
                  <Split
                    slots={{
                      left: <span className="font-bold text-sm text-text-primary">{bg}</span>,
                      right: <span className="text-xs font-semibold text-text-secondary">{val} ml</span>,
                    }}
                  />
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        val === 0 ? "bg-border" : bg.includes("-") ? "bg-primary" : "bg-sky-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </Stack>
              );
            })}
          </Grid>
        </div>

        {/* Global Inventory Table */}
        <div className="bg-surface rounded-lg border border-border overflow-hidden">
          <TableToolbar
            slots={{
              search: (
                <SearchInput
                  placeholder="Search by Facility Name, Unit ID, or Storage Unit..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm("")}
                />
              ),
              filters: (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary font-medium">Group:</span>
                  <select
                    value={bloodGroupFilter}
                    onChange={(e) => setBloodGroupFilter(e.target.value)}
                    className="h-10 rounded-md border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-text-primary"
                  >
                    <option value="all">All Groups</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              ),
            }}
          />

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-border/20 text-xs font-semibold text-text-secondary uppercase">
                  <th className="p-4">Unit Bag ID</th>
                  <th className="p-4">Depot Facility</th>
                  <th className="p-4">Blood Group</th>
                  <th className="p-4">Volume (ml)</th>
                  <th className="p-4">Expiry Date</th>
                  <th className="p-4">Storage Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text-primary">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-border/5 transition-colors">
                    <td className="p-4 font-mono font-semibold">{item.id}</td>
                    <td className="p-4 font-semibold text-text-primary">
                      <Row gap="xs" className="items-center">
                        <Building className="h-4 w-4 text-text-secondary shrink-0" />
                        <span>{item.center_name}</span>
                      </Row>
                    </td>
                    <td className="p-4 font-bold">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        {item.blood_group}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{item.volume} ml</td>
                    <td className="p-4 text-text-secondary">{item.expiry_date}</td>
                    <td className="p-4 text-text-secondary font-mono text-xs">{item.fridge}</td>
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

export default AdminInventory;
export { AdminInventory };

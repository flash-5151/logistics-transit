export interface Transfer {
  id: string;
  request_id: string;
  source_id: string;
  destination_id: string;
  status: "requested" | "in_transit" | "delivered" | "cancelled";
  dispatched_at?: string;
  delivered_at?: string;
}

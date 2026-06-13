export interface Transfer {
  id: string;
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: "requested" | "in_transit" | "delivered" | "cancelled";
  dispatched_at?: string;
  delivered_at?: string;
}

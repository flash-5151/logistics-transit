export interface BloodRequest {
  id: string;
  hospital_id: string;
  blood_group: string;
  quantity_ml: number;
  priority: "normal" | "urgent" | "emergency";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
}

export type RequestAction = "match" | "cancel" | "edit" | "view_transfers" | "view_details";

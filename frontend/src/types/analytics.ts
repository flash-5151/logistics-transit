export interface ShortagePrediction {
  region: string;
  predicted_shortage: number;
  confidence_score: number;
}

export interface DonorRanking {
  donor_id: string;
  rank: number;
  score: number;
}

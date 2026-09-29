export type WeightEntry = {
  id: number;
  date: string;   // 'YYYY-MM-DD'
  weight: number;
};

export type Period = {
  id: number;
  start_date: string;       // 'YYYY-MM-DD'
  end_date: string | null;
};

export type Phase = "menstrual" | "follicular" | "ovulation" | "luteal";

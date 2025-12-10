export interface ActivityDto {
  id: string;
  userId: string;
  title: string;
  category: string;
  durationMinutes: number;
  mood: number;
  note: string | null;
  date: string;
  isSample?: boolean;
  createdAt: string;
}




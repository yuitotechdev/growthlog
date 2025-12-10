export interface InsightDto {
  id: string;
  userId: string;
  summary: string;
  advice: string;
  oneLineSummary: string;
  actionItems: string[];
  period: {
    startDate: string;
    endDate: string;
  };
  category?: string;
  activityCount: number;
  createdAt: string;
}




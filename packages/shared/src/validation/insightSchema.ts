import { z } from 'zod';

export const createInsightRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
  category: z.string().optional(),
});

export type CreateInsightRequest = z.infer<typeof createInsightRequestSchema>;





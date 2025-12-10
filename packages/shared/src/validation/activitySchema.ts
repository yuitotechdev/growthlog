import { z } from 'zod';

export const createActivityRequestSchema = z.object({
  title: z.string().min(1, 'タイトルを入力してください').max(100, 'タイトルは100文字以内で入力してください'),
  category: z.string().min(1, 'カテゴリを選択してください'),
  durationMinutes: z.number().min(1, '活動時間は1分以上で入力してください').max(1440, '活動時間は1440分以内で入力してください'),
  mood: z.number().min(1).max(5),
  note: z.string().max(1000, 'メモは1000文字以内で入力してください').optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください'),
});

export const updateActivityRequestSchema = createActivityRequestSchema.partial();

export type CreateActivityRequest = z.infer<typeof createActivityRequestSchema>;
export type UpdateActivityRequest = z.infer<typeof updateActivityRequestSchema>;




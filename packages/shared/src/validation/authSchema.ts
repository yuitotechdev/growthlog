import { z } from 'zod';

export const loginRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

export const signUpRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
  uniqueId: z.string().min(3, 'ユーザーIDは3文字以上で入力してください').max(20, 'ユーザーIDは20文字以下で入力してください').regex(/^[a-zA-Z0-9_]+$/, 'ユーザーIDは英数字とアンダースコアのみ使用できます'),
  name: z.string().optional(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;



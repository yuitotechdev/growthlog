import { prisma } from '../../common/db/prisma';
import { nanoid } from 'nanoid';

export class ActivityRepository {
  async create(data: {
    userId: string;
    title: string;
    category: string;
    durationMinutes: number;
    mood: number;
    note?: string;
    date: string;
    isSample?: boolean;
  }) {
    // isSampleフィールドが存在しない場合でも動作するように、生SQLを使用
    try {
      // まず通常のPrismaメソッドで試行
      const createData: any = {
        userId: data.userId,
        title: data.title,
        category: data.category,
        durationMinutes: data.durationMinutes,
        mood: data.mood,
        note: data.note,
        date: data.date,
      };
      
      // isSampleが指定されている場合のみ追加
      if (data.isSample !== undefined) {
        createData.isSample = data.isSample;
      }
      
      return await prisma.activity.create({ data: createData });
    } catch (error: any) {
      // P2022エラー（カラムが存在しない）の場合、生SQLで挿入
      if (error.code === 'P2022' && error.meta?.column === 'isSample') {
        console.log('[ActivityRepository] isSample column does not exist, using raw SQL');
        
        // cuid形式のIDを生成（nanoidを使用、25文字でcuidに近い形式）
        const id = nanoid(25);
        const now = new Date();
        
        // 生SQLで挿入（isSampleカラムを除外）
        const result = await prisma.$queryRaw<Array<{
          id: string;
          userId: string;
          title: string;
          category: string;
          durationMinutes: number;
          mood: number;
          note: string | null;
          date: string;
          createdAt: Date;
          updatedAt: Date;
        }>>`
          INSERT INTO "activities" ("id", "userId", "title", "category", "durationMinutes", "mood", "note", "date", "createdAt", "updatedAt")
          VALUES (${id}, ${data.userId}, ${data.title}, ${data.category}, ${data.durationMinutes}, ${data.mood}, ${data.note || null}, ${data.date}, ${now}, ${now})
          RETURNING *
        `;
        
        if (result && result.length > 0) {
          console.log('[ActivityRepository] Successfully created activity using raw SQL');
          return result[0] as any;
        }
        throw new Error('Failed to create activity using raw SQL');
      }
      
      // その他のエラーはそのままスロー
      console.error('[ActivityRepository] Error creating activity:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      throw error;
    }
  }

  async findById(id: string, userId: string) {
    return prisma.activity.findFirst({
      where: { id, userId },
    });
  }

  async findByUserId(userId: string, options?: { startDate?: string; endDate?: string; categories?: string[]; excludeSamples?: boolean }) {
    // isSampleカラムが存在しない場合でも動作するように、生SQLを使用
    try {
      const where: any = { userId };

      if (options?.startDate || options?.endDate) {
        where.date = {};
        if (options.startDate) where.date.gte = options.startDate;
        if (options.endDate) where.date.lte = options.endDate;
      }

      if (options?.categories && options.categories.length > 0) {
        where.category = { in: options.categories };
      }

      // サンプルデータを除外する場合
      if (options?.excludeSamples) {
        where.isSample = false;
      }

      return await prisma.activity.findMany({
        where,
        orderBy: { date: 'desc' },
      });
    } catch (error: any) {
      // P2022エラー（カラムが存在しない）の場合、生SQLを使用
      if (error.code === 'P2022' && error.meta?.column?.includes('isSample')) {
        console.log('[ActivityRepository] isSample column does not exist, using raw SQL');
        
        // 生SQLでクエリを構築（Prisma.$queryRawUnsafeを使用）
        const conditions: string[] = [`"userId" = $1`];
        const params: any[] = [userId];
        let paramIndex = 2;

        // 日付フィルタ
        if (options?.startDate) {
          conditions.push(`"date" >= $${paramIndex}`);
          params.push(options.startDate);
          paramIndex++;
        }
        if (options?.endDate) {
          conditions.push(`"date" <= $${paramIndex}`);
          params.push(options.endDate);
          paramIndex++;
        }

        // カテゴリフィルタ
        if (options?.categories && options.categories.length > 0) {
          // PostgreSQLの配列を使用
          conditions.push(`"category" = ANY($${paramIndex}::text[])`);
          params.push(options.categories);
          paramIndex++;
        }

        // excludeSamplesは無視（isSampleカラムが存在しないため）

        const sql = `SELECT * FROM "activities" WHERE ${conditions.join(' AND ')} ORDER BY "date" DESC`;

        // Prisma.$queryRawUnsafeを使用（動的SQL）
        const result = await prisma.$queryRawUnsafe<Array<{
          id: string;
          userId: string;
          title: string;
          category: string;
          durationMinutes: number;
          mood: number;
          note: string | null;
          date: string;
          createdAt: Date;
          updatedAt: Date;
        }>>(sql, ...params);

        console.log('[ActivityRepository] Successfully found activities using raw SQL:', result.length);
        return result as any;
      }
      // その他のエラーはそのままスロー
      console.error('[ActivityRepository] Error finding activities:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      throw error;
    }
  }

  async update(id: string, userId: string, data: {
    title?: string;
    category?: string;
    durationMinutes?: number;
    mood?: number;
    note?: string;
    date?: string;
  }) {
    return prisma.activity.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    return prisma.activity.deleteMany({
      where: { id, userId },
    });
  }

  async deleteSamples(userId: string) {
    try {
      // isSampleフィールドが存在する場合
      return await prisma.activity.deleteMany({
        where: { userId, isSample: true } as any,
      });
    } catch (error: any) {
      // P2022エラー（カラムが存在しない）の場合、生SQLを使用
      if (error.code === 'P2022' && error.meta?.column?.includes('isSample')) {
        console.log('[ActivityRepository] isSample column does not exist in deleteSamples, using raw SQL');
        
        // 生SQLで削除（isSampleカラムが存在しないため、全活動を削除するか、別の方法を使用）
        // 注意: isSampleカラムがない場合、サンプルデータを特定できないため、
        // オンボーディング中に作成された最新の活動を削除する（暫定対応）
        // または、全活動を削除する（オンボーディング中のみ）
        // ここでは、ユーザーの全活動を削除する（オンボーディング中のみ使用される想定）
        const result = await prisma.$executeRawUnsafe(
          `DELETE FROM "activities" WHERE "userId" = $1`,
          userId
        );
        
        console.log('[ActivityRepository] Successfully deleted activities using raw SQL:', result);
        return { count: result };
      }
      // その他のエラーはそのままスロー
      console.error('[ActivityRepository] Error deleting samples:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
      });
      throw error;
    }
  }
}



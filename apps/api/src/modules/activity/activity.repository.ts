import { prisma } from '../../common/db/prisma';

export class ActivityRepository {
  async create(data: {
    userId: string;
    title: string;
    category: string;
    durationMinutes: number;
    mood: number;
    note?: string;
    date: string;
  }) {
    return prisma.activity.create({ data });
  }

  async findById(id: string, userId: string) {
    return prisma.activity.findFirst({
      where: { id, userId },
    });
  }

  async findByUserId(userId: string, options?: { startDate?: string; endDate?: string; categories?: string[] }) {
    const where: any = { userId };

    if (options?.startDate || options?.endDate) {
      where.date = {};
      if (options.startDate) where.date.gte = options.startDate;
      if (options.endDate) where.date.lte = options.endDate;
    }

    if (options?.categories && options.categories.length > 0) {
      where.category = { in: options.categories };
    }

    return prisma.activity.findMany({
      where,
      orderBy: { date: 'desc' },
    });
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
}



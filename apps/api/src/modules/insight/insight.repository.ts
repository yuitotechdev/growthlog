import { prisma } from '../../common/db/prisma';

export class InsightRepository {
  async create(data: {
    userId: string;
    summary: string;
    advice: string;
    startDate: string;
    endDate: string;
    category?: string;
    activityCount: number;
  }) {
    return prisma.insight.create({ data });
  }

  async findByUserId(userId: string, limit?: number) {
    return prisma.insight.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findById(id: string, userId: string) {
    return prisma.insight.findFirst({
      where: { id, userId },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.insight.deleteMany({
      where: { id, userId },
    });
  }

  async countByUserId(userId: string) {
    return prisma.insight.count({
      where: { userId },
    });
  }
}

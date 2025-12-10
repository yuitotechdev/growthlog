import { prisma } from '../../common/db/prisma';

export class AdminRepository {
  async findAllUsers(search?: string, page: number = 1, limit: number = 20) {
    const where = search ? {
      OR: [
        { email: { contains: search } },
        { name: { contains: search } },
        { username: { contains: search } },
      ],
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          uniqueId: true,
          isAdmin: true,
          isSuspended: true,
          lastLoginAt: true,
          createdAt: true,
          _count: { select: { activities: true, insights: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async getUserDetails(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        uniqueId: true,
        isAdmin: true,
        isSuspended: true,
        lastLoginAt: true,
        createdAt: true,
        _count: { select: { activities: true, insights: true } },
      },
    });
  }

  async suspendUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });
  }

  async activateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });
  }

  async toggleAdminStatus(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    return prisma.user.update({
      where: { id },
      data: { isAdmin: !user?.isAdmin },
    });
  }

  async deleteUser(id: string) {
    return prisma.user.delete({ where: { id } });
  }

  async getOverviewStats() {
    const [totalUsers, totalActivities, totalInsights, activeUsers] = await Promise.all([
      prisma.user.count(),
      prisma.activity.count(),
      prisma.insight.count(),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return { totalUsers, totalActivities, totalInsights, activeUsers };
  }

  async getActivityStats() {
    const activities = await prisma.activity.groupBy({
      by: ['category'],
      _count: true,
      _sum: { durationMinutes: true },
    });

    return activities.map((a) => ({
      category: a.category,
      count: a._count,
      totalMinutes: a._sum.durationMinutes || 0,
    }));
  }

  async getLogs(type?: string, page: number = 1, limit: number = 50) {
    const where = type ? { type } : {};

    const [logs, total] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemLog.count({ where }),
    ]);

    return { logs, total, page, limit };
  }

  async getLogStats() {
    const stats = await prisma.systemLog.groupBy({
      by: ['type'],
      _count: true,
    });

    return stats.map((s) => ({
      type: s.type,
      count: s._count,
    }));
  }

  async getSettings() {
    return prisma.systemSetting.findMany();
  }

  async updateSetting(key: string, value: string) {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async deleteSetting(key: string) {
    return prisma.systemSetting.delete({ where: { key } });
  }
}




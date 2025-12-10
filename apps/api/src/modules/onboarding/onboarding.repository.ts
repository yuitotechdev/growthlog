import { prisma } from '../../common/db/prisma';

export class OnboardingRepository {
  async getActivityCount(userId: string): Promise<number> {
    return prisma.activity.count({
      where: { userId },
    });
  }
}


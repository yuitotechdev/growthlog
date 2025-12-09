import { prisma } from '../../common/db/prisma';

export class ProfileRepository {
  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
        isAdmin: true,
        uniqueIdChangedAt: true,
        createdAt: true,
      },
    });
  }

  async findByUniqueId(uniqueId: string) {
    return prisma.user.findUnique({
      where: { uniqueId },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });
  }

  async isUniqueIdAvailable(uniqueId: string, excludeUserId?: string) {
    const existing = await prisma.user.findUnique({
      where: { uniqueId },
    });
    
    if (!existing) return true;
    if (excludeUserId && existing.id === excludeUserId) return true;
    return false;
  }

  async updateProfile(userId: string, data: {
    username?: string;
    avatarEmoji?: string | null;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
        isAdmin: true,
        uniqueIdChangedAt: true,
        createdAt: true,
      },
    });
  }

  async updateUniqueId(userId: string, uniqueId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        uniqueId,
        uniqueIdChangedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
        isAdmin: true,
        uniqueIdChangedAt: true,
        createdAt: true,
      },
    });
  }
}

export const profileRepository = new ProfileRepository();


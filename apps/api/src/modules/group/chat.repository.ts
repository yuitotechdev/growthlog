import { prisma } from '../../common/db/prisma';

export class ChatRepository {
  async createMessage(data: { groupId: string; userId: string; content: string }) {
    return prisma.groupMessage.create({
      data,
    });
  }

  async getMessages(groupId: string, options?: { limit?: number; before?: string }) {
    const where: {
      groupId: string;
      createdAt?: { lt: Date };
    } = { groupId };
    
    if (options?.before) {
      where.createdAt = { lt: new Date(options.before) };
    }

    return prisma.groupMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }

  async getMessageCount(groupId: string) {
    return prisma.groupMessage.count({
      where: { groupId },
    });
  }

  async deleteMessage(id: string, userId: string) {
    // ユーザーが自分のメッセージのみ削除できる
    return prisma.groupMessage.deleteMany({
      where: { id, userId },
    });
  }
}

export const chatRepository = new ChatRepository();



import { chatRepository } from './chat.repository';
import { groupRepository } from './group.repository';
import { BadRequestError, ForbiddenError } from '../../common/errors/http.error';
import { prisma } from '../../common/db/prisma';

export class ChatService {
  async sendMessage(userId: string, groupId: string, content: string) {
    // メンバー確認
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループにメッセージを送信する権限がありません');
    }

    if (!content || content.trim().length === 0) {
      throw new BadRequestError('メッセージを入力してください');
    }

    if (content.length > 1000) {
      throw new BadRequestError('メッセージは1000文字以内で入力してください');
    }

    const message = await chatRepository.createMessage({
      groupId,
      userId,
      content: content.trim(),
    });

    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });

    return {
      id: message.id,
      groupId: message.groupId,
      user,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async getMessages(userId: string, groupId: string, options?: { limit?: number; before?: string }) {
    // メンバー確認
    const isMember = await groupRepository.isMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenError('このグループのメッセージを閲覧する権限がありません');
    }

    const messages = await chatRepository.getMessages(groupId, options);

    // ユーザーIDのリストを取得
    const userIds = [...new Set(messages.map((m) => m.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        uniqueId: true,
        avatarEmoji: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return messages.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      user: userMap.get(m.userId) || null,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })).reverse(); // 古い順に並べ替え
  }

  async deleteMessage(userId: string, messageId: string) {
    const result = await chatRepository.deleteMessage(messageId, userId);
    if (result.count === 0) {
      throw new BadRequestError('メッセージの削除に失敗しました');
    }
  }
}

export const chatService = new ChatService();



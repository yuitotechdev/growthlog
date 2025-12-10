import { Response, NextFunction } from 'express';
import { chatService } from './chat.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';

export class ChatController {
  sendMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { content } = req.body;

      const message = await chatService.sendMessage(userId, groupId, content);
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  };

  getMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { groupId } = req.params;
      const { limit, before } = req.query;

      const messages = await chatService.getMessages(userId, groupId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        before: before as string,
      });
      res.json(messages);
    } catch (error) {
      next(error);
    }
  };

  deleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { messageId } = req.params;

      await chatService.deleteMessage(userId, messageId);
      res.json({ message: 'メッセージを削除しました' });
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController();




import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { BadRequestError } from '../../common/errors/http.error';

export class AuthController {
  constructor(private service: AuthService) {}

  signUp = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, uniqueId, name } = req.body;

      if (!email || !password || !uniqueId) {
        return next(new BadRequestError('メールアドレス、パスワード、ユーザーIDは必須です'));
      }

      const result = await this.service.signUp(email, password, uniqueId, name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { identifier, password } = req.body;
      // 後方互換性のため、emailも受け付ける
      const loginIdentifier = identifier || req.body.email;

      if (!loginIdentifier || !password) {
        return next(new BadRequestError('ユーザーID（またはメールアドレス）とパスワードは必須です'));
      }

      const result = await this.service.login(loginIdentifier, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}



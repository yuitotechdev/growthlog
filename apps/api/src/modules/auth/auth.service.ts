import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { env } from '../../common/config/env';
import { BadRequestError, UnauthorizedError, ConflictError } from '../../common/errors/http.error';
import { categoryRepository } from '../category/category.repository';

export class AuthService {
  constructor(private repository: AuthRepository) {}

  async signUp(email: string, password: string, uniqueId: string, name?: string) {
    try {
      // メールアドレスを小文字に正規化
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log('[Auth] SignUp: Validating input...');
      
      // Check if email already exists
      const existingUser = await this.repository.findByEmail(normalizedEmail);
      if (existingUser) {
        throw new ConflictError('このメールアドレスは既に登録されています');
      }

      // Check if uniqueId already exists
      const existingUniqueId = await this.repository.findByUniqueId(uniqueId);
      if (existingUniqueId) {
        throw new ConflictError('このユーザーIDは既に使用されています');
      }

      // Validate email format
      if (!this.isValidEmail(email)) {
        throw new BadRequestError('有効なメールアドレスを入力してください');
      }

      // Validate uniqueId format
      if (!this.isValidUniqueId(uniqueId)) {
        throw new BadRequestError('ユーザーIDは3文字以上20文字以下の英数字とアンダースコアのみ使用できます');
      }

      // Validate password
      if (password.length < 6) {
        throw new BadRequestError('パスワードは6文字以上で入力してください');
      }

      console.log('[Auth] SignUp: Creating user...');
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user (メール認証なし)
      // メールアドレスは小文字に正規化して保存
      const user = await this.repository.create({
        email: normalizedEmail,
        password: hashedPassword,
        name,
        uniqueId,
        emailVerified: true, // メール認証をスキップして、すぐに認証済みにする
      });

      console.log('[Auth] SignUp: User created, initializing categories...', { userId: user.id });

      // Initialize default categories for the user
      try {
        await categoryRepository.initializeDefaultCategories(user.id);
        console.log('[Auth] SignUp: Categories initialized');
      } catch (categoryError: any) {
        console.error('[Auth] SignUp: Failed to initialize categories:', categoryError);
        // カテゴリの初期化に失敗してもユーザー作成は成功とする
        // （後で手動でカテゴリを追加できる）
      }

      // Generate token
      const token = this.generateToken(user.id);
      console.log('[Auth] SignUp: Token generated');

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          uniqueId: user.uniqueId,
          emailVerified: true,
        },
        token,
      };
    } catch (error: any) {
      console.error('[Auth] SignUp error:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }

  async login(identifier: string, password: string) {
    // Find user by email or uniqueId
    // メールアドレスの可能性がある場合は小文字に正規化
    const normalizedIdentifier = identifier.toLowerCase().trim();
    let user = await this.repository.findByEmail(normalizedIdentifier);
    if (!user) {
      // uniqueIdの場合は大文字小文字を区別しない（小文字に変換して検索）
      user = await this.repository.findByUniqueId(normalizedIdentifier);
    }
    
    if (!user) {
      throw new UnauthorizedError('ユーザーIDまたはパスワードが間違っています');
    }

    // Check if user is suspended
    if (user.isSuspended) {
      throw new UnauthorizedError('このアカウントは停止されています');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('ユーザーIDまたはパスワードが間違っています');
    }

    // Update last login
    await this.repository.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        uniqueId: user.uniqueId,
        isAdmin: user.isAdmin,
        emailVerified: user.emailVerified,
      },
      token,
    };
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUniqueId(uniqueId: string): boolean {
    // 3文字以上20文字以下、英数字とアンダースコアのみ
    const uniqueIdRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return uniqueIdRegex.test(uniqueId);
  }
}



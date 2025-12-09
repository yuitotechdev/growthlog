import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { env } from '../config/env';

class EmailService {
  private resend: Resend | null = null;
  private transporter: nodemailer.Transporter | null = null;
  private initialized: boolean = false;

  constructor() {
    // Resend APIキーが設定されている場合はResendを使用
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      console.log('✅ Resend APIを初期化しました');
      if (env.nodeEnv === 'development') {
        console.log('⚠️ 開発環境: Resendの無料プランでは、登録メールアドレスにのみ送信可能です');
      }
    }
    // Resend APIキーが設定されていない場合は、メール送信機能は使用しない（警告なし）
  }

  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializeTransporter();
      this.initialized = true;
    }
  }

  private async initializeTransporter() {
    // Resendが設定されている場合は、SMTPは不要
    if (this.resend) {
      return;
    }

    // 開発環境でEthereal Emailを使用（無料のテスト用メールサービス）
    // Resendの無料プランでは、登録メールアドレスにのみ送信可能なため、開発環境ではEthereal Emailを使用
    if (env.nodeEnv === 'development' && !process.env.SMTP_HOST) {
      try {
        // Ethereal Emailでテストアカウントを自動作成
        const testAccount = await nodemailer.createTestAccount();
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('✅ Ethereal Emailアカウントを作成しました（開発環境用）');
        console.log(`   メール確認用URL: https://ethereal.email`);
        console.log(`   ユーザー名: ${testAccount.user}`);
        console.log(`   パスワード: ${testAccount.pass}`);
        return;
      } catch (error) {
        console.log('⚠️ Ethereal Emailの作成に失敗しました。コンソールにメール内容を表示します。');
        return;
      }
    }

    // 本番環境またはSMTP設定がある場合
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      console.log('✅ SMTP設定を読み込みました');
    } else {
      console.log('⚠️ メール送信機能: SMTP設定がありません。');
    }
  }

  async sendVerificationEmail(email: string, token: string, uniqueId: string) {
    await this.ensureInitialized();
    
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'onboarding@resend.dev';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 12px;
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              font-size: 12px;
              color: #666;
              text-align: center;
            }
            .token {
              background: #f5f5f5;
              padding: 10px;
              border-radius: 6px;
              font-family: monospace;
              font-size: 12px;
              word-break: break-all;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GrowthLog</div>
            </div>
            
            <h2>メールアドレスの認証</h2>
            
            <p>こんにちは、${uniqueId}さん</p>
            
            <p>GrowthLogへのご登録ありがとうございます。以下のボタンをクリックして、メールアドレスを認証してください。</p>
            
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">メールアドレスを認証する</a>
            </div>
            
            <p>ボタンがクリックできない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
            <div class="token">${verificationUrl}</div>
            
            <p><strong>このリンクは24時間有効です。</strong></p>
            
            <p>このメールに心当たりがない場合は、無視していただいて構いません。</p>
            
            <div class="footer">
              <p>このメールは自動送信されています。返信はできません。</p>
              <p>&copy; ${new Date().getFullYear()} GrowthLog. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

    const textContent = `
GrowthLog - メールアドレス認証

こんにちは、${uniqueId}さん

GrowthLogへのご登録ありがとうございます。以下のリンクをクリックして、メールアドレスを認証してください。

${verificationUrl}

このリンクは24時間有効です。

このメールに心当たりがない場合は、無視していただいて構いません。
    `.trim();

    try {
      // Resendを使用
      if (this.resend) {
        console.log(`📧 Resendでメール送信を試みます: ${email}`);
        console.log(`   送信元: ${fromEmail}`);
        
        const { data, error } = await this.resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'GrowthLog - メールアドレス認証',
          html: htmlContent,
          text: textContent,
        });

        if (error) {
          console.error('❌ Resendメール送信エラー:', JSON.stringify(error, null, 2));
          console.error('   エラー詳細:', error);
          throw new Error(`メールの送信に失敗しました: ${error.message || 'Unknown error'}`);
        }

        console.log(`✅ 認証メールを送信しました（Resend）: ${email}`);
        console.log(`   メールID: ${data?.id}`);
        console.log(`   Resendダッシュボードで確認: https://resend.com/emails`);
        return;
      }

      // SMTPを使用（開発環境またはResend未設定時）
      if (this.transporter) {
        const mailOptions = {
          from: fromEmail,
          to: email,
          subject: 'GrowthLog - メールアドレス認証',
          html: htmlContent,
          text: textContent,
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`✅ 認証メールを送信しました: ${email}`);
        
        // Ethereal Emailを使用している場合、プレビューURLを表示
        if (env.nodeEnv === 'development') {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log(`📧 メールプレビューURL: ${previewUrl}`);
            console.log(`   （このURLで送信されたメールの内容を確認できます）`);
          }
        }
      } else {
        // 開発環境でSMTPが設定されていない場合
        console.log('📧 [開発環境] 認証メール送信（SMTP未設定）:');
        console.log(`   宛先: ${email}`);
        console.log(`   認証URL: ${verificationUrl}`);
        console.log(`   トークン: ${token}`);
        console.log(`\n   実際のメール送信には、以下のいずれかを設定してください：`);
        console.log(`   1. RESEND_API_KEY（推奨・本番環境用）`);
        console.log(`   2. SMTP設定（SMTP_HOST, SMTP_USER, SMTP_PASS）`);
      }
    } catch (error) {
      console.error('❌ メール送信エラー:', error);
      throw new Error('メールの送信に失敗しました');
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    await this.ensureInitialized();
    
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER || 'onboarding@resend.dev';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border: 1px solid #e0e0e0;
              border-radius: 12px;
              padding: 30px;
              margin: 20px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>パスワードリセット</h2>
            <p>パスワードリセットのリクエストを受け付けました。以下のリンクをクリックして新しいパスワードを設定してください。</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">パスワードをリセット</a>
            </div>
            <p>このリンクは1時間有効です。</p>
          </div>
        </body>
        </html>
      `;

    try {
      // Resendを使用（本番環境推奨）
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from: fromEmail,
          to: email,
          subject: 'GrowthLog - パスワードリセット',
          html: htmlContent,
        });

        if (error) {
          console.error('❌ Resendメール送信エラー:', error);
          throw new Error('メールの送信に失敗しました');
        }

        console.log(`✅ パスワードリセットメールを送信しました（Resend）: ${email}`);
        return;
      }

      // SMTPを使用
      if (this.transporter) {
        const mailOptions = {
          from: fromEmail,
          to: email,
          subject: 'GrowthLog - パスワードリセット',
          html: htmlContent,
        };

        const info = await this.transporter.sendMail(mailOptions);
        console.log(`✅ パスワードリセットメールを送信しました: ${email}`);
        
        // Ethereal Emailを使用している場合、プレビューURLを表示
        if (env.nodeEnv === 'development') {
          const previewUrl = nodemailer.getTestMessageUrl(info);
          if (previewUrl) {
            console.log(`📧 メールプレビューURL: ${previewUrl}`);
          }
        }
      } else {
        console.log('📧 [開発環境] パスワードリセットメール送信（SMTP未設定）:');
        console.log(`   認証URL: ${resetUrl}`);
      }
    } catch (error) {
      console.error('❌ メール送信エラー:', error);
      throw new Error('メールの送信に失敗しました');
    }
  }
}

export const emailService = new EmailService();


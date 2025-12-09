import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import { env } from './common/config/env';
import { HttpError } from './common/errors/http.error';
import { authMiddleware } from './common/middleware/auth.middleware';
import { adminMiddleware } from './common/middleware/admin.middleware';
import { loggingMiddleware } from './common/middleware/logging.middleware';
import { AuthController } from './modules/auth/auth.controller';
import { AuthService } from './modules/auth/auth.service';
import { AuthRepository } from './modules/auth/auth.repository';
import { ActivityController } from './modules/activity/activity.controller';
import { ActivityService } from './modules/activity/activity.service';
import { ActivityRepository } from './modules/activity/activity.repository';
import { InsightController } from './modules/insight/insight.controller';
import { InsightService } from './modules/insight/insight.service';
import { InsightRepository } from './modules/insight/insight.repository';
import { AdminController } from './modules/admin/admin.controller';
import { AdminService } from './modules/admin/admin.service';
import { AdminRepository } from './modules/admin/admin.repository';
import { categoryController } from './modules/category/category.controller';
import { profileController } from './modules/profile/profile.controller';
import { groupController } from './modules/group/group.controller';
import { sharedActivityController } from './modules/group/shared-activity.controller';
import { chatController } from './modules/group/chat.controller';

const app: Application = express();

// CORS設定: 最上部で設定し、FRONTEND_URLとVercelプレビューURLを許可
const rawFrontendUrl = process.env.FRONTEND_URL || '';
const FRONTEND_URL = rawFrontendUrl.replace(/\/$/, ''); // 末尾の"/"を削除して正規化

// 開発環境ではlocalhostも許可
const isProduction = process.env.NODE_ENV === 'production';

// CORS設定: 本番環境ではFRONTEND_URLとVercelプレビューURLを許可
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // originがundefined（同一オリジン）の場合は許可
    if (!origin) {
      callback(null, true);
      return;
    }

    // 開発環境ではlocalhostを許可
    if (!isProduction) {
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
        return;
      }
    }

    // 本番環境ではFRONTEND_URLとVercelプレビューURLを許可
    if (isProduction) {
      // FRONTEND_URLと完全一致
      if (FRONTEND_URL && origin === FRONTEND_URL) {
        callback(null, true);
        return;
      }
      // VercelプレビューURLパターン（*.vercel.app または *-dekaos-projects.vercel.app）
      const vercelPattern = /^https:\/\/.*\.vercel\.app$/;
      if (vercelPattern.test(origin)) {
        callback(null, true);
        return;
      }
    }

    // 許可されていないオリジン（エラーを返さず、falseを返す）
    console.warn(`CORS: Origin not allowed: ${origin} (FRONTEND_URL: ${FRONTEND_URL}, isProduction: ${isProduction})`);
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// プリフライト対応: すべてのOPTIONSリクエストにCORSを適用して200を返す
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(loggingMiddleware);

// Initialize repositories
const authRepository = new AuthRepository();
const activityRepository = new ActivityRepository();
const insightRepository = new InsightRepository();
const adminRepository = new AdminRepository();

// Initialize services
const authService = new AuthService(authRepository);
const activityService = new ActivityService(activityRepository);
const insightService = new InsightService(activityRepository, insightRepository);
const adminService = new AdminService(adminRepository);

// Initialize controllers
const authController = new AuthController(authService);
const activityController = new ActivityController(activityService);
const insightController = new InsightController(insightService);
const adminController = new AdminController(adminService);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: 'GrowthLog API',
    version: '1.0.0',
    status: 'ok',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      activities: '/api/activities',
      insights: '/api/insights',
      groups: '/api/groups',
      profile: '/api/profile',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth routes (no authentication required)
app.post('/api/auth/signup', authController.signUp);
app.post('/api/auth/login', authController.login);

// Profile routes (authentication required)
app.get('/api/profile', authMiddleware, profileController.getProfile);
app.put('/api/profile', authMiddleware, profileController.updateProfile);
app.put('/api/profile/unique-id', authMiddleware, profileController.updateUniqueId);
app.get('/api/profile/check-unique-id/:uniqueId', authMiddleware, profileController.checkUniqueIdAvailability);
app.get('/api/users/:uniqueId', authMiddleware, profileController.getPublicProfile);

// Activity routes (authentication required)
app.post('/api/activities', authMiddleware, activityController.create);
app.get('/api/activities', authMiddleware, activityController.findByUserId);
app.get('/api/activities/:id', authMiddleware, activityController.findById);
app.put('/api/activities/:id', authMiddleware, activityController.update);
app.delete('/api/activities/:id', authMiddleware, activityController.delete);
app.get('/api/activities/:activityId/shared-groups', authMiddleware, sharedActivityController.getActivitySharedGroups);

// Insight routes (authentication required)
app.post('/api/insights', authMiddleware, insightController.create);
app.get('/api/insights', authMiddleware, insightController.findByUserId);
app.get('/api/insights/:id', authMiddleware, insightController.findById);
app.delete('/api/insights/:id', authMiddleware, insightController.delete);

// Category routes (authentication required)
app.get('/api/categories', authMiddleware, categoryController.getCategories);
app.post('/api/categories', authMiddleware, categoryController.createCategory);
app.put('/api/categories/reorder', authMiddleware, categoryController.reorderCategories);
app.get('/api/categories/:id', authMiddleware, categoryController.getCategory);
app.put('/api/categories/:id', authMiddleware, categoryController.updateCategory);
app.delete('/api/categories/:id', authMiddleware, categoryController.deleteCategory);

// Group routes (authentication required)
app.get('/api/groups', authMiddleware, groupController.getMyGroups);
app.post('/api/groups', authMiddleware, groupController.createGroup);
app.get('/api/groups/invite/:inviteCode', authMiddleware, groupController.getGroupByInviteCode);
app.post('/api/groups/join/:inviteCode', authMiddleware, groupController.joinByInviteCode);
app.get('/api/groups/:groupId', authMiddleware, groupController.getGroup);
app.put('/api/groups/:groupId', authMiddleware, groupController.updateGroup);
app.delete('/api/groups/:groupId', authMiddleware, groupController.deleteGroup);
app.put('/api/groups/:groupId/categories', authMiddleware, groupController.updateSharedCategories);
app.post('/api/groups/:groupId/invite', authMiddleware, groupController.inviteByUniqueId);
app.post('/api/groups/:groupId/leave', authMiddleware, groupController.leaveGroup);
app.delete('/api/groups/:groupId/members/:memberId', authMiddleware, groupController.removeMember);
app.post('/api/groups/:groupId/regenerate-invite', authMiddleware, groupController.regenerateInviteCode);

// Shared activity routes (authentication required)
app.post('/api/shared-activities', authMiddleware, sharedActivityController.shareActivity);
app.delete('/api/shared-activities', authMiddleware, sharedActivityController.unshareActivity);
app.get('/api/groups/:groupId/activities', authMiddleware, sharedActivityController.getSharedActivities);
app.get('/api/groups/:groupId/member-summaries', authMiddleware, sharedActivityController.getMemberSummaries);
app.get('/api/groups/:groupId/rankings', authMiddleware, sharedActivityController.getMemberRankings);

// Chat routes (authentication required)
app.get('/api/groups/:groupId/messages', authMiddleware, chatController.getMessages);
app.post('/api/groups/:groupId/messages', authMiddleware, chatController.sendMessage);
app.delete('/api/messages/:messageId', authMiddleware, chatController.deleteMessage);

// Admin routes (admin authentication required)
app.get('/api/admin/users', authMiddleware, adminMiddleware, adminController.getUsers);
app.get('/api/admin/users/:id', authMiddleware, adminMiddleware, adminController.getUserDetails);
app.post('/api/admin/users/:id/suspend', authMiddleware, adminMiddleware, adminController.suspendUser);
app.post('/api/admin/users/:id/activate', authMiddleware, adminMiddleware, adminController.activateUser);
app.post('/api/admin/users/:id/toggle-admin', authMiddleware, adminMiddleware, adminController.toggleAdminStatus);
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, adminController.deleteUser);

app.get('/api/admin/stats/overview', authMiddleware, adminMiddleware, adminController.getOverviewStats);
app.get('/api/admin/stats/activities', authMiddleware, adminMiddleware, adminController.getActivityStats);

app.get('/api/admin/logs', authMiddleware, adminMiddleware, adminController.getLogs);
app.get('/api/admin/logs/stats', authMiddleware, adminMiddleware, adminController.getLogStats);

app.get('/api/admin/settings', authMiddleware, adminMiddleware, adminController.getSettings);
app.put('/api/admin/settings/:key', authMiddleware, adminMiddleware, adminController.updateSetting);
app.delete('/api/admin/settings/:key', authMiddleware, adminMiddleware, adminController.deleteSetting);

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({
      error: error.error || 'Error',
      message: error.message,
      statusCode: error.statusCode,
    });
  } else {
    // 本番環境では詳細なエラー情報を隠すが、開発環境では表示
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.error('Unhandled error:', error);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      error: 'InternalServerError',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
      statusCode: 500,
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'NotFound',
    message: 'Route not found',
    statusCode: 404,
  });
});

// Vercel環境ではサーバーを起動しない（サーバーレス関数として動作）
if (process.env.VERCEL !== '1') {
  const PORT = env.port;

  app.listen(PORT, () => {
    console.log(`🚀 API server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  }).on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Please stop the other process or use a different port.`);
    } else {
      console.error('❌ Failed to start server:', error);
    }
    process.exit(1);
  });
}

// Vercel用にエクスポート
export default app;


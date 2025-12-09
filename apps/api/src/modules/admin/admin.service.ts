import { AdminRepository } from './admin.repository';
import { NotFoundError, BadRequestError } from '../../common/errors/http.error';

export class AdminService {
  constructor(private repository: AdminRepository) {}

  async getUsers(search?: string, page?: number, limit?: number) {
    return this.repository.findAllUsers(search, page, limit);
  }

  async getUserDetails(id: string) {
    const user = await this.repository.getUserDetails(id);
    if (!user) {
      throw new NotFoundError('ユーザーが見つかりません');
    }
    return user;
  }

  async suspendUser(id: string) {
    return this.repository.suspendUser(id);
  }

  async activateUser(id: string) {
    return this.repository.activateUser(id);
  }

  async toggleAdminStatus(id: string) {
    return this.repository.toggleAdminStatus(id);
  }

  async deleteUser(id: string) {
    return this.repository.deleteUser(id);
  }

  async getOverviewStats() {
    return this.repository.getOverviewStats();
  }

  async getActivityStats() {
    return this.repository.getActivityStats();
  }

  async getLogs(type?: string, page?: number, limit?: number) {
    return this.repository.getLogs(type, page, limit);
  }

  async getLogStats() {
    return this.repository.getLogStats();
  }

  async getSettings() {
    return this.repository.getSettings();
  }

  async updateSetting(key: string, value: string) {
    if (!key || value === undefined) {
      throw new BadRequestError('キーと値は必須です');
    }
    return this.repository.updateSetting(key, value);
  }

  async deleteSetting(key: string) {
    return this.repository.deleteSetting(key);
  }
}



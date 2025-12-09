import { categoryRepository, CategoryRepository } from './category.repository';
import { BadRequestError, NotFoundError } from '../../common/errors/http.error';

export class CategoryService {
  constructor(private repository: CategoryRepository) {}

  async getCategories(userId: string) {
    const categories = await this.repository.findByUserId(userId);
    // カテゴリが0件の場合、デフォルトカテゴリを初期化
    if (categories.length === 0) {
      return this.repository.initializeDefaultCategories(userId);
    }
    return categories;
  }

  async getCategory(id: string, userId: string) {
    const category = await this.repository.findById(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundError('カテゴリが見つかりません');
    }
    return category;
  }

  async createCategory(userId: string, data: { name: string; emoji: string; color: string }) {
    const existing = await this.repository.findByUserIdAndName(userId, data.name);
    if (existing) {
      throw new BadRequestError('同じ名前のカテゴリが既に存在します');
    }

    const sortOrder = await this.repository.getNextSortOrder(userId);
    return this.repository.create({ userId, ...data, sortOrder });
  }

  async updateCategory(id: string, userId: string, data: { name?: string; emoji?: string; color?: string }) {
    const category = await this.repository.findById(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundError('カテゴリが見つかりません');
    }

    // デフォルトカテゴリも編集可能に変更

    if (data.name) {
      const existing = await this.repository.findByUserIdAndName(userId, data.name);
      if (existing && existing.id !== id) {
        throw new BadRequestError('同じ名前のカテゴリが既に存在します');
      }
    }

    return this.repository.update(id, data);
  }

  async deleteCategory(id: string, userId: string) {
    const category = await this.repository.findById(id);
    if (!category || category.userId !== userId) {
      throw new NotFoundError('カテゴリが見つかりません');
    }

    // デフォルトカテゴリも削除可能に変更
    return this.repository.delete(id);
  }

  async reorderCategories(userId: string, categoryIds: string[]) {
    await this.repository.updateSortOrders(userId, categoryIds);
    return this.repository.findByUserId(userId);
  }
}

export const categoryService = new CategoryService(categoryRepository);


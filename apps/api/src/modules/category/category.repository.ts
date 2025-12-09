import { prisma } from '../../common/db/prisma';

export const DEFAULT_CATEGORIES = [
  { name: '勉強', emoji: '📚', color: '#3b82f6', sortOrder: 0 },
  { name: '仕事', emoji: '💼', color: '#8b5cf6', sortOrder: 1 },
  { name: '運動', emoji: '🏃', color: '#10b981', sortOrder: 2 },
  { name: '生活', emoji: '🏠', color: '#f59e0b', sortOrder: 3 },
  { name: 'その他', emoji: '📦', color: '#64748b', sortOrder: 4 },
];

export class CategoryRepository {
  async findByUserId(userId: string) {
    return prisma.category.findMany({
      where: { userId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async findByUserIdAndName(userId: string, name: string) {
    return prisma.category.findFirst({
      where: { userId, name },
    });
  }

  async create(data: {
    userId: string;
    name: string;
    emoji: string;
    color: string;
    isDefault?: boolean;
    sortOrder?: number;
  }) {
    return prisma.category.create({
      data: {
        userId: data.userId,
        name: data.name,
        emoji: data.emoji,
        color: data.color,
        isDefault: data.isDefault ?? false,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    emoji?: string;
    color?: string;
    sortOrder?: number;
  }) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }

  async initializeDefaultCategories(userId: string) {
    const existingCount = await prisma.category.count({
      where: { userId },
    });

    if (existingCount === 0) {
      const categories = DEFAULT_CATEGORIES.map((cat, index) => ({
        userId,
        name: cat.name,
        emoji: cat.emoji,
        color: cat.color,
        isDefault: true,
        sortOrder: index,
      }));

      await prisma.category.createMany({
        data: categories,
      });
    }

    return this.findByUserId(userId);
  }

  async getNextSortOrder(userId: string) {
    const maxCategory = await prisma.category.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' },
    });
    return (maxCategory?.sortOrder ?? -1) + 1;
  }

  async updateSortOrders(userId: string, categoryIds: string[]) {
    const updates = categoryIds.map((id, index) =>
      prisma.category.update({
        where: { id },
        data: { sortOrder: index },
      })
    );
    await prisma.$transaction(updates);
  }
}

export const categoryRepository = new CategoryRepository();


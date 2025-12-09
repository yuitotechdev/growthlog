import { Response, NextFunction } from 'express';
import { categoryService } from './category.service';
import type { AuthRequest } from '../../common/middleware/auth.middleware';
import { BadRequestError } from '../../common/errors/http.error';

export class CategoryController {
  getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const categories = await categoryService.getCategories(userId);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };

  getCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const category = await categoryService.getCategory(id, userId);
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { name, emoji, color } = req.body;

      if (!name || !emoji || !color) {
        return next(new BadRequestError('名前、絵文字、色は必須です'));
      }

      const category = await categoryService.createCategory(userId, { name, emoji, color });
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { name, emoji, color } = req.body;

      const category = await categoryService.updateCategory(id, userId, { name, emoji, color });
      res.json(category);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      await categoryService.deleteCategory(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  reorderCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { categoryIds } = req.body;

      if (!Array.isArray(categoryIds)) {
        return next(new BadRequestError('categoryIdsは配列である必要があります'));
      }

      const categories = await categoryService.reorderCategories(userId, categoryIds);
      res.json(categories);
    } catch (error) {
      next(error);
    }
  };
}

export const categoryController = new CategoryController();


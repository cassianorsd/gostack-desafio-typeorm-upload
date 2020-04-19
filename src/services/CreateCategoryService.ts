// import AppError from '../errors/AppError';

import { getRepository } from 'typeorm';
import Category from '../models/Category';

interface Request {
  title: string;
}

class CreateCategoryService {
  public async executeMany(requests: Request[]): Promise<Category[]> {
    const categoryRepository = getRepository(Category);

    const checkAndExecute = async (request: Request): Promise<Category> => {
      let hasCategory = await categoryRepository.findOne({
        where: { title: request.title },
      });
      if (!hasCategory) {
        hasCategory = await this.execute({ title: request.title });
      }
      return hasCategory;
    };

    const categories = await Promise.all(
      requests.map(item => checkAndExecute(item)),
    );
    return categories;
  }

  public async execute({ title }: Request): Promise<Category> {
    const categoryRepository = getRepository(Category);

    const category = categoryRepository.create({
      title,
    });
    await categoryRepository.save(category);
    return category;
  }
}

export default CreateCategoryService;

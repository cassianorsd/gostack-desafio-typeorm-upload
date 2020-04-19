// import AppError from '../errors/AppError';

import { getRepository, getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';
import CreateCategoryService from './CreateCategoryService';
import AppError from '../errors/AppError';

interface Request {
  type: 'income' | 'outcome';
  value: number;
  title: string;
  category: string;
}

interface CategoryRequest {
  title: string;
}

class CreateTransactionService {
  public async executeMany(requests: Request[]) {
    const categories = requests.map(item => {
      return { title: item.category };
    });
    const createCategory = new CreateCategoryService();
    await createCategory.executeMany(categories);
    const storeTransaction = async ({
      type,
      value,
      title,
      category,
    }: Request): Promise<Transaction> => {
      const categoryRepository = getRepository(Category);
      let hasCategory = await categoryRepository.findOne({
        where: { title: category },
      });

      if (!hasCategory) {
        hasCategory = await createCategory.execute({ title: category });
      }

      const transactionsRepository = getCustomRepository(
        TransactionsRepository,
      );

      const transaction = transactionsRepository.create({
        title,
        value,
        type,
        category_id: hasCategory.id,
      });
      await transactionsRepository.save(transaction);
      return transaction;
    };
    const transactions = await Promise.all(
      requests.map(request => storeTransaction(request)),
    );
    return transactions;
  }

  public async execute({
    type,
    value,
    title,
    category,
  }: Request): Promise<Transaction> {
    const categoryRepository = getRepository(Category);
    let hasCategory = await categoryRepository.findOne({
      where: { title: category },
    });
    if (!hasCategory) {
      const createCategory = new CreateCategoryService();
      hasCategory = await createCategory.execute({ title: category });
    }

    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > total) {
      throw new AppError(
        'User does not have enough balance for this transaction.',
        400,
      );
    }
    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: hasCategory.id,
    });
    await transactionsRepository.save(transaction);
    return transaction;
  }
}

export default CreateTransactionService;

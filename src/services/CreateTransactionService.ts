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
  public async executeMany(requests: Request[]): Promise<Transaction[]> {
    const categories = requests.map(item => {
      return { title: item.category };
    });
    const createCategory = new CreateCategoryService();
    await createCategory.executeMany(categories);

    const totals = requests.reduce(
      (acc, item) => {
        if (item.type === 'income') acc.income += Number(item.value);
        if (item.type === 'outcome') acc.outcome += Number(item.value);
        return { ...acc };
      },
      {
        income: 0,
        outcome: 0,
      },
    );

    if (totals.outcome > totals.income)
      throw new AppError(
        'User does not have enough balance for this transaction.',
        400,
      );

    const incomeTransactions = await Promise.all(
      requests
        .filter(req => req.type === 'income')
        .map(({ type, value, title, category }) =>
          this.execute({ type, value, title, category }),
        ),
    );

    const outcomeTransactions = await Promise.all(
      requests
        .filter(req => req.type === 'outcome')
        .map(({ type, value, title, category }) =>
          this.execute({ type, value, title, category }),
        ),
    );

    return [...incomeTransactions, ...outcomeTransactions];
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

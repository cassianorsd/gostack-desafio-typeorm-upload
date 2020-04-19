import csv from 'csvtojson';
import fs from 'fs';
import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import Category from '../models/Category';
import uploadConfig from '../config/upload';
import CreateCategoryService from './CreateCategoryService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute(file: Express.Multer.File): Promise<Transaction[]> {
    let transactions: Transaction[] = [];
    let data = await csv().fromFile(
      `${uploadConfig.directory}/${file.filename}`,
    );

    const updateCategory = async (transaction: Request): Promise<Request> => {
      const categoriesRepository = getRepository(Category);
      let hasCategory = await categoriesRepository.findOne({
        where: { title: transaction.category },
      });
      if (!hasCategory) {
        const createCategory = new CreateCategoryService();
        hasCategory = await createCategory.execute({
          title: transaction.category,
        });
      }
      return { ...transaction, category: hasCategory.id };
    };

    data = await Promise.all(
      data.map(transaction => updateCategory(transaction)),
    );

    transactions = await Promise.all(
      data.map(item => {
        const transactionsRepository = getRepository(Transaction);
        const transaction = transactionsRepository.create({
          title: item.title,
          value: item.value,
          type: item.type,
          category_id: item.category,
        });
        return transactionsRepository.save(transaction);
      }),
    );
    return transactions;
  }
}

export default ImportTransactionsService;

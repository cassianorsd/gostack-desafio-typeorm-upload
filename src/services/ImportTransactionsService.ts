import csv from 'csvtojson';
import fs from 'fs';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

class ImportTransactionsService {
  public async execute(file: Express.Multer.File): Promise<Transaction[]> {
    let transactions: Transaction[] = [];
    const data = await csv().fromFile(
      `${uploadConfig.directory}/${file.filename}`,
    );
    transactions = await Promise.all(
      data.map(transaction => {
        const createTransaction = new CreateTransactionService();
        return createTransaction.execute({
          category: transaction.category,
          title: transaction.title,
          value: transaction.value,
          type: transaction.type,
        });
      }),
    );
    return transactions;
  }
}

export default ImportTransactionsService;

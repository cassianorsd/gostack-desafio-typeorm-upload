import csv from 'csv-parse';
import fs from 'fs';
import { TransactionManager } from 'typeorm';
import Transaction from '../models/Transaction';
import uploadConfig from '../config/upload';
import CreateTransactionService from './CreateTransactionService';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class ImportTransactionsService {
  public async execute(file: Express.Multer.File): Promise<Transaction[]> {
    const requests: Request[] = [];
    const readStream = fs.createReadStream(
      `${uploadConfig.directory}/${file.filename}`,
    );
    const parseCSV = readStream.pipe(csv({ from_line: 2 }));

    let transactions: Transaction[] = [];
    parseCSV.on('data', item => {
      const [title, type, value, category] = item.map((itemval: string) =>
        itemval.trim(),
      );
      requests.push({ title, type, value, category });
    });

    await new Promise(resolve => {
      parseCSV.on('end', async () => {
        const createTransaction = new CreateTransactionService();
        transactions = await createTransaction.executeMany(requests);
        resolve(transactions);
      });
    });
    return transactions;
  }
}

export default ImportTransactionsService;

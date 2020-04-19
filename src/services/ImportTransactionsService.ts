import csv from 'csvtojson';
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
    const requests = await csv().fromFile(
      `${uploadConfig.directory}/${file.filename}`,
    );

    const createTransaction = new CreateTransactionService();
    const transactions = await createTransaction.executeMany(requests);
    return transactions;
  }
}

export default ImportTransactionsService;

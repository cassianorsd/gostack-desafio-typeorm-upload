// import AppError from '../errors/AppError';

import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';

interface Request {
  id: string;
}

class DeleteTransactionService {
  public async execute({ id }: Request): Promise<void> {
    const transactionsRepository = getRepository(Transaction);
    const hasTransaction = await transactionsRepository.findOne({
      where: { id },
    });
    if (hasTransaction) {
      await transactionsRepository.delete({ id });
    }
  }
}

export default DeleteTransactionService;

import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  private transactions: Transaction[];

  public async getBalance(): Promise<Balance> {
    this.transactions = await this.find();
    const totals = this.transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'income') acc.income += transaction.value;
        if (transaction.type === 'outcome') acc.outcome += transaction.value;
        return acc;
      },
      {
        income: 0,
        outcome: 0,
      },
    );
    return {
      income: totals.income,
      outcome: totals.outcome,
      total: totals.income - totals.outcome,
    };
  }
}

export default TransactionsRepository;

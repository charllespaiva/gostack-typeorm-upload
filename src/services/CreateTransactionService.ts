// import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

import AppError from '../errors/AppError';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const checkIfCategoryExists = await categoryRepository.findOne({
      where: { title: category },
    });

    const totalBalance = (await transactionRepository.getBalance()).total;

    if (type === 'outcome' && totalBalance < value) {
      throw new AppError(
        'There are no sufficient funds for this transactions',
        400,
      );
    }

    const transaction = transactionRepository.create({
      title,
      value,
      type,
    });

    if (!checkIfCategoryExists) {
      const createCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(createCategory);

      transaction.category_id = createCategory.id;
    } else {
      transaction.category_id = checkIfCategoryExists?.id;
    }

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;

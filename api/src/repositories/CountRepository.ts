import { connection } from '../config/dynamodb';
import { CountEntity } from '../entities/CountEntity';
import { EntityManager, TransactionManager } from '@typedorm/core';

export class CountRepository {
  private entityManager: EntityManager;
  private transactionManger: TransactionManager;

  constructor() {
    this.entityManager = connection.entityManager;
    this.transactionManger = connection.transactionManger;
  }

  async findOne(
    accountId: string,
    countType: string,
  ): Promise<CountEntity | undefined> {
    return await this.entityManager.findOne(CountEntity, {
      account_id: accountId,
      count_type: countType,
    });
  }

  async findAllByAccountId(accountId: string): Promise<CountEntity[]> {
    const result = await this.entityManager.find(CountEntity, {
      account_id: accountId,
    });
    return result.items || [];
  }

  async findAll(): Promise<CountEntity[]> {
    const scanManager = connection.scanManager;
    const result = await scanManager.find(CountEntity);
    return result.items || [];
  }
}

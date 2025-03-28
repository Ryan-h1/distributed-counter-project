import { connection } from '../config/dynamodb';
import { AccountEntity } from '../entities/AccountEntity';
import {
  EntityManager,
  TransactionManager,
  WriteTransaction,
} from '@typedorm/core';
import { CountEntity } from '../entities/CountEntity';
import { COUNTER_TYPE_SERVICES } from '../config/constants';

export class AccountRepository {
  private entityManager: EntityManager;
  private transactionManger: TransactionManager;

  constructor() {
    this.entityManager = connection.entityManager;
    this.transactionManger = connection.transactionManger;
  }

  /**
   * Create an account and initialize a service counter in a transaction
   * @param account The account to create
   * @returns The created account
   */
  async createWithCounter(account: AccountEntity): Promise<AccountEntity> {
    // Create a service counter for this account
    const serviceCounter = new CountEntity();
    serviceCounter.account_id = account.id;
    serviceCounter.count_type = COUNTER_TYPE_SERVICES;
    serviceCounter.count_value = 0;

    // Create a transaction to create both the account and the counter
    const transaction = new WriteTransaction()
      .addCreateItem(account)
      .addCreateItem(serviceCounter);

    try {
      // Execute the transaction
      await this.transactionManger.write(transaction);
      return account;
    } catch (error: any) {
      console.error(
        `Transaction failed in createWithCounter: ${error.message}`,
        {
          accountId: account.id,
          error,
        },
      );
      throw error;
    }
  }

  async findOne(id: string): Promise<AccountEntity | undefined> {
    return await this.entityManager.findOne(AccountEntity, {
      id,
    });
  }

  async update(
    id: string,
    data: Partial<AccountEntity>,
  ): Promise<AccountEntity | undefined> {
    return await this.entityManager.update(AccountEntity, { id }, data);
  }

  async delete(id: string): Promise<void> {
    await this.entityManager.delete(AccountEntity, { id });
  }

  async findAll(): Promise<AccountEntity[]> {
    // Use the connection's scanManager to scan for all accounts
    const scanManager = connection.scanManager;
    const result = await scanManager.find(AccountEntity);
    return result.items || [];
  }
}

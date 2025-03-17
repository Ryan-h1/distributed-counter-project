import { connection, documentClient } from '../config/dynamodb';
import { AccountEntity } from '../entities/AccountEntity';
import { EntityManager } from '@typedorm/core';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

export class AccountRepository {
  private entityManager: EntityManager;

  constructor() {
    this.entityManager = connection.entityManager;
  }

  async create(account: AccountEntity): Promise<AccountEntity> {
    return await this.entityManager.create<AccountEntity>(account);
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

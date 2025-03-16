import { connection } from '../config/dynamodb';
import { ServiceEntity } from '../entities/ServiceEntity';
import { EntityManager, WriteTransaction } from '@typedorm/core';
import { AccountEntity } from '../entities/AccountEntity';

export class ServiceRepository {
  private entityManager: EntityManager;
  private transactionManger = connection.transactionManger;

  constructor() {
    this.entityManager = connection.entityManager;
  }

  async create(service: ServiceEntity): Promise<ServiceEntity> {
    return await this.entityManager.create<ServiceEntity>(service);
  }

  async findOne(id: string): Promise<ServiceEntity | undefined> {
    return await this.entityManager.findOne(ServiceEntity, {
      id,
    });
  }

  async update(
    id: string,
    data: Partial<ServiceEntity>,
  ): Promise<ServiceEntity | undefined> {
    return await this.entityManager.update(ServiceEntity, { id }, data);
  }

  async delete(id: string): Promise<void> {
    await this.entityManager.delete(ServiceEntity, { id });
  }

  async findAll(): Promise<ServiceEntity[]> {
    const result = await this.entityManager.find(ServiceEntity, {});
    return result.items;
  }

  async findAllByOwnerAccountId(
    ownerAccountId: string,
  ): Promise<ServiceEntity[]> {
    const result = await this.entityManager.find(ServiceEntity, {
      owner_account_id: ownerAccountId,
    });
    return result.items;
  }

  /**
   * Create a service and increment the account's service counter in a transaction
   * @param service The service to create
   * @param accountId The account ID
   * @returns The created service
   */
  async createServiceWithCounterIncrement(
    service: ServiceEntity,
    accountId: string,
  ): Promise<ServiceEntity> {
    // Create a transaction to create the service and increment the account's counter
    const transaction = new WriteTransaction()
      .addCreateItem(service)
      .addUpdateItem(
        AccountEntity,
        { id: accountId },
        {
          $ADD: {
            number_of_services: 1,
          },
        },
      );

    // Execute the transaction
    await this.transactionManger.write(transaction);

    return service;
  }

  /**
   * Delete a service and decrement the account's service counter in a transaction
   * @param serviceId The service ID to delete
   * @param accountId The account ID
   */
  async deleteServiceWithCounterDecrement(
    serviceId: string,
    accountId: string,
  ): Promise<void> {
    // Create a transaction to delete the service and decrement the account's counter
    // Using ADD with -1 for atomic decrement
    const transaction = new WriteTransaction()
      .addDeleteItem(ServiceEntity, { id: serviceId })
      .addUpdateItem(
        AccountEntity,
        { id: accountId },
        {
          $ADD: {
            number_of_services: -1,
          },
        },
      );

    // Execute the transaction
    await this.transactionManger.write(transaction);
  }
}

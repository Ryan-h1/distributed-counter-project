import { connection } from '../config/dynamodb';
import { ServiceEntity } from '../entities/ServiceEntity';
import {
  EntityManager,
  TransactionManager,
  WriteTransaction,
} from '@typedorm/core';
import { AccountEntity } from '../entities/AccountEntity';
import { DEFAULT_MAX_SERVICES } from '../config/constants';

export class ServiceRepository {
  private entityManager: EntityManager;
  private transactionManger: TransactionManager;

  constructor() {
    this.entityManager = connection.entityManager;
    this.transactionManger = connection.transactionManger;
  }

  async findOne(
    id: string,
    ownerAccountId: string,
  ): Promise<ServiceEntity | undefined> {
    return await this.entityManager.findOne(ServiceEntity, {
      id,
      owner_account_id: ownerAccountId,
    });
  }

  async update(
    id: string,
    data: Partial<ServiceEntity>,
  ): Promise<ServiceEntity | undefined> {
    return await this.entityManager.update(ServiceEntity, { id }, data);
  }

  async findAll(): Promise<ServiceEntity[]> {
    const scanManager = connection.scanManager;
    const result = await scanManager.find(ServiceEntity);
    return result.items || [];
  }

  async findAllByOwnerAccountId(
    ownerAccountId: string,
  ): Promise<ServiceEntity[]> {
    const allItems: ServiceEntity[] = [];
    let cursor: Record<string, any> | undefined;

    do {
      const result = await this.entityManager.find(
        ServiceEntity,
        {
          owner_account_id: ownerAccountId,
        },
        {
          keyCondition: {
            BEGINS_WITH: 'SERVICE#',
          },
          limit: 1000, // Maximum allowed by DynamoDB
          ...(cursor && { cursor }),
        },
      );

      if (result.items) {
        allItems.push(...result.items);
      }

      cursor = result.cursor;
    } while (cursor);

    return allItems;
  }

  /**
   * Create a service and increment the account's service counter in a transaction
   * @param service The service to create
   * @param accountId The account ID
   * @returns The created service
   */
  async createServiceWithCounterIncrement(
    service: ServiceEntity,
    maxNumberOfServices: number,
  ): Promise<ServiceEntity> {
    // Create a transaction to create the service and increment the account's counter
    const transaction = new WriteTransaction()
      .addCreateItem(service)
      .addUpdateItem(
        AccountEntity,
        { id: service.owner_account_id },
        {
          number_of_services: {
            ADD: 1,
          },
        },
        {
          where: {
            number_of_services: {
              LE: maxNumberOfServices,
            },
          },
        },
      );

    try {
      // Execute the transaction
      await this.transactionManger.write(transaction);
      return service;
    } catch (error: any) {
      console.error(
        `Transaction failed in createServiceWithCounterIncrement: ${error.message}`,
        {
          serviceId: service.id,
          accountId: service.owner_account_id,
          error,
        },
      );
      throw error;
    }
  }

  /**
   * Delete a service and decrement the account's service counter in a transaction
   * @param serviceId The service ID to delete
   * @param accountId The account ID
   */
  async deleteServiceWithCounterDecrement(
    service: ServiceEntity,
  ): Promise<void> {
    // Create a transaction to delete the service and decrement the account's counter
    // Using ADD with -1 for atomic decrement
    const transaction = new WriteTransaction()
      .addDeleteItem(ServiceEntity, {
        id: service.id,
        owner_account_id: service.owner_account_id,
      })
      .addUpdateItem(
        AccountEntity,
        { id: service.owner_account_id },
        {
          number_of_services: {
            ADD: -1,
          },
        },
      );

    try {
      // Execute the transaction
      await this.transactionManger.write(transaction);
    } catch (error: any) {
      console.error(
        `Transaction failed in deleteServiceWithCounterDecrement: ${error.message}`,
        {
          serviceId: service.id,
          accountId: service.owner_account_id,
          error,
        },
      );
      throw error;
    }
  }

  async deleteAllServicesByAccountId(accountId: string): Promise<void> {
    const services = await this.findAllByOwnerAccountId(accountId);

    if (services.length === 0) {
      return;
    }

    // DynamoDB batch operations can only handle 25 items at a time
    const BATCH_SIZE = 25;

    // Process services in batches
    for (let i = 0; i < services.length; i += BATCH_SIZE) {
      const batch = services.slice(i, i + BATCH_SIZE);

      // Create a transaction for this batch
      const transaction = new WriteTransaction();

      // Add delete operations for each service in the batch
      batch.forEach((service) => {
        transaction.addDeleteItem(ServiceEntity, {
          id: service.id,
          owner_account_id: service.owner_account_id,
        });
      });

      // Decrement the counter by the exact number of items in this batch
      transaction.addUpdateItem(
        AccountEntity,
        { id: accountId },
        {
          number_of_services: {
            ADD: -batch.length,
          },
        },
      );

      try {
        // Execute the transaction
        await this.transactionManger.write(transaction);
      } catch (error: any) {
        console.error(
          `Transaction failed in deleteAllServicesByAccountId batch ${
            i / BATCH_SIZE + 1
          }: ${error.message}`,
          {
            accountId,
            batchSize: batch.length,
            error,
          },
        );
        throw error;
      }
    }
  }
}

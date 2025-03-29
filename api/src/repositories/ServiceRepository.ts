import { connection } from '../config/dynamodb';
import { ServiceEntity } from '../entities/ServiceEntity';
import {
  EntityManager,
  TransactionManager,
  WriteTransaction,
} from '@typedorm/core';
import { AccountEntity } from '../entities/AccountEntity';

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
    const service = await this.entityManager.findOne(ServiceEntity, {
      id,
      account_id: ownerAccountId,
    });

    // Don't return deleted services
    if (service && service.deleted) {
      return undefined;
    }

    return service;
  }

  async update(
    id: string,
    data: Partial<ServiceEntity>,
  ): Promise<ServiceEntity | undefined> {
    const service = await this.entityManager.update(
      ServiceEntity,
      { id },
      data,
    );

    // Don't return deleted services
    if (service && service.deleted) {
      return undefined;
    }

    return service;
  }

  async findAll(): Promise<ServiceEntity[]> {
    const scanManager = connection.scanManager;
    const result = await scanManager.find(ServiceEntity);
    // Filter out deleted services
    return (result.items || []).filter((service) => !service.deleted);
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
          account_id: ownerAccountId,
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
        // Filter out deleted services before adding to allItems
        const nonDeletedItems = result.items.filter(
          (service) => !service.deleted,
        );
        allItems.push(...nonDeletedItems);
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
  ): Promise<ServiceEntity> {
    // Create the service
    await this.entityManager.create(service);

    // Update the account's service counter using atomic ADD operation
    await this.entityManager.update(
      AccountEntity,
      { id: service.account_id },
      {
        number_of_services: {
          ADD: 1,
        },
      },
    );

    return service;
  }

  /**
   * Delete a service and decrement the account's service counter in a transaction
   * @param serviceId The service ID to delete
   * @param accountId The account ID
   */
  async deleteServiceWithCounterDecrement(
    service: ServiceEntity,
  ): Promise<void> {
    // 1. Decrement the account's service counter
    try {
      await this.entityManager.update(
        AccountEntity,
        { id: service.account_id },
        {
          number_of_services: {
            ADD: -1,
          },
        },
        {
          // This condition ensures number_of_services is greater than 0 before decrementing
          where: {
            number_of_services: {
              GT: 0,
            },
          },
        },
      );
    } catch (error) {
      // Log the error as info level but continue with deletion
      console.info(
        `Could not decrement service counter for account ${service.account_id}, likely already at 0:`,
        error,
      );
    }

    // 2. Mark the service as deleted
    await this.entityManager.update(
      ServiceEntity,
      { id: service.id, account_id: service.account_id },
      { deleted: true },
    );
  }

  async deleteAllServicesByAccountId(accountId: string): Promise<void> {
    throw new Error('Deprecated');

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

      // Add update operations to mark each service as deleted
      batch.forEach((service) => {
        transaction.addUpdateItem(
          ServiceEntity,
          {
            id: service.id,
            account_id: service.account_id,
          },
          {
            deleted: true,
          },
        );
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

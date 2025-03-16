import { connection } from '../config/dynamodb';
import { ServiceEntity } from '../entities/ServiceEntity';
import { EntityManager } from '@typedorm/core';

export class ServiceRepository {
  private entityManager: EntityManager;

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

  async findAllByOwnerAccountId(ownerAccountId: string): Promise<ServiceEntity[]> {
    const result = await this.entityManager.find(ServiceEntity, {
      owner_account_id: ownerAccountId,
    });
    return result.items;
  }
}

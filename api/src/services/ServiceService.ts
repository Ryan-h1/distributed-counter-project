import { v4 as uuidv4 } from 'uuid';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { ServiceEntity } from '../entities/ServiceEntity';
import { AccountRepository } from '../repositories/AccountRepository';
import { Service, ServiceShape } from '../shapes';
import { t } from 'elysia';
import { CountRepository } from '../repositories/CountRepository';
import { COUNTER_TYPE_SERVICES } from '../config/constants';

// Input validation schemas using Elysia's type system
export const CreateServiceInput = t.Object({
  account_id: ServiceShape.properties.account_id,
  name: ServiceShape.properties.name,
});

export const UpdateServiceInput = t.Object({
  name: t.Optional(ServiceShape.properties.name),
});

export class ServiceService {
  private repository: ServiceRepository;
  private accountRepository: AccountRepository;
  private countRepository: CountRepository;

  constructor() {
    this.repository = new ServiceRepository();
    this.accountRepository = new AccountRepository();
    this.countRepository = new CountRepository();
  }

  async createService(
    input: typeof CreateServiceInput.static,
  ): Promise<Service> {
    const { account_id, name } = input;

    // Check if account exists
    const account = await this.accountRepository.findOne(account_id);
    if (!account) {
      throw new Error('Account not found');
    }
    const eventualConsistencyCounter = await this.countRepository.findOne(
      account_id,
      COUNTER_TYPE_SERVICES,
    );
    if (!eventualConsistencyCounter) {
      throw new Error('Eventual consistency counter not found');
    }
    // The best effort counter may undercount the number of services, so we take the max
    // of the accurate eventual consistency counter and the best effort counter
    const greatestCounter = Math.max(
      account.number_of_services,
      eventualConsistencyCounter.count_value,
    );
    if (greatestCounter >= account.max_number_of_services) {
      throw new Error('Maximum number of services reached for this account');
    }

    // Create service entity
    const service = new ServiceEntity();
    service.id = uuidv4();
    service.account_id = account_id;
    service.name = name;
    service.deleted = false;
    service.create_counter_processed = false;

    // Create the service and increment the counter in a transaction
    const createdService =
      await this.repository.createServiceWithCounterIncrement(service);

    // Return the created service
    return createdService;
  }

  async getService(id: string, ownerAccountId: string): Promise<Service> {
    const service = await this.repository.findOne(id, ownerAccountId);
    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  async updateService(
    id: string,
    data: typeof UpdateServiceInput.static,
  ): Promise<Service> {
    const service = await this.repository.update(id, data);
    if (!service) {
      throw new Error('Service not found');
    }

    return service;
  }

  async deleteService(id: string, ownerAccountId: string): Promise<void> {
    // Get the service to be deleted
    const service = await this.repository.findOne(id, ownerAccountId);
    if (!service) {
      throw new Error('Service not found');
    }

    // Mark service as deleted and decrement the counter in a transaction
    await this.repository.deleteServiceWithCounterDecrement(service);
  }

  async listServices(): Promise<Service[]> {
    return await this.repository.findAll();
  }

  async getServicesByAccountId(accountId: string): Promise<Service[]> {
    return await this.repository.findAllByOwnerAccountId(accountId);
  }

  /**
   * Delete all services associated with an account ID
   * @param accountId The account ID to delete services for
   */
  async deleteAllServicesByAccountId(accountId: string): Promise<void> {
    // Check if account exists
    const account = await this.accountRepository.findOne(accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Mark all services as deleted and update the counter in a transaction
    await this.repository.deleteAllServicesByAccountId(accountId);
  }
}

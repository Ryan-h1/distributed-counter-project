import { v4 as uuidv4 } from 'uuid';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { ServiceEntity } from '../entities/ServiceEntity';
import { AccountRepository } from '../repositories/AccountRepository';
import { Service, ServiceShape } from '../shapes';
import { t } from 'elysia';

// Input validation schemas using Elysia's type system
export const CreateServiceInput = t.Object({
  owner_account_id: ServiceShape.properties.owner_account_id,
  name: ServiceShape.properties.name,
});

export const UpdateServiceInput = t.Object({
  name: t.Optional(ServiceShape.properties.name),
});

export class ServiceService {
  private repository: ServiceRepository;
  private accountRepository: AccountRepository;

  constructor() {
    this.repository = new ServiceRepository();
    this.accountRepository = new AccountRepository();
  }

  async createService(
    input: typeof CreateServiceInput.static,
  ): Promise<Service> {
    const { owner_account_id, name } = input;

    // Check if account exists
    const account = await this.accountRepository.findOne(owner_account_id);
    if (!account) {
      throw new Error('Account not found');
    }

    // Create service entity
    const service = new ServiceEntity();
    service.id = uuidv4();
    service.owner_account_id = owner_account_id;
    service.name = name;

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

    // Get the account to get the current counter value
    const account = await this.accountRepository.findOne(
      service.owner_account_id,
    );
    if (!account) {
      throw new Error('Account not found');
    }

    // Delete the service and decrement the counter in a transaction
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

    // Delete all services and reset the counter in a transaction
    await this.repository.deleteAllServicesByAccountId(accountId);
  }
}

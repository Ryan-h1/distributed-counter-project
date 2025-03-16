import { v4 as uuidv4 } from 'uuid';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { ServiceShape } from '../shapes';
import { z } from 'zod';
import { ServiceEntity } from '../entities/ServiceEntity';
import { AccountRepository } from '../repositories/AccountRepository';

const CreateServiceInput = z.object({
  owner_account_id: ServiceShape.shape.owner_account_id,
  name: ServiceShape.shape.name,
});

const UpdateServiceInput = z.object({
  name: ServiceShape.shape.name.optional(),
});

export class ServiceService {
  private repository: ServiceRepository;
  private accountRepository: AccountRepository;

  constructor() {
    this.repository = new ServiceRepository();
    this.accountRepository = new AccountRepository();
  }

  async createService(input: unknown) {
    // Validate input
    const { owner_account_id, name } = CreateServiceInput.parse(input);

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

    // Validate complete entity before saving
    ServiceShape.parse(service);

    // Create the service and increment the counter in a transaction
    const createdService =
      await this.repository.createServiceWithCounterIncrement(
        service,
        owner_account_id,
      );

    // Return the created service
    return createdService;
  }

  async getService(id: string) {
    // Validate UUID format
    z.string().uuid().parse(id);

    const service = await this.repository.findOne(id);
    if (!service) {
      throw new Error('Service not found');
    }

    // Validate retrieved data
    return ServiceShape.parse(service);
  }

  async updateService(id: string, input: unknown) {
    // Validate UUID format and input data
    z.string().uuid().parse(id);
    const data = UpdateServiceInput.parse(input);

    const service = await this.repository.update(id, data);
    if (!service) {
      throw new Error('Service not found');
    }

    // Validate updated data
    return ServiceShape.parse(service);
  }

  async deleteService(id: string) {
    // Validate UUID format
    z.string().uuid().parse(id);

    // Get the service to be deleted
    const service = await this.repository.findOne(id);
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
    await this.repository.deleteServiceWithCounterDecrement(
      id,
      service.owner_account_id,
    );
  }

  async listServices() {
    const services = await this.repository.findAll();

    // Validate each service in the list
    return z.array(ServiceShape).parse(services);
  }

  async getServicesByAccountId(accountId: string) {
    // Validate UUID format
    z.string().uuid().parse(accountId);

    const services = await this.repository.findAllByOwnerAccountId(accountId);

    // Validate each service in the list
    return z.array(ServiceShape).parse(services);
  }
}

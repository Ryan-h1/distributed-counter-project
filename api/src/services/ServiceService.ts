import { v4 as uuidv4 } from 'uuid';
import { ServiceRepository } from '../repositories/ServiceRepository';
import { ServiceShape } from '../shapes';
import { z } from 'zod';
import { ServiceEntity } from '../entities/ServiceEntity';

const CreateServiceInput = z.object({
  owner_account_id: z.string().uuid(),
  name: z.string().min(1).max(100),
});

const UpdateServiceInput = z.object({
  name: z.string().min(1).max(100).optional(),
});

export class ServiceService {
  private repository: ServiceRepository;

  constructor() {
    this.repository = new ServiceRepository();
  }

  async createService(input: unknown) {
    // Validate input
    const { owner_account_id, name } = CreateServiceInput.parse(input);

    // Create service entity
    const service = new ServiceEntity();
    service.id = uuidv4();
    service.owner_account_id = owner_account_id;
    service.name = name;

    // Validate complete entity before saving
    ServiceShape.parse(service);

    return await this.repository.create(service);
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

    await this.repository.delete(id);
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

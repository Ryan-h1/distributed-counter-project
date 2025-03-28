import { CountRepository } from '../repositories/CountRepository';
import { CountEntity } from '../entities/CountEntity';
import { Count } from '../shapes';
import { t } from 'elysia';

export class CountService {
  private repository: CountRepository;

  constructor() {
    this.repository = new CountRepository();
  }

  async getCount(accountId: string): Promise<Count[]> {
    return await this.repository.findAllByAccountId(accountId);
  }

  async listCounts(): Promise<Count[]> {
    return await this.repository.findAll();
  }
}

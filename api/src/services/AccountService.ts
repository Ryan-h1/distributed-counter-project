import { v4 as uuidv4 } from 'uuid';
import { AccountRepository } from '../repositories/AccountRepository';
import { AccountShape } from '../shapes';
import { z } from 'zod';
import { AccountEntity } from '../entities/AccountEntity';

// Input validation schemas
const CreateAccountInput = z.object({
  username: AccountShape.shape.username,
});

const UpdateAccountInput = z.object({
  username: AccountShape.shape.username.optional(),
  number_of_services: AccountShape.shape.number_of_services.optional(),
});

export class AccountService {
  private repository: AccountRepository;

  constructor() {
    this.repository = new AccountRepository();
  }

  async createAccount(input: unknown) {
    // Validate input
    const { username } = CreateAccountInput.parse(input);

    // Create account entity
    const account = new AccountEntity();
    account.id = uuidv4();
    account.username = username;
    account.number_of_services = 0;

    // Validate complete entity before saving
    AccountShape.parse(account);

    return await this.repository.create(account);
  }

  async getAccount(id: string) {
    // Validate UUID format
    z.string().uuid().parse(id);

    const account = await this.repository.findOne(id);
    if (!account) {
      throw new Error('Account not found');
    }

    // Validate retrieved data
    return AccountShape.parse(account);
  }

  async updateAccount(id: string, input: unknown) {
    // Validate UUID format and input data
    z.string().uuid().parse(id);
    const data = UpdateAccountInput.parse(input);

    const account = await this.repository.update(id, data);
    if (!account) {
      throw new Error('Account not found');
    }

    // Validate updated data
    return AccountShape.parse(account);
  }

  async deleteAccount(id: string) {
    // Validate UUID format
    z.string().uuid().parse(id);

    await this.repository.delete(id);
  }

  async listAccounts() {
    const accounts = await this.repository.findAll();

    // Validate each account in the list
    return z.array(AccountShape).parse(accounts);
  }
}

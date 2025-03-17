import { v4 as uuidv4 } from 'uuid';
import { AccountRepository } from '../repositories/AccountRepository';
import { AccountEntity } from '../entities/AccountEntity';
import { Account, AccountShape } from '../shapes';
import { t } from 'elysia';

// Input validation schemas using Elysia's type system
export const CreateAccountInput = t.Object({
  username: AccountShape.properties.username,
});

export const UpdateAccountInput = t.Object({
  username: t.Optional(AccountShape.properties.username),
  number_of_services: t.Optional(AccountShape.properties.number_of_services),
});

export class AccountService {
  private repository: AccountRepository;

  constructor() {
    this.repository = new AccountRepository();
  }

  async createAccount(
    input: typeof CreateAccountInput.static,
  ): Promise<Account> {
    // Create account entity
    const account = new AccountEntity();
    account.id = uuidv4();
    account.username = input.username;
    account.number_of_services = 0;

    return await this.repository.create(account);
  }

  async getAccount(id: string): Promise<Account> {
    const account = await this.repository.findOne(id);
    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async updateAccount(
    id: string,
    data: typeof UpdateAccountInput.static,
  ): Promise<Account> {
    const account = await this.repository.update(id, data);
    if (!account) {
      throw new Error('Account not found');
    }

    return account;
  }

  async deleteAccount(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async listAccounts(): Promise<Account[]> {
    return await this.repository.findAll();
  }
}

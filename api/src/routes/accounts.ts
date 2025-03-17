import { Elysia, t } from 'elysia';
import {
  AccountService,
  CreateAccountInput,
  UpdateAccountInput,
} from '../services/AccountService';
import { ServiceService } from '../services/ServiceService';
import { AccountShape, ServiceShape } from '../shapes';

const accountService = new AccountService();
const serviceService = new ServiceService();

// Success response
const SuccessResponse = t.Object({
  success: t.Boolean(),
});

export const accountRoutes = new Elysia({ prefix: '/accounts' })
  .post(
    '/',
    async ({ body }) => {
      return await accountService.createAccount(body);
    },
    {
      body: CreateAccountInput,
      response: AccountShape,
      detail: {
        summary: 'Create a new account',
        tags: ['Accounts'],
      },
    },
  )
  .get(
    '/:id',
    async ({ params: { id } }) => {
      return await accountService.getAccount(id);
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: AccountShape,
      detail: {
        summary: 'Get account by ID',
        tags: ['Accounts'],
      },
    },
  )
  .get(
    '/',
    async () => {
      return await accountService.listAccounts();
    },
    {
      response: t.Array(AccountShape),
      detail: {
        summary: 'List all accounts',
        tags: ['Accounts'],
      },
    },
  )
  .get(
    '/:id/services',
    async ({ params: { id } }) => {
      return await serviceService.getServicesByAccountId(id);
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: t.Array(ServiceShape),
      detail: {
        summary: 'Get services for an account',
        tags: ['Accounts', 'Services'],
      },
    },
  )
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      return await accountService.updateAccount(id, body);
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: UpdateAccountInput,
      response: AccountShape,
      detail: {
        summary: 'Update an account',
        tags: ['Accounts'],
      },
    },
  )
  .delete(
    '/:id',
    async ({ params: { id } }) => {
      await accountService.deleteAccount(id);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: SuccessResponse,
      detail: {
        summary: 'Delete an account',
        tags: ['Accounts'],
      },
    },
  )
  .delete(
    '/:id/services',
    async ({ params: { id } }) => {
      await serviceService.deleteAllServicesByAccountId(id);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: SuccessResponse,
      detail: {
        summary: 'Delete all services for an account',
        tags: ['Accounts', 'Services'],
      },
    },
  );

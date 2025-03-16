import { Elysia } from 'elysia';
import { AccountService } from '../services/AccountService';
import { ServiceService } from '../services/ServiceService';

const accountService = new AccountService();
const serviceService = new ServiceService();

export const accountRoutes = new Elysia()
  .post('/accounts', async ({ body }) => {
    return await accountService.createAccount(body);
  })
  .get('/accounts/:id', async ({ params: { id } }) => {
    return await accountService.getAccount(id);
  })
  .get('/accounts', async () => {
    return await accountService.listAccounts();
  })
  .get('/accounts/:id/services', async ({ params: { id } }) => {
    return await serviceService.getServicesByAccountId(id);
  })
  .put('/accounts/:id', async ({ params: { id }, body }) => {
    return await accountService.updateAccount(id, body);
  })
  .delete('/accounts/:id', async ({ params: { id } }) => {
    await accountService.deleteAccount(id);
    return { success: true };
  });

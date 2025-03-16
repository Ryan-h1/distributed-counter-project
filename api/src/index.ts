import { Elysia } from 'elysia';
import { accountRoutes } from './routes/accounts';
import { serviceRoutes } from './routes/services';

const app = new Elysia()
  .use(accountRoutes)
  .use(serviceRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

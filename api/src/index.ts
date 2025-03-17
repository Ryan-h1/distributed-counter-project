import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { accountRoutes } from './routes/accounts';
import { serviceRoutes } from './routes/services';
import { healthRoutes } from './routes/health';

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Distributed Counter API',
          version: '1.0.0',
          description:
            'API for managing accounts and services with distributed counters',
        },
      },
    }),
  )
  .use(accountRoutes)
  .use(serviceRoutes)
  .use(healthRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${
    app.server?.port
  } at time ${new Date().toISOString()}`,
);
console.log(`📚 Swagger documentation available at /swagger`);

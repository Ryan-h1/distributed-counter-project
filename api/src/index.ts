import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { accountRoutes } from './routes/accounts';
import { serviceRoutes } from './routes/services';
import { healthRoutes } from './routes/health';
import { countRoutes } from './routes/counts';
import logixlysia from 'logixlysia';

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
  .use(
    logixlysia({
      config: {
        showStartupMessage: false,
        timestamp: {
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
        ip: true,
        logFilePath: './logs/api.log',
        customLogFormat:
          '🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip}',
        // Uncomment to only show errors and warnings in the logs
        // logFilter: {
        //   level: ['ERROR', 'WARNING'],
        // },
      },
    }),
  )
  .onError(({ code, error }) => {
    console.error(error);
    return new Response(error.toString());
  })
  .use(accountRoutes)
  .use(serviceRoutes)
  .use(countRoutes)
  .use(healthRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${
    app.server?.port
  } at time ${new Date().toISOString()}`,
);
console.log(`📚 Swagger documentation available at /swagger`);

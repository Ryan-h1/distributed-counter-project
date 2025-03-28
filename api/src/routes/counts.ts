import { Elysia, t } from 'elysia';
import { CountService } from '../services/CountService';
import { CountShape } from '../shapes';
import { COUNTER_TYPE_SERVICES } from '../config/constants';

const countService = new CountService();

export const countRoutes = new Elysia({ prefix: '/counts' })
  .get(
    '/:accountId',
    async ({ params: { accountId } }) => {
      return await countService.getCount(accountId);
    },
    {
      params: t.Object({ accountId: t.String({ format: 'uuid' }) }),
      response: t.Array(CountShape),
      detail: {
        summary: 'Get all counts for an account',
        tags: ['Counts'],
      },
    },
  )
  .get(
    '/',
    async () => {
      return await countService.listCounts();
    },
    {
      response: t.Array(CountShape),
      detail: {
        summary: 'List all counts',
        tags: ['Counts'],
      },
    },
  );

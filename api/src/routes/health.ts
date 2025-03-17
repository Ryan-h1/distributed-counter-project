import { Elysia, t } from 'elysia';

// Health response schema
const HealthResponse = t.Object({
  status: t.String(),
});

export const healthRoutes = new Elysia().get('/health', () => {
  return {
    status: 'ok',
  };
}, {
  response: HealthResponse,
  detail: {
    summary: 'Check API health status',
    tags: ['Health']
  }
});

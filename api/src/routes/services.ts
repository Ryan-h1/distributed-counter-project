import { Elysia, t } from 'elysia';
import {
  ServiceService,
  CreateServiceInput,
  UpdateServiceInput,
} from '../services/ServiceService';
import { ServiceShape } from '../shapes';

const serviceService = new ServiceService();

// Success response
const SuccessResponse = t.Object({
  success: t.Boolean(),
});

export const serviceRoutes = new Elysia({ prefix: '/services' })
  .post(
    '/',
    async ({ body }) => {
      return await serviceService.createService(body);
    },
    {
      body: CreateServiceInput,
      response: ServiceShape,
      detail: {
        summary: 'Create a new service',
        tags: ['Services'],
      },
    },
  )
  .get(
    '/:id',
    async ({ params: { id }, query: { ownerAccountId } }) => {
      return await serviceService.getService(id, ownerAccountId);
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: ServiceShape,
      detail: {
        summary: 'Get service by ID',
        tags: ['Services'],
      },
    },
  )
  .get(
    '/',
    async () => {
      return await serviceService.listServices();
    },
    {
      response: t.Array(ServiceShape),
      detail: {
        summary: 'List all services',
        tags: ['Services'],
      },
    },
  )
  .put(
    '/:id',
    async ({ params: { id }, body }) => {
      return await serviceService.updateService(id, body);
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      body: UpdateServiceInput,
      response: ServiceShape,
      detail: {
        summary: 'Update a service',
        tags: ['Services'],
      },
    },
  )
  .delete(
    '/:id',
    async ({ params: { id }, query: { ownerAccountId } }) => {
      await serviceService.deleteService(id, ownerAccountId);
      return { success: true };
    },
    {
      params: t.Object({
        id: t.String({ format: 'uuid' }),
      }),
      response: SuccessResponse,
      detail: {
        summary: 'Delete a service',
        tags: ['Services'],
      },
    },
  );

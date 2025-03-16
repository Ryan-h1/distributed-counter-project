import { Elysia } from 'elysia';
import { ServiceService } from '../services/ServiceService';

const serviceService = new ServiceService();

export const serviceRoutes = new Elysia()
  .post('/services', async ({ body }) => {
    return await serviceService.createService(body);
  })
  .get('/services/:id', async ({ params: { id } }) => {
    return await serviceService.getService(id);
  })
  .get('/services', async () => {
    return await serviceService.listServices();
  })
  .put('/services/:id', async ({ params: { id }, body }) => {
    return await serviceService.updateService(id, body);
  })
  .delete('/services/:id', async ({ params: { id } }) => {
    await serviceService.deleteService(id);
    return { success: true };
  }); 
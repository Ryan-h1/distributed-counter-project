import { t } from 'elysia';
import { DEFAULT_MAX_SERVICES } from './config/constants';

// Account schema
export const AccountShape = t.Object({
  id: t.String({ format: 'uuid' }),
  username: t.String({ minLength: 1, maxLength: 50 }),
  number_of_services: t.Integer({ minimum: 0 }),
  max_number_of_services: t.Integer({
    default: DEFAULT_MAX_SERVICES,
    minimum: 0,
  }),
  created_at: t.String({ format: 'date-time' }),
  updated_at: t.String({ format: 'date-time' }),
});

export type Account = typeof AccountShape.static;

// Service schema
export const ServiceShape = t.Object({
  id: t.String({ format: 'uuid' }),
  owner_account_id: t.String({ format: 'uuid' }),
  name: t.String({ minLength: 1, maxLength: 100 }),
  created_at: t.String({ format: 'date-time' }),
  updated_at: t.String({ format: 'date-time' }),
});

export type Service = typeof ServiceShape.static;

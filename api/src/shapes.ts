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
});

export type Account = typeof AccountShape.static;

// Service schema
export const ServiceShape = t.Object({
  id: t.String({ format: 'uuid' }),
  account_id: t.String({ format: 'uuid' }),
  name: t.String({ minLength: 1, maxLength: 100 }),
  created_at: t.String({ format: 'date-time' }),
  deleted: t.Boolean({ default: false }),
  create_counter_processed: t.Boolean({ default: false }),
  delete_counter_processed: t.Boolean({ default: false }),
});

export type Service = typeof ServiceShape.static;

// Counter schema
export const CountShape = t.Object({
  account_id: t.String({ format: 'uuid' }),
  count_type: t.String({ minLength: 1, maxLength: 50 }),
  count_value: t.Integer({ default: 0 }),
  created_at: t.String({ format: 'date-time' }),
});

export type Count = typeof CountShape.static;

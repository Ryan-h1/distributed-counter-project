import { z } from 'zod';

// Account schema
export const AccountShape = z.object({
  id: z.string().uuid(),
  username: z.string().min(1).max(50),
  number_of_services: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Account = z.infer<typeof AccountShape>;

// Service schema
export const ServiceShape = z.object({
  id: z.string().uuid(),
  owner_account_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type Service = z.infer<typeof ServiceShape>;

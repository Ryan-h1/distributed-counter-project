import {
  Entity,
  Attribute,
  AutoGenerateAttribute,
  AUTO_GENERATE_ATTRIBUTE_STRATEGY,
} from '@typedorm/common';
import { Account } from '../shapes';
import { DEFAULT_MAX_SERVICES } from '../config/constants';

@Entity({
  name: 'Account',
  primaryKey: {
    partitionKey: 'ACCOUNT#{{id}}',
    sortKey: 'METADATA',
  },
})
export class AccountEntity implements Account {
  @Attribute()
  id!: string;

  @Attribute()
  username!: string;

  @Attribute()
  number_of_services!: number;

  @Attribute()
  max_number_of_services: number = DEFAULT_MAX_SERVICES;

  @Attribute()
  service_limit!: number;

  @AutoGenerateAttribute({
    strategy: AUTO_GENERATE_ATTRIBUTE_STRATEGY.ISO_DATE,
  })
  created_at!: string;

  @AutoGenerateAttribute({
    strategy: AUTO_GENERATE_ATTRIBUTE_STRATEGY.ISO_DATE,
  })
  updated_at!: string;
}

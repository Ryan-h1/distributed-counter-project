import {
  Entity,
  Attribute,
  AutoGenerateAttribute,
  AUTO_GENERATE_ATTRIBUTE_STRATEGY,
} from '@typedorm/common';
import { Service } from '../shapes';

@Entity({
  name: 'Service',
  primaryKey: {
    partitionKey: 'ACCOUNT#{{account_id}}',
    sortKey: 'SERVICE#{{id}}',
  },
})
export class ServiceEntity implements Service {
  @Attribute()
  id!: string;

  @Attribute()
  account_id!: string;

  @Attribute()
  name!: string;

  @AutoGenerateAttribute({
    strategy: AUTO_GENERATE_ATTRIBUTE_STRATEGY.ISO_DATE,
  })
  created_at!: string;

  @Attribute()
  deleted!: boolean;

  @Attribute()
  create_counter_processed!: boolean;
}

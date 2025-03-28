import {
  Entity,
  AutoGenerateAttribute,
  Attribute,
  AUTO_GENERATE_ATTRIBUTE_STRATEGY,
} from '@typedorm/common';

@Entity({
  name: 'count',
  primaryKey: {
    partitionKey: 'ACCOUNT#{{account_id}}',
    sortKey: 'COUNT#{{count_type}}',
  },
})
export class CountEntity {
  @Attribute()
  account_id!: string;

  @Attribute()
  count_type!: string;

  @Attribute()
  count_value!: number;

  @AutoGenerateAttribute({
    strategy: AUTO_GENERATE_ATTRIBUTE_STRATEGY.ISO_DATE,
  })
  created_at!: string;
}

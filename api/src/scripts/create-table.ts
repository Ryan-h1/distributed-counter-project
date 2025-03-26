import { CreateTableCommand } from '@aws-sdk/client-dynamodb';
import { dynamoDBClient } from '../config/dynamodb';

async function createTable() {
  const command = new CreateTableCommand({
    TableName: 'distributed-counter',
    AttributeDefinitions: [
      {
        AttributeName: 'PK',
        AttributeType: 'S',
      },
      {
        AttributeName: 'SK',
        AttributeType: 'S',
      },
    ],
    KeySchema: [
      {
        AttributeName: 'PK',
        KeyType: 'HASH',
      },
      {
        AttributeName: 'SK',
        KeyType: 'RANGE',
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 10000,
      WriteCapacityUnits: 10000,
    },
    StreamSpecification: {
      StreamEnabled: true,
      StreamViewType: 'NEW_AND_OLD_IMAGES'
    }
  });

  try {
    const response = await dynamoDBClient.send(command);
    console.log('Table created successfully:', response);
  } catch (error: any) {
    if (error?.name === 'ResourceInUseException') {
      console.log('Table already exists');
    } else {
      console.error('Error creating table:', error);
    }
  }
}

createTable();

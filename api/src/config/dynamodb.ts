import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createConnection } from '@typedorm/core';
import { DocumentClientV3 } from '@typedorm/document-client';
import { Table } from '@typedorm/common';
import { AccountEntity } from '../entities/AccountEntity';
import { ServiceEntity } from '../entities/ServiceEntity';
import { CountEntity } from '../entities/CountEntity';

// Create DynamoDB client
export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
  requestHandler: {
    abortSignal: AbortSignal.timeout(3000), // 3 second timeout
  },
});

// Create DocumentClient
const documentClient = new DocumentClientV3(dynamoDBClient);

// Create table definition
const table = new Table({
  name: 'distributed-counter',
  partitionKey: 'PK',
  sortKey: 'SK',
});

// Create TypeDORM connection
export const connection = createConnection({
  name: 'default',
  table,
  entities: [AccountEntity, ServiceEntity, CountEntity],
  documentClient,
});

// Export the document client for direct DynamoDB operations if needed
export { documentClient };

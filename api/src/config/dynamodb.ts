import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createConnection } from '@typedorm/core';
import { DocumentClientV3 } from '@typedorm/document-client';
import { Table } from '@typedorm/common';
import { AccountEntity } from '../entities/AccountEntity';
import { ServiceEntity } from '../entities/ServiceEntity';

// Create DynamoDB client
export const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'local',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
  maxAttempts: 0,
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
  entities: [AccountEntity, ServiceEntity],
  documentClient,
});

// Export the document client for direct DynamoDB operations if needed
export { documentClient };

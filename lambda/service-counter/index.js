'use strict';
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');

const logger = {
  info: (message) => console.log(message),
  error: (message) => console.error(message),
  debug: (message) => {
    if (process.env.DEBUG === 1) {
      console.log(
        `[DEBUG] ${
          typeof message === 'object' ? JSON.stringify(message) : message
        }`,
      );
    }
  },
};

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || `http://localhost:4566`,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

const dynamodb = DynamoDBDocumentClient.from(client);

exports.handler = async (event, context) => {
  logger.info(`Processing ${event.Records.length} records`);
  // Only log environment in debug mode
  logger.debug('Environment:');
  logger.debug(process.env);

  try {
    // Process records sequentially to ensure proper error handling
    for (const record of event.Records) {
      // We already have filter criteria in AWS, but double-check for safety
      const sortKey = record.dynamodb.Keys.SK.S;

      if (!sortKey) {
        throw new Error('No sort key');
      }
      if (!sortKey.startsWith('SERVICE#')) {
        throw new Error('Sort key indicates that this is not a service');
      }

      const serviceId = sortKey.replace('SERVICE#', '');
      const accountId = record.dynamodb.Keys.PK.S.replace('ACCOUNT#', '');
      const newService = record.dynamodb.NewImage;
      if (!serviceId) {
        throw new Error('No service ID');
      }
      if (!accountId) {
        throw new Error('No account ID');
      }
      if (!newService) {
        throw new Error('Expected a non-null new service image');
      }

      if (record.eventName === 'INSERT') {
        const command = new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: process.env.TABLE_NAME || 'distributed-counter',
                Key: {
                  PK: `ACCOUNT#${accountId}`,
                  SK: `SERVICE#${serviceId}`,
                },
                UpdateExpression: 'SET create_counter_processed = :true',
                ConditionExpression: 'create_counter_processed = :false',
                ExpressionAttributeValues: {
                  ':true': true,
                  ':false': false,
                },
              },
            },
            {
              Update: {
                TableName: process.env.TABLE_NAME || 'distributed-counter',
                Key: {
                  PK: `ACCOUNT#${accountId}`,
                  SK: 'COUNT#SERVICES',
                },
                UpdateExpression: 'ADD count_value :inc',
                ExpressionAttributeValues: {
                  ':inc': 1,
                },
              },
            },
          ],
        });

        logger.debug('Transaction params:');
        logger.debug(command);

        try {
          await dynamodb.send(command);
          logger.info(
            `Counter successfully incremented for service: ${serviceId}`,
          );
        } catch (error) {
          if (
            error.name === 'TransactionCanceledException' &&
            error.message &&
            error.message.includes('ConditionalCheckFailed')
          ) {
            logger.info(
              `Service ${serviceId} already processed. Skipping counter update.`,
            );
          } else {
            logger.error('Failed to increment counter:', error);
            throw error;
          }
        }
      } else if (record.eventName === 'MODIFY') {
        // If deleted is set to true and delete_counter_processed is false, decrement the counter
        if (newService.deleted.BOOL !== true) {
          logger.info(
            `Skipping service delete because deleted is not true: ${JSON.stringify(
              newService.deleted,
            )}`,
          );
          continue;
        }

        const command = new TransactWriteCommand({
          TransactItems: [
            {
              Delete: {
                TableName: process.env.TABLE_NAME || 'distributed-counter',
                Key: {
                  PK: `ACCOUNT#${accountId}`,
                  SK: `SERVICE#${serviceId}`,
                },
                ConditionExpression: 'attribute_exists(PK)',
              },
            },
            {
              Update: {
                TableName: process.env.TABLE_NAME || 'distributed-counter',
                Key: {
                  PK: `ACCOUNT#${accountId}`,
                  SK: 'COUNT#SERVICES',
                },
                UpdateExpression: 'ADD count_value :dec',
                ExpressionAttributeValues: {
                  ':dec': -1,
                },
              },
            },
          ],
        });

        logger.debug('Transaction params:');
        logger.debug(command);

        try {
          await dynamodb.send(command);
          logger.info(
            `Counter successfully decremented for service: ${serviceId}`,
          );
        } catch (error) {
          if (
            error.name === 'TransactionCanceledException' &&
            error.message &&
            error.message.includes('ConditionalCheckFailed')
          ) {
            logger.info(
              `Service ${serviceId} already processed. Skipping counter update.`,
            );
          } else {
            logger.error('Failed to decrement counter:', error);
            throw error;
          }
        }
      }
    }

    return `Successfully processed ${event.Records.length} records.`;
  } catch (error) {
    logger.error('Error processing records:');
    logger.error(error);
    // Throwing the error will cause Lambda to retry the event
    throw error;
  }
};

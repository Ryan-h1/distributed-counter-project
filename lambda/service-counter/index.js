'use strict';
const AWS = require('aws-sdk');

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

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || `http://localhost:4566`,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

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

      if (record.eventName === 'INSERT') {
        const newService = record.dynamodb.NewImage;
        if (!newService) {
          throw new Error('Expected a non-null new service image');
        }

        // 1. Conditionally updates the service to mark it as processed (only if not already processed)
        // 2. Increments the counter for this account
        const params = {
          TransactItems: [
            {
              // First operation: Mark the service record as processed
              Update: {
                TableName: process.env.TABLE_NAME || 'distributed-counter',
                Key: {
                  // Using the correct composite keys based on your entity definition
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
              // Second operation: Increment the counter
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
        };

        // Log parameters for debugging
        logger.debug('Transaction params:');
        logger.debug(params);

        try {
          // Execute the transaction
          await dynamodb.transactWrite(params).promise();
          logger.info('Counter successfully updated for service:', serviceId);
        } catch (error) {
          // If the error is a ConditionalCheckFailedException, it means another Lambda
          // instance already processed it.
          if (
            error.code === 'TransactionCanceledException' &&
            error.message &&
            error.message.includes('ConditionalCheckFailed')
          ) {
            logger.info(
              `Service ${serviceId} already processed. Skipping counter update.`,
            );
          } else {
            // Any other error should be re-thrown to trigger Lambda retry
            logger.error('Failed to update counter:', error);
            throw error;
          }
        }
      } else if (record.eventName === 'MODIFY') {
        // If delete is set to true and delete_counter_processed is false, decrement the counter
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

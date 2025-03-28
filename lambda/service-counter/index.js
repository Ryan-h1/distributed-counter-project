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
        if (newService) {
          logger.info(`Service Created - ID: ${serviceId}`);

          // Increment the counter for this account
          const params = {
            TableName: process.env.TABLE_NAME || 'distributed-counter',
            Key: {
              PK: `ACCOUNT#${accountId}`,
              SK: 'COUNT#SERVICES',
            },
            UpdateExpression: 'ADD count_value :inc',
            ExpressionAttributeValues: {
              ':inc': 1,
            },
            ReturnValues: 'ALL_NEW',
          };

          // Log parameters for debugging
          logger.debug('Update params:');
          logger.debug(params);
          logger.debug('DynamoDB config:');
          logger.debug(AWS.config.dynamodb);

          // Use await to ensure we handle errors properly
          await dynamodb.update(params).promise();
          logger.info('Counter updated successfully for service:', serviceId);
        }
      } else if (record.eventName === 'REMOVE') {
        const oldService = record.dynamodb.OldImage;
        if (oldService) {
          logger.info(`Service Removed - ID: ${serviceId}`);
          // Your logic for handling service deletion
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

import { DynamoDBStreamEvent, Context } from 'aws-lambda';

export const handler = async (
  event: DynamoDBStreamEvent,
  context: Context,
): Promise<void> => {
  // Log function invocation
  console.log('Lambda function invoked with event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify({
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    awsRequestId: context.awsRequestId,
    memoryLimitInMB: context.memoryLimitInMB,
  }));
  
  // Process stream records
  const recordCount = event.Records?.length || 0;
  console.log(`Processing ${recordCount} records`);
  
  for (const record of event.Records || []) {
    // Only process INSERT events (new services)
    if (record.eventName === 'INSERT') {
      const newService = record.dynamodb?.NewImage;
      if (newService) {
        console.log('New Service Created:', {
          id: newService.id?.S,
          name: newService.name?.S,
          ownerAccountId: newService.owner_account_id?.S,
          createdAt: newService.created_at?.S,
        });
      }
    }
  }
};

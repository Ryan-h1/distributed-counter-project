#!/bin/bash
set -e

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1
ENDPOINT="--endpoint-url=http://localhost:4566"

echo "Setting up DynamoDB Stream trigger for Lambda with LocalStack..."

# First, make sure the Lambda function is deployed
echo "Checking if Lambda function exists..."
if ! aws $ENDPOINT lambda get-function --function-name hello-function &>/dev/null; then
  echo "Lambda function doesn't exist. Please run the deploy.sh script first."
  exit 1
fi

# Check if streams are already enabled
echo "Checking if streams are enabled on the table..."
TABLE_INFO=$(aws $ENDPOINT dynamodb describe-table --table-name distributed-counter)
STREAM_ENABLED=$(echo "$TABLE_INFO" | jq -r '.Table.StreamSpecification.StreamEnabled')

if [ "$STREAM_ENABLED" != "true" ]; then
  # Enable streams on the table
  echo "Enabling streams on the DynamoDB table..."
  aws $ENDPOINT dynamodb update-table \
    --table-name distributed-counter \
    --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES
  
  # Wait for stream to be ready
  echo "Waiting for stream to be ready..."
  sleep 5
else
  echo "Streams are already enabled on the table."
fi

# Get the stream ARN
STREAM_ARN=$(echo "$TABLE_INFO" | jq -r '.Table.LatestStreamArn')
echo "Stream ARN: $STREAM_ARN"

if [ -z "$STREAM_ARN" ] || [ "$STREAM_ARN" = "null" ]; then
  echo "ERROR: Failed to get stream ARN. Refreshing table info..."
  TABLE_INFO=$(aws $ENDPOINT dynamodb describe-table --table-name distributed-counter)
  STREAM_ARN=$(echo "$TABLE_INFO" | jq -r '.Table.LatestStreamArn')
  
  if [ -z "$STREAM_ARN" ] || [ "$STREAM_ARN" = "null" ]; then
    echo "ERROR: Still failed to get stream ARN. Exiting."
    exit 1
  fi
  
  echo "Updated Stream ARN: $STREAM_ARN"
fi

# Verify stream exists by describing it
echo "Verifying stream exists..."
aws $ENDPOINT dynamodbstreams describe-stream --stream-arn $STREAM_ARN || {
  echo "ERROR: Stream does not exist or is not accessible."
  exit 1
}

# Get Lambda function ARN
LAMBDA_ARN=$(aws $ENDPOINT lambda get-function --function-name hello-function | jq -r '.Configuration.FunctionArn')
echo "Lambda ARN: $LAMBDA_ARN"

# Remove any existing event source mappings to avoid conflicts
echo "Removing any existing event source mappings..."
EXISTING_MAPPINGS=$(aws $ENDPOINT lambda list-event-source-mappings --function-name hello-function)
MAPPING_UUIDS=$(echo $EXISTING_MAPPINGS | jq -r '.EventSourceMappings[].UUID')

for uuid in $MAPPING_UUIDS; do
  echo "Deleting mapping $uuid..."
  aws $ENDPOINT lambda delete-event-source-mapping --uuid $uuid
done

# Create new event source mapping
echo "Creating event source mapping..."
aws $ENDPOINT lambda create-event-source-mapping \
  --function-name hello-function \
  --event-source-arn $STREAM_ARN \
  --starting-position LATEST \
  --batch-size 1

# Add permission for DynamoDB to invoke Lambda
echo "Adding Lambda permission..."
aws $ENDPOINT lambda add-permission \
  --function-name hello-function \
  --statement-id dynamodb-stream-trigger \
  --action lambda:InvokeFunction \
  --principal dynamodb.amazonaws.com \
  --source-arn $STREAM_ARN 2>/dev/null || true

echo "Setup complete!"
echo "The Lambda function will now log when new services are created."
echo ""
echo "To test:"
echo "1. Create a new service in your application or run ./test-trigger.sh"
echo "2. Check the Lambda logs: aws $ENDPOINT logs tail /aws/lambda/hello-function --follow" 
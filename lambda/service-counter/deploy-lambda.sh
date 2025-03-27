#!/bin/bash

export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1

ENDPOINT="http://localhost:4566"
TABLE_NAME="distributed-counter"
FUNCTION_NAME="service-counter"
REGION="us-east-1"

SET_ENDPOINT="--endpoint-url=$ENDPOINT"
SET_FUNCTION_NAME="--function-name $FUNCTION_NAME"
SET_TABLE_NAME="--table-name $TABLE_NAME"
SET_REGION="--region $REGION"
# 1. Check if the DynamoDB table exists and has streams enabled
echo "Checking if DynamoDB table exists with streams enabled..."
aws dynamodb describe-table \
$SET_ENDPOINT \
$SET_REGION \
$SET_TABLE_NAME > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "Error: Table '$TABLE_NAME' does not exist. Please create the table first."
  exit 1
fi

# Check if streams are enabled
STREAM_ENABLED=$(aws dynamodb describe-table \
$SET_ENDPOINT \
$SET_REGION \
$SET_TABLE_NAME \
--query 'Table.StreamSpecification.StreamEnabled' \
--output text)

if [ "$STREAM_ENABLED" != "True" ]; then
  echo "Error: Streams are not enabled on the '$TABLE_NAME' table."
  echo "Please enable streams with UpdateTable before continuing."
  exit 1
fi

# 2. Zip the lambda function
zip index.zip index.js

# 3. Check if the lambda function exists
aws lambda get-function \
$SET_ENDPOINT \
$SET_REGION \
$SET_FUNCTION_NAME \
--query 'Configuration.FunctionName' \
--output text

# 4. If the lambda function exists, delete it
if [ $? -eq 0 ]; then
  echo "Deleting existing lambda function: $FUNCTION_NAME..."
  aws lambda delete-function \
  $SET_ENDPOINT \
  $SET_REGION \
  $SET_FUNCTION_NAME
fi

# 5. Create the lambda function
echo "Creating lambda function: $FUNCTION_NAME..."
aws lambda create-function \
$SET_ENDPOINT \
$SET_REGION \
$SET_FUNCTION_NAME \
--zip-file fileb://index.zip \
--role roleARN \
--handler index.handler \
--timeout 50 \
--runtime nodejs16.x \
--role arn:aws:iam::000000000000:role/lambda-role

# 6. Get the ARN of the distributed-counter table
echo "Getting DynamoDB stream ARN for table: $TABLE_NAME..."
TABLE_ARN=$(aws dynamodb describe-table \
$SET_ENDPOINT \
$SET_REGION \
$SET_TABLE_NAME \
--query 'Table.LatestStreamArn' \
--output text)

# 7. Delete the event source mapping if it exists
echo "Checking for existing event source mappings for function: $FUNCTION_NAME..."
MAPPING_UUID=$(aws lambda list-event-source-mappings \
$SET_ENDPOINT \
$SET_REGION \
$SET_FUNCTION_NAME \
--query "EventSourceMappings[?EventSourceArn=='$TABLE_ARN'].UUID" \
--output text)

if [ -n "$MAPPING_UUID" ] && [ "$MAPPING_UUID" != "None" ]; then
  echo "Deleting existing event source mapping with UUID: $MAPPING_UUID..."
  aws lambda delete-event-source-mapping \
  $SET_ENDPOINT \
  $SET_REGION \
  --uuid $MAPPING_UUID
fi

# 8. Create the event source mapping
echo "Creating event source mapping between $FUNCTION_NAME and $TABLE_NAME..."
aws lambda create-event-source-mapping \
$SET_ENDPOINT \
$SET_REGION \
$SET_FUNCTION_NAME \
--event-source $TABLE_ARN \
--batch-size 1 \
--starting-position TRIM_HORIZON

echo "Deployment of $FUNCTION_NAME complete!"
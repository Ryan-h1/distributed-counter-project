#!/bin/bash
set -e

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1
ENDPOINT="--endpoint-url=http://localhost:4566"

# Generate a unique service ID
SERVICE_ID="test-service-$(date +%s)"
ACCOUNT_ID="test-account-1"

echo "Creating a test service with ID: $SERVICE_ID"

# Create a test service item
aws $ENDPOINT dynamodb put-item \
  --table-name distributed-counter \
  --item '{
    "PK": {"S": "ACCOUNT#'$ACCOUNT_ID'"},
    "SK": {"S": "SERVICE#'$SERVICE_ID'"},
    "id": {"S": "'$SERVICE_ID'"},
    "owner_account_id": {"S": "'$ACCOUNT_ID'"},
    "name": {"S": "Test Service"},
    "created_at": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"},
    "updated_at": {"S": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}
  }'

echo "Test service created!"
echo "Check the Lambda logs to see if it was triggered:"
echo "aws $ENDPOINT logs tail /aws/lambda/hello-function --follow" 
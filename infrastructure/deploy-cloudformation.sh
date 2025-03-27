#!/bin/bash

# Set variables
STACK_NAME="distributed-counter-stack"
TEMPLATE_PATH="$(pwd)/infrastructure/cloudformation.yml"
ENDPOINT="http://localhost:4566"
REGION="us-east-1"

# Check if stack already exists
echo "Checking if stack exists..."
if aws cloudformation describe-stacks --stack-name $STACK_NAME --endpoint-url=$ENDPOINT --region $REGION 2>&1 | grep -q 'Stack with id'; then
  # Stack doesn't exist, create it
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_PATH \
    --endpoint-url=$ENDPOINT \
    --region $REGION

  # Wait for stack creation to complete
  echo "Waiting for stack creation to complete..."
  aws cloudformation wait stack-create-complete \
    --stack-name $STACK_NAME \
    --endpoint-url=$ENDPOINT \
    --region $REGION
else
  # Stack exists, update it
  echo "Stack already exists, updating..."
  aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_PATH \
    --endpoint-url=$ENDPOINT \
    --region $REGION 2>&1 | grep -q "No updates are to be performed" && echo "No changes required to stack." || \
  (
    echo "Waiting for stack update to complete..."
    aws cloudformation wait stack-update-complete \
      --stack-name $STACK_NAME \
      --endpoint-url=$ENDPOINT \
      --region $REGION
  )
fi

# Verify the DynamoDB table
echo "Verifying DynamoDB table..."
aws dynamodb describe-table \
  --table-name distributed-counter \
  --endpoint-url=$ENDPOINT \
  --region $REGION

echo "Stack deployment complete!" 
#!/bin/bash

# Set variables
STACK_NAME="distributed-counter-stack"
ENDPOINT="http://localhost:4566"
REGION="us-east-1"

echo "Deleting CloudFormation stack: $STACK_NAME..."
aws cloudformation delete-stack \
  --stack-name $STACK_NAME \
  --endpoint-url=$ENDPOINT \
  --region $REGION

echo "Waiting for stack deletion to complete..."
aws cloudformation wait stack-delete-complete \
  --stack-name $STACK_NAME \
  --endpoint-url=$ENDPOINT \
  --region $REGION

echo "Stack has been deleted." 
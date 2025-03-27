#!/bin/bash
set -e

# This script builds and deploys the lambda function to LocalStack

# Set AWS credentials for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export AWS_DEFAULT_REGION=us-east-1

# Build the TypeScript function
echo "Building TypeScript Lambda function..."
./build.sh

# Create S3 bucket in LocalStack if it doesn't exist
echo "Creating S3 bucket in LocalStack..."
aws --endpoint-url=http://localhost:4566 s3 mb s3://deployed-code --no-verify-ssl 2>/dev/null || true

# Package the SAM application
echo "Packaging SAM application..."
PYTHONWARNINGS="ignore:Unverified HTTPS request" AWS_ENDPOINT_URL=http://localhost:4566 sam package \
  --template-file template.yaml \
  --output-template-file packaged.yaml \
  --s3-bucket deployed-code \
  --region us-east-1

# Deploy to LocalStack
echo "Deploying to LocalStack..."
PYTHONWARNINGS="ignore:Unverified HTTPS request" AWS_ENDPOINT_URL=http://localhost:4566 sam deploy \
  --template-file packaged.yaml \
  --stack-name lambda-function-stack \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

echo "Deployment complete!"
echo "Now run ./setup-trigger.sh to connect the Lambda to your DynamoDB stream" 
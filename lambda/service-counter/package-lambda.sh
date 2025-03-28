#!/bin/bash

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Change to the script's directory
cd "$(dirname "$0")"

# Set environment variables for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy

# Configuration
ENDPOINT="http://localhost:4566"
REGION="us-east-1"
S3_BUCKET="localstack-lambda-artifacts"
S3_KEY="service-counter/index.zip"

SET_ENDPOINT="--endpoint-url=$ENDPOINT"
SET_REGION="--region $REGION"

# Zip the Lambda function code
echo "Packaging Lambda function code..."
zip -r index.zip index.js

# Check if the S3 bucket exists, create it if not
echo "Checking if S3 bucket exists: $S3_BUCKET"
aws s3api head-bucket \
$SET_ENDPOINT \
$SET_REGION \
--bucket $S3_BUCKET 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Creating S3 bucket: $S3_BUCKET"
  aws s3api create-bucket \
  $SET_ENDPOINT \
  $SET_REGION \
  --bucket $S3_BUCKET
fi

# Upload the zip file to S3
echo "Uploading Lambda code to S3: s3://$S3_BUCKET/$S3_KEY"
aws s3 cp \
$SET_ENDPOINT \
$SET_REGION \
index.zip s3://$S3_BUCKET/$S3_KEY

# Report success
echo "Lambda function code packaged and uploaded successfully!"
echo "S3 location: s3://$S3_BUCKET/$S3_KEY"
echo "You can now deploy your CloudFormation template."

# Change back to the original directory
cd "$ORIGINAL_DIR" 
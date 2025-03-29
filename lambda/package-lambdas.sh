#!/bin/bash

# Store the original directory
ORIGINAL_DIR=$(pwd)
SCRIPT_DIR="$(dirname "$0")"

# Set environment variables for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy

# Configuration
ENDPOINT="http://localhost:4566"
REGION="us-east-1"
S3_BUCKET="localstack-lambda-artifacts"

SET_ENDPOINT="--endpoint-url=$ENDPOINT"
SET_REGION="--region $REGION"

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

# Package and upload the service-insert-counter Lambda
echo "===== Packaging service-insert-counter ====="
cd "$SCRIPT_DIR/service-insert-counter"
echo "Packaging Lambda function code..."
# Remove any existing zip to ensure a clean build
rm -f index.zip
zip -r index.zip index.js

# Upload the zip file to S3
S3_KEY="service-insert-counter/index.zip"
echo "Uploading Lambda code to S3: s3://$S3_BUCKET/$S3_KEY"
aws s3 cp \
$SET_ENDPOINT \
$SET_REGION \
index.zip s3://$S3_BUCKET/$S3_KEY

echo "service-insert-counter packaged and uploaded successfully!"

# Package and upload the service-modify-counter Lambda
echo "===== Packaging service-modify-counter ====="
# Reset to the original directory before changing to service-modify-counter
cd "$ORIGINAL_DIR"
cd "$SCRIPT_DIR/service-modify-counter"
echo "Packaging Lambda function code..."
# Remove any existing zip to ensure a clean build
rm -f index.zip
zip -r index.zip index.js

# Upload the zip file to S3
S3_KEY="service-modify-counter/index.zip"
echo "Uploading Lambda code to S3: s3://$S3_BUCKET/$S3_KEY"
aws s3 cp \
$SET_ENDPOINT \
$SET_REGION \
index.zip s3://$S3_BUCKET/$S3_KEY

echo "service-modify-counter packaged and uploaded successfully!"

# Report success
echo "All Lambda functions packaged and uploaded successfully!"
echo "You can now deploy your CloudFormation template."

# Change back to the original directory
cd "$ORIGINAL_DIR" 
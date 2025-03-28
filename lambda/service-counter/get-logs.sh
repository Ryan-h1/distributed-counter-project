#!/bin/bash

# Store the original directory
ORIGINAL_DIR=$(pwd)

# Change to the script's directory
cd "$(dirname "$0")"

# Set AWS environment variables for LocalStack
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy

# Configuration
ENDPOINT="http://localhost:4566"
FUNCTION_NAME="service-counter"
LOG_GROUP_NAME="/aws/lambda/$FUNCTION_NAME"
REGION="us-east-1"
OUTPUT_FILE="lambda-logs.txt"

SET_ENDPOINT="--endpoint-url=$ENDPOINT"
SET_REGION="--region $REGION"

echo "Checking if log group exists for function: $FUNCTION_NAME..."
LOG_GROUP_EXISTS=$(aws logs describe-log-groups \
$SET_ENDPOINT \
$SET_REGION \
--log-group-name-prefix "$LOG_GROUP_NAME" \
--query "logGroups[?logGroupName=='$LOG_GROUP_NAME'].logGroupName" \
--output text)

if [ -z "$LOG_GROUP_EXISTS" ] || [ "$LOG_GROUP_EXISTS" == "None" ]; then
  echo "Error: Log group '$LOG_GROUP_NAME' does not exist."
  echo "The Lambda function may not have been invoked yet or logs have not been created."
  exit 1
fi

echo "Log group found: $LOG_GROUP_NAME"

# Get the latest log stream
echo "Fetching the latest log stream..."
LATEST_LOG_STREAM=$(aws logs describe-log-streams \
$SET_ENDPOINT \
$SET_REGION \
--log-group-name "$LOG_GROUP_NAME" \
--order-by LastEventTime \
--descending \
--limit 1 \
--query "logStreams[0].logStreamName" \
--output text)

if [ -z "$LATEST_LOG_STREAM" ] || [ "$LATEST_LOG_STREAM" == "None" ]; then
  echo "Error: No log streams found in log group '$LOG_GROUP_NAME'."
  exit 1
fi

echo "Latest log stream: $LATEST_LOG_STREAM"

# Get the logs from the latest log stream
echo "Retrieving logs from stream: $LATEST_LOG_STREAM..."
aws logs get-log-events \
$SET_ENDPOINT \
$SET_REGION \
--log-group-name "$LOG_GROUP_NAME" \
--log-stream-name "$LATEST_LOG_STREAM" \
--output json > temp_logs.json

# Format the logs nicely
echo "Formatting logs and saving to $OUTPUT_FILE..."
echo "==== Lambda Function Logs: $FUNCTION_NAME ====" > "$OUTPUT_FILE"
echo "Log Group: $LOG_GROUP_NAME" >> "$OUTPUT_FILE"
echo "Log Stream: $LATEST_LOG_STREAM" >> "$OUTPUT_FILE"
echo "Retrieved at: $(date)" >> "$OUTPUT_FILE"
echo "=========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract and format the log messages with timestamps
jq -r '.events[] | "[" + (.timestamp | todate) + "] " + .message' temp_logs.json >> "$OUTPUT_FILE"

# Clean up temporary file
rm temp_logs.json

echo "Logs have been saved to $OUTPUT_FILE"

# Display the logs
echo "Log contents:"
cat "$OUTPUT_FILE"

# Change back to the original directory
cd "$ORIGINAL_DIR" 
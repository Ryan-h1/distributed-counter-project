#!/bin/bash
set -e

echo "Building TypeScript Lambda function..."
cd hello-function
npm install
npm run build
cd ..

echo "Done!" 
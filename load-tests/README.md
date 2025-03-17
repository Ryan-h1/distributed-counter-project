# Load Testing with K6

This directory contains load testing scripts using [K6](https://k6.io/), an open-source load testing tool.

## Prerequisites

Install K6 on your machine:

- **macOS**:
  ```
  brew install k6
  ```

- **Linux**:
  ```
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

- **Windows**:
  ```
  choco install k6
  ```

For other installation methods, see the [K6 installation guide](https://k6.io/docs/getting-started/installation/).

## Running the Tests

Make sure your API is running locally before executing the tests.

### Basic Health Test

To run the basic health endpoint test:

```
k6 run load-tests/health-test.js
```

### Advanced Health Test

The advanced test includes custom metrics and more detailed reporting:

```
k6 run load-tests/advanced-health-test.js
```

### Multi-Endpoint Test

This test demonstrates how to test multiple endpoints in a single script:

```
k6 run load-tests/multi-endpoint-test.js
```

### Constant Rate Test (TPS-based)

This test maintains a constant throughput of 50 requests per second:

```
k6 run load-tests/constant-rate-test.js
```

### Ramping Rate Test (Variable TPS)

This test gradually increases and decreases the throughput over time:

```
k6 run load-tests/ramping-rate-test.js
```

### Configurable Rate Test

This test allows you to specify the TPS via environment variables:

```
# Run with 100 TPS for 2 minutes
k6 run -e TARGET_TPS=100 -e DURATION=2m load-tests/configurable-rate-test.js

# Run with 200 TPS for 30 seconds and up to 300 VUs
k6 run -e TARGET_TPS=200 -e DURATION=30s -e MAX_VUS=300 load-tests/configurable-rate-test.js
```

## Test Configuration

### Basic Health Test

The basic health test is configured with the following parameters:

- Ramp up to 20 virtual users over 30 seconds
- Maintain 20 virtual users for 1 minute
- Ramp down to 0 users over 30 seconds
- Performance thresholds:
  - 95% of requests should complete within 500ms
  - Error rate should be less than 1%

### Advanced Health Test

The advanced health test includes:

- Custom metrics for tracking response times and success rates
- More detailed performance thresholds
- Grouped test scenarios
- Enhanced reporting statistics

### Multi-Endpoint Test

The multi-endpoint test:

- Tests multiple API endpoints in a single script
- Uses a shorter test duration with fewer virtual users
- Demonstrates how to organize tests into logical groups
- Provides a template for expanding as your API grows

### Constant Rate Test

The constant rate test:

- Maintains a steady 50 requests per second (TPS)
- Uses K6's constant-arrival-rate executor
- Automatically scales VUs as needed to maintain the target rate
- Runs for 1 minute at the constant rate

### Ramping Rate Test

The ramping rate test:

- Starts at 10 TPS and gradually increases to 100 TPS
- Uses K6's ramping-arrival-rate executor
- Demonstrates how to create a more realistic load pattern
- Includes stages for ramping up, steady-state, and ramping down

### Configurable Rate Test

The configurable rate test:

- Allows you to set the TPS via environment variables
- Supports configuring the test duration and maximum VUs
- Provides a flexible way to run different load scenarios
- Uses the same constant-arrival-rate executor as the constant rate test

## Visualizing Results

To generate an HTML report of your test results:

```
k6 run --out json=results.json load-tests/advanced-health-test.js
k6 report results.json
```

## Adding More Tests

To create additional load tests, add new JavaScript files to this directory following the same pattern as the existing tests. 
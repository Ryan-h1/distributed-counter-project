# Load Testing with K6

This directory contains load testing scripts using [K6](https://k6.io/), an open-source load testing tool.

## Prerequisites

Install K6 on your machine:

- **macOS**:

  ```sh
  brew install k6
  ```

- **Linux**:

  ```sh
  sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
  echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
  sudo apt-get update
  sudo apt-get install k6
  ```

- **Windows**:

  ```sh
  choco install k6
  ```

For other installation methods, see the [K6 installation guide](https://k6.io/docs/getting-started/installation/).

## Running the Tests

Make sure your API is running locally before executing the tests.

### Constant Rate Test (TPS-based)

```sh
k6 run load-tests/constant-rate-test.js
```

## Visualizing Results

To generate an HTML report of your test results:

```sh
k6 run --out json=results.json load-tests/advanced-health-test.js
k6 report results.json
```

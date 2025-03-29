import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, SharedArray } from 'k6/metrics';
import { scenario } from 'k6/execution';

// Define a custom metric for tracking success rate
const successRate = new Rate('success_rate');

// Shared account ID that will be used across all VUs
let accountId;

// Setup function runs once before the test starts
export function setup() {
  // Create an account to be used by all VUs
  const createAccountPayload = JSON.stringify({
    username: `testaccount-${Date.now()}`,
  });

  const createAccountOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const createAccountResponse = http.post(
    'http://localhost:3000/accounts/',
    createAccountPayload,
    createAccountOptions,
  );

  check(createAccountResponse, {
    'account created successfully': (r) => r.status === 200,
  });

  const account = createAccountResponse.json();
  console.log(`Created shared account: ${account.id} (${account.username})`);

  // Return the account ID to be used in the default function
  return { accountId: account.id };
}

export const options = {
  // Use scenarios to define a constant request rate
  scenarios: {
    constant_request_rate: {
      // Use the constant arrival rate executor
      executor: 'constant-arrival-rate',

      // Common scenario configuration
      startTime: '0s',
      duration: '20s',
      preAllocatedVUs: 100, // Reduced to prevent server overload
      maxVUs: 1000, // Reduced max VUs

      // Specific scenario configuration
      rate: 1000, // 1000 TPS total
      timeUnit: '1s',
    },
  },

  // Performance thresholds - relaxed for stress testing
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.5'],
    success_rate: ['rate>0.5'],
  },
};

export default function (data) {
  // Use the account ID from the setup function
  const sharedAccountId = data.accountId;

  // Use a single service name to maximize DynamoDB conflicts
  const serviceName = 'stress-test-service';

  // Create service payload
  const createServicePayload = JSON.stringify({
    account_id: sharedAccountId,
    name: serviceName,
  });

  const createServiceOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Create a new service for the shared account
  const createResponse = http.post(
    'http://localhost:3000/services/',
    createServicePayload,
    createServiceOptions,
  );

  // Check if the response was successful
  const createSuccess = check(createResponse, {
    'status is 200': (r) => r.status === 200,
    'service created successfully': (r) => r.json('id') !== undefined,
    'service has correct account': (r) =>
      r.json('account_id') === sharedAccountId,
  });

  // If service was created successfully, delete it
  if (createSuccess) {
    // const serviceId = createResponse.json('id');
    // const deleteResponse = http.del(
    //   `http://localhost:3000/services/${serviceId}?ownerAccountId=${sharedAccountId}`,
    //   null,
    //   {
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //   },
    // );

    // // Check if deletion was successful
    // const deleteSuccess = check(deleteResponse, {
    //   'delete status is 200': (r) => r.status === 200,
    // });

    // // Record overall success (both create and delete must succeed)
    // successRate.add(deleteSuccess);
  } else {
    // If creation failed, record failure
    successRate.add(false);
  }
}

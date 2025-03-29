# Hi

## Requirements

- [Docker](https://www.docker.com)
- [bun](https://bun.sh/)
- [K6](https://k6.io/)
- [Node.js](https://nodejs.org/en)
- npm
- AWS SAM CLI
- AWS CLI

## Usage

### Run Containers

```sh
docker compose up
```

### Shut Down Containers

```sh
docker compose down -v --remove-orphans
```

### Grant Execution Privileges to The Shell Scripts

```sh
chmod +x infrastructure/deploy-cloudformation.sh && \
chmod +x infrastructure/teardown-cloudformation.sh && \
chmod +x lambda/package-lambdas.sh
```

### Deploy Local AWS Infrastructure

Note that the Docker containers must be running

```sh
./infrastructure/deploy-cloudformation.sh
```

### Tear Down Local AWS Infrastructure

Note that the Docker containers must be running

```sh
./infrastructure/teardown-cloudformation.sh
```

### Upload Lambda Functions

```sh
./lambda/package-lambdas.sh
```

### Load Tests

Run constant rate tests

```sh
k6 run load-tests/constant-rate-test.js
```

## Running The Program

Execute the commands from the Usage section in the following order

1. Grant Execution Privileges to The Shell Scripts
2. Run Containers
3. Upload Lambda Functions
4. Deploy Local AWS Infrastructure

## Known Issues

LocalStack is finicky, and sometimes DynamoDB streams appear to be created as Kinesis streams instead
of DynamoDB streams. If you're getting an error like `An error occurred (InvalidParameterValueException) when calling the CreateEventSourceMapping operation: Stream not found: arn:aws:dynamodb:us-east-1:000000000000:table/distributed-counter/stream/2025-03-28T17:36:19.565`, when deploying Lambda functions, then you're
likely encountering [this issue](https://github.com/localstack/localstack/issues/10885). Try deleting
 your `docker-volumes` folder and re-running `docker compose up --build` to build fresh containers.

## Dataflow

The dataflow for a given Entity is:

Entity (Database table) -> EntityRepository -> EntityService -> entities (plural as route)

For instance, the Account data type has an Account table in the DynamoDB. An AccountRepository.ts file interacts with this table in the DynamoDB. An AccountService.ts performs input validation before calling low-level operations from AccountRepository.ts. Finally, account.ts exists in the routes folder and exposes RESTful methods that call operations from AccountService.ts.

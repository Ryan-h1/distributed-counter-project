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
chmod +x lambda/service-counter/deploy-lambda.sh
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


### Deploy Lambda Functions

Navigate to the lambda directory first to change the context of the shell script execution

```sh
cd lambda/service-counter
./deploy-lambda.sh
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
3. Deploy Local AWS Infrastructure
4. Deploy Lambda Functions

## Dataflow

The dataflow for a given Entity is:

Entity (Database table) -> EntityRepository -> EntityService -> entities (plural as route)

For instance, the Account data type has an Account table in the DynamoDB. An AccountRepository.ts file interacts with this table in the DynamoDB. An AccountService.ts performs input validation before calling low-level operations from AccountRepository.ts. Finally, account.ts exists in the routes folder and exposes RESTful methods that call operations from AccountService.ts.

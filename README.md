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

### Create DynamoDB Tables

Navigate to the API directory first to use its compiler

```sh
cd api
bun src/scripts/create-table.ts
```

### Deploy Lambda Functions

```sh
chmod +x lambda/build.sh
chmod +x lambda/deploy.sh
./lambda/build.sh
./lambda/deploy.sh
```

### Load Tests

Run constant rate tests

```sh
k6 run load-tests/constant-rate-test.js
```

## Dataflow

The dataflow for a given Entity is:

Entity (Database table) -> EntityRepository -> EntityService -> entities (plural as route)

For instance, the Account data type has an Account table in the DynamoDB. An AccountRepository.ts file interacts with this table in the DynamoDB. An AccountService.ts performs input validation before calling low-level operations from AccountRepository.ts. Finally, account.ts exists in the routes folder and exposes RESTful methods that call operations from AccountService.ts.

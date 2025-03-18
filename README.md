# Hi

## Requirements

- [Docker](https://www.docker.com)
- [bun](https://bun.sh/)

## Usage

### Run Containers

```sh
docker compose up -d
```

### Create DynamoDB Tables

Navigate to the API directory first to use its compiler

```sh
cd api
bun src/scripts/create-table.ts
```

## Dataflow

The dataflow for a given Entity is:

Entity (Database table) -> EntityRepository -> EntityService -> entities (plural as route)

For instance, the Account data type has an Account table in the DynamoDB. An AccountRepository.ts file interacts with this table in the DynamoDB. An AccountService.ts performs input validation before calling low-level operations from AccountRepository.ts. Finally, account.ts exists in the routes folder and exposes RESTful methods that call operations from AccountService.ts.

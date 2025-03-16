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

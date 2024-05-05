

## 100ty App Description

## Installation

```bash
$ yarn install
```

## Structure file
```js
+-- src
|   +-- example
|   |   +-- dto
|   |   +-- example.module.ts
|   |   +-- example.controller.ts
|   |   +-- example.entity.ts
|   |   +-- example.service.ts
```

## Running the app

```bash
#run migrations
$ yarn migration:run

# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Swagger doc
```bash
$ /doc
```

## Migration


```bash
#generate migration
$ yarn migration:generate -- db/migrations/create-table-demo

#run migration
$ yarn migration:run
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

# Running tests

## Spec Tests

```sh
npm test
```

## Integration tests 

```sh
DEBUG=sql npm run test:integration -- \
    --grep="insert" # optional filter
```

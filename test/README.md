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

_Options_

- `DEBUG=sql` - print out SQL requests
- `KEEP_DOCKER=1` - dont remove docker containers and volumes after tests complete
- `TEST_STATE_CLEANUP_MODE=none` - leave the db engine running after tests complete

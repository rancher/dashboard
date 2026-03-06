## E2E Tests (Cypress)

### Writing E2E Tests
- E2E tests use the Cypress framework, Mocha for structure and Chai based assertions
- E2E tests should be written in TypeScript
- E2E files can be found in the `./cypress` directory

### Running E2E Tests

- Interactive mode: `yarn cy:e2e`
- Headless mode: `yarn cy:run`
- Run a specific spec file: `yarn cy:run --spec cypress/e2e/tests/<path-to-spec>.spec.ts`

#### Required Environment Variables

- `TEST_PASSWORD` - Password for login (or CATTLE_BOOTSTRAP_PASSWORD for setup tests)
- `TEST_BASE_URL` - Dashboard URL (defaults to https://localhost:8005)
- `TEST_USERNAME` - Username (defaults to admin)

#### Optional Environment Variables

- `TEST_SKIP` - Comma-separated test directories to skip (e.g., setup,extensions)
- `TEST_ONLY` - Comma-separated test directories to run exclusively
- `GREP_TAGS` - Filter tests by tags

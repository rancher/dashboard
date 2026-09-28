## E2E Tests (Cypress)

### Writing E2E Tests
- E2E tests use the Cypress framework, Mocha for structure and Chai based assertions
- E2E tests should be written in TypeScript
- E2E files can be found in the `./cypress` directory
- Always prefer calling `PagePo`'s' `navTo` method rather than `goTo` when navigating from one page to another. The former simulates a user experience better as they click through the UI, whilst the later is a fresh reload which the user should never have to do.
- When improving an E2E test do not replace `PagePo` `navTo` with a `goTo`, investigate other ways to resolve the issue like waiting for pre or post navigation page element state. If no way can be found it might represent a genuine bug that should be raised.

#### Running E2E Tests

- Interactive mode: `yarn cy:e2e`
- Headless mode: `yarn cy:run`
- Run a specific spec file: `yarn cy:run --spec cypress/e2e/tests/<path-to-spec>.spec.ts`

##### Required Environment Variables

- `TEST_PASSWORD` - Password for login (or CATTLE_BOOTSTRAP_PASSWORD for setup tests)
- `TEST_BASE_URL` - Dashboard URL (defaults to https://localhost:8005)
- `TEST_USERNAME` - Username (defaults to admin)

##### Optional Environment Variables

- `TEST_SKIP` - Comma-separated test directories to skip (e.g., setup,extensions)
- `TEST_ONLY` - Comma-separated test directories to run exclusively
- `GREP_TAGS` - Filter tests by tags
- `CYPRESS_ALLOW_FILTERED_CATALOG_SKIP` - When `true`, chart tests may skip if a chart is hidden in the UI filtered catalog but present in the unfiltered index. When unset or not `true`, those tests fail.

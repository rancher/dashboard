## Unit Tests

Please see [Rancher UI Internal Documentation - Testing - Unit Tests](https://extensions.rancher.io/internal/testing/unit-test) for more information

### Writing Unit Tests

- Tests use the Jest framework (Chai based assertions in a Mocha like structure)
- Unit tests should be written in TypeScript
- Some global helpers for component based unit tests can be found in `jest.setup.js`
- Tests associated with files should be in a similarly named file in a `__tests__` directory. The file name should end in `.test.ts`
  - For example the tests for `shell/utils/uiplugins.ts` are in `shell/utils/__tests__/uiplugins.test.ts`
- Use describe blocks to group related tests
- Write tests covering both happy and unhappy paths, edge cases (null values, empty strings, extremely large numbers) and error handling
- Ensure each test case is atomic and tests only one specific assertion
- Use `it.each` to run the same test logic against a table of different input/output pairs.

### Boundaries

- ✅ **Always:**
  - Act as a QA Software Developer
  - Use `toStrictEqual` instead of `toEqual`
  - Use `toHaveBeenCalledWith` instead of `toHaveBeenCalled`
- 🚫 **Never:**
  - Overwrite existing test files

### Running Unit Tests

- To run all tests: `yarn test`
- To run a single test file: `yarn test <full-path-to-test-file>`

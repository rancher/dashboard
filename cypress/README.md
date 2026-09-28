# @rancher/cypress

Reusable Cypress E2E test utilities, page objects, and support files for Rancher Dashboard testing.

## Installation

```bash
npm install @rancher/cypress --save-dev
# or
yarn add @rancher/cypress --dev
```

## Setup

This package provides:

- **E2E Tests** (`/e2e/*`) - Predefined Cypress tests for common Rancher Dashboard scenarios
- **Page Objects** (`/e2e/po/*`) - Reusable page object models for common Rancher UI components and pages
- **Blueprints** (`/e2e/blueprints/*`) - Test fixtures and data blueprints
- **Support Files** (`/support/*`) - Custom Cypress commands and utilities
- **Cypress Configuration** (`/base-config`) - Base Cypress configuration
- **Extendable Config** (`/extend-config`) - Utilities to extend Cypress config

### Using @rancher/cypress CLI

#### Available Commands

| Command                        | Description                                      |
|--------------------------------|--------------------------------------------------|
| npx rancher-cypress open      | Launch Cypress UI                                |
| npx rancher-cypress run       | Run Cypress tests                                |
| npx rancher-cypress init      | Scaffold a Cypress project structure             |

#### What does `init` do?

The `init` command will:

- Create a new `cypress/` directory in your project (if one does not already exist)
- Copy all template files and folders into `cypress/`
- Copy `cypress.config.ts` into your project root (not inside `cypress/`)
- Abort if a `cypress/` directory or `cypress.config.ts` already exists, to avoid overwriting your work

This provides a ready-to-use Cypress project structure for Rancher Dashboard E2E testing.

---

### Manual Setup

#### Cypress Configuration

Create a `cypress.config.ts` file in your consuming project:

Use default base configuration:

```typescript
import baseConfig from '@rancher/cypress/base-config';

export default baseConfig;
```

Or extend the base configuration:

```typescript
import { extendConfig } from '@rancher/cypress/extend-config';

export default extendConfig({
  env: {
    yourCustomEnvVar: 'value',
  },
  e2e: {
    supportFile: 'your/custom/support/file.ts',
  }
});
```

#### Package.json

Add new tasks to Cypress configuration in `package.json`:

```json
{
  "cypress": {
    "tasks": {
      "cypress:open": "yarn rancher-cypress open --e2e --browser chrome",
      "cypress:run": "yarn rancher-cypress run",
    }
  }
}
```

#### TypeScript Configuration

> **Important:**
> To enable type completion for custom Cypress commands and page objects, add `"cypress"` to the `types` array in your root `tsconfig.json`:
>
> ```json
> {
>   "compilerOptions": {
>     "types": ["cypress"]
>   }
> }
> ```

## Usage

### Using Page Objects

```typescript
import HomePagePo from '@rancher/cypress/e2e/po/pages/home.po';

describe('Login Test', () => {
  it('should login successfully', () => {
    cy.login();
    
    const homePage = new HomePagePo();
    homePage.goTo();
  });
});
```

### Using Custom Commands

Import the support file in your `cypress/support/e2e.ts`:

```typescript
import '@rancher/cypress/support/e2e';
```

This will load all custom Cypress commands like:
- `cy.login()`
- `cy.createRancherResource()`
- etc.

### Using Blueprints (Fixtures)

```typescript
cy.fixture('@rancher/cypress/blueprints/fixture.json').then((data) => {
  // use fixture data
});
```

### Importing E2E Tests

You can directly import and run predefined E2E tests from the package:

```typescript
// File your-e2e-tests.spec.ts
import '@rancher/cypress/e2e/tests/sample-dir/sample-test.spec';
```

## Implementation & Publishing Notes

### Project Structure & Build Process
- All source files (e2e, support, base-config.ts, extend-config.ts, globals.d.ts) are copied into a temporary `tmp/` directory before build.
- The build script (`build.sh`) normalizes internal imports and compiles TypeScript from `tmp/` to `dist/` using `tsconfig.build.json`.
- After compilation, TypeScript source files are also copied to `dist/` for better developer experience.
- Non-TypeScript assets (README, package.json, etc.) are copied to `dist/` for publishing.
- The published npm package only includes the `dist/` directory, as specified in `package.json`.

### TypeScript Configuration
- `tsconfig.build.json` extends the main `tsconfig.json` but restricts compilation to `tmp/**/*` and outputs only to `dist/`.
- Source maps and declaration maps are generated for easier debugging and type navigation.

### Clean Build Guarantee
- Only the files actually referenced by the cypress code are included in the build, keeping the package minimal.

### Publishing
- To manual publish, run:
  ```bash
  yarn build-pkg
  cd dist
  npm publish
  ```
- To automate publishing, use the provided GitHub Actions workflow.
  Add a new release tag, and the workflow will build and publish the package to npm.
  ```bash
  git tag cypress-pkg-v1.0.0
  git push upstream cypress-pkg-v1.0.0
  ```

### Troubleshooting
- If you see build errors not shown in VS Code, ensure you are using the same TypeScript config (`tsconfig.build.json`) for both build and editor, or manually run `npx tsc --project tsconfig.build.json` to check.
- If you see stray build artifacts in dependency directories, check the build script and tsconfig paths to ensure all compilation is isolated to `tmp/` and `dist/`.

## Requirements

- Node.js >= 20.0.0
- TypeScript >= 5.0.0

## License

Apache-2.0

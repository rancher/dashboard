# @rancher/cypress

Reusable Cypress E2E test utilities, page objects, and support files for Rancher Dashboard testing.

## Installation

```bash
npm install @rancher/cypress
# or
yarn add @rancher/cypress
```

## What's Included

This package provides:

- **Page Objects** (`/po/*`) - Reusable page object models for common UI components and pages
- **Blueprints** (`/blueprints/*`) - Test fixtures and data blueprints
- **Support Files** (`/support/*`) - Custom Cypress commands and utilities
- **Configuration** (`/config/*`) - Base Cypress configuration

## Usage

### Using Page Objects

```typescript
import { LoginPage } from '@rancher/cypress/e2e/po/pages/login.po';
import { HomePage } from '@rancher/cypress/e2e/po/pages/home.po';

describe('Login Test', () => {
  it('should login successfully', () => {
    const loginPage = new LoginPage();
    loginPage.login('admin', 'password');
    
    const homePage = new HomePage();
    homePage.checkIsCurrentPage();
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
cy.fixture('@rancher/cypress/blueprints/my-fixture.json').then((data) => {
  // use fixture data
});
```

### Using Base Configuration

In your project's `cypress.config.ts`:

```typescript
import { getBaseConfig } from '@rancher/cypress/config/base.config';

const baseConfig = getBaseConfig();

export default {
  ...baseConfig,
  e2e: {
    ...baseConfig.e2e,
    specPattern: 'your-tests/**/*.spec.ts',
    // override any other settings
  }
};
```

## Requirements

- Cypress 11.1.0
- Node.js >= 20.0.0
- TypeScript >= 5.0.0

## License

Apache-2.0

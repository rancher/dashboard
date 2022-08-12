
import './commands';

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string, cacheSession?: boolean): Chainable<Element>;
      byLabel(label: string,): Chainable<Element>;
      getId(id: string,): Chainable<Element>;
      // eslint-disable-next-line no-undef
      userPreferences(preferences?: Partial<UserPreferences>): Chainable<null>;
    }
  }
}

// TODO handle redirection errors better?
// we see a lot of 'error navigation cancelled' uncaught exceptions that don't actually break anything; ignore them here
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  if (err.message.includes('navigation guard')) {
    return false;
  }
});

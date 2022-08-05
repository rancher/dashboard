
import { Matcher } from '~/cypress/support/types';
import './commands';

declare global {
  // eslint-disable-next-line no-unused-vars
  namespace Cypress {
    interface Chainable {
      login(username?: string, password?: string, cacheSession?: boolean): Chainable<Element>;
      byLabel(label: string,): Chainable<Element>;

      /**
       *  Wrapper for cy.get() to simply define the data-testid value that allows you to pass a matcher to find the element.
       * @param id Value used for the data-testid attribute of the element.
       * @param matcher Matching character used for attribute value:
       * - `$`: Suffixed with this value
       * - `^`: Prefixed with this value
       * - `~`: Contains this value as whitespace separated words
       * - `*`: Contains this value
       */
      getId(id: string, matcher?: Matcher): Chainable<Element>;

      /**
       *  Wrapper for cy.find() to simply define the data-testid value that allows you to pass a matcher to find the element.
       * @param id Value used for the data-testid attribute of the element.
       * @param matcher Matching character used for attribute value:
       * - `$`: Suffixed with this value
       * - `^`: Prefixed with this value
       * - `~`: Contains this value as whitespace separated words
       * - `*`: Contains this value
       */
      findId(id: string, matcher?: Matcher): Chainable<Element>;

      /**
       * Override user preferences to default values, allowing to pass custom preferences for a deterministic scenario
       * Leave empty for reset to default values
       */
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

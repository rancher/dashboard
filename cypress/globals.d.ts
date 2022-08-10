// eslint-disable-next-line no-unused-vars
declare namespace Cypress {
  interface Chainable {
    login(username?: string, password?: string, cacheSession?: boolean): Chainable<Element>;
    byLabel(label: string,): Chainable<Element>;
    getId(id: string,): Chainable<Element>;
    // eslint-disable-next-line no-undef
    userPreferences(preferences?: Partial<UserPreferences>): Chainable<null>;
  }
}

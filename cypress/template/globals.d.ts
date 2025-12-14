declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>;
      // Add custom commands here
    }
  }
}

export {};

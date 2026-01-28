declare global {
  namespace Cypress {
    interface Chainable {
      customCommand(): Chainable<void>;
      // Add custom commands here
    }
  }
}

export {};

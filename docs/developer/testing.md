# Testing

## E2E Tests
This repo is configured for end-to-end testing with [Cypress](https://docs.cypress.io/api/table-of-contents). 

### Initial Setup
For the cypress test runner to consume the UI, you must specify two environment variables, `TEST_USERNAME` and `TEST_PASSWORD`. By default the test runner will attempt to visit a locally running dashboard at `https://localhost:8005`. This may be overwritten with the `DEV_UI` environment variable. Run `yarn e2e:dev` to start the dashboard in SSR mode and open the cypress test runner. Run tests through the cypress GUI once the UI is built. Cypress tests will automatically re-run if they are altered (hot reloading). Alternatively the dashboard ui and cypress may be run separately with `yarn dev` and `yarn cypress open`. 

### Writing tests

Test specs should be grouped logically, normally by page or area of the Dashboard but also by a specific feature or component.

Tests should make use of common Page Object (PO) components. These can be pages or individual components which expose a useful set of tools, but most importantly contain the selectors for the DOM elements that need to be used. These will ensure changes to the underlying components don't require a rewrite of many many tests. They also allow parent components to easily search for children (for example easily finding all anchors in a section instead of the whole page). Given that tests are typescript it should be easy to explore the functionality.

Some examples of PO functionality
```
HomePage.gotTo()
new HomePagePo().checkIsCurrentPage()
new BurgerMenuPo().clusters()
new AsyncButtonPO('.my-button').isDisabled()
new LoginPagePo().username().set('admin')
```

POs all inherit a root `component.po`. Common component functionality can be added there. They also expose their core cypress (chainable) element.

There are a large number of pages and components in the Dashboard and only a small set of POs. These will be expanded as the tests grow.

### Tips
The Cypress UI is very much your friend. There you can click pick tests to run, easily visually track the progress of the test, see the before/after state of each cypress command (specifically good for debugging failed steps), see https requests, etc.

Tests can also be restricted before cypress runs, or at run time, by prepending `.only` to the run.
```
describe.only('Burger Side Nav Menu', () => {
  beforeEach
```
```
it.only('Opens and closes on menu icon click', () => {
```
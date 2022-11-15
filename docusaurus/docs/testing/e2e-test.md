# E2E Test

This repo is configured for end-to-end testing with [Cypress](https://docs.cypress.io/api/table-of-contents) and the CI will run using a blank state of Rancher executed locally. The aim is however to enable also tests using remote instances of Ranchers.

Because of this, we extend the [Cypress best practices](https://docs.cypress.io/guides/references/best-practices#How-It-Works), so be sure to read them before write any test.

## Initial Setup

For the cypress test runner to consume the UI, you should specify the environment variables. This may change based on the type of tests you may want to run.

### Setup for remote tests

For tests against a deployed Rancher, e.g. on Digital Ocean, mainly for analyzing the project current state.

- `TEST_USERNAME`, default `admin`
- `TEST_PASSWORD`, user password or custom during first Rancher run
- `TEST_BASE_URL`, the address of your instance
- `TEST_SKIP_SETUP=true`, we avoid setup as your instance is already set

Finally run one of the 2 commands:

- `yarn cy:open`, if you want to select the tests
- `yarn cy:run`, if you want to run ALL the tests

For further information, consult [official documentation](https://docs.cypress.io/guides/guides/command-line#cypress-open).

### Setup for local tests

These types of tests are aimed for development and updates.

NOTE: Local setup of Rancher do not work on Mac with M1 chips.

- `API`, the address of your server (e.g. DO), it may be local or hosted (e.g. you have Mac M1)
- `TEST_USERNAME`, default `admin`
- `TEST_PASSWORD`, user password or custom during first Rancher run
- `CATTLE_BOOTSTRAP_PASSWORD`, initialization password which will also be used as `admin` user password (do not pick `admin` as password as it generates issues)
- `TEST_BASE_URL=https://localhost:8005`
- `TEST_SKIP_SETUP=false`, avoid to execute bootstrap setup tests for already initialized Rancher instances, it has to be toggled in case of new instances

You will have to run your local instance at this point:

- `yarn dev`

Finally run one of the 2 commands:

- `yarn cy:open`, if you want to select the tests from the browser
- `yarn cy:run`, if you want to run ALL the tests in background

For further information, consult [official documentation](https://docs.cypress.io/guides/guides/command-line#cypress-open).

### Setup for dashboard purposes ONLY

If you want your tests to be tracked on Cypress dashboards you will have to enable the following:

- `TEST_PROJECT_ID` // Project ID used by Cypress/Sorry cypress to run the tests
- `TEST_RUN_ID` (optional) // Identifier for your dashboard run, default value is timestamp

## E2E Dashboard 

### Self-hosted: Sorry Cypress

Link to the dashboard: http://139.59.134.103:8080/

E2E tests can be added and displayed in a dashboard by defining the project ID with the env var `TEST_PROJECT_ID`, then run the script:

```bash
yarn cy:run:sorry
```

### Cypress dashboard installation guide

The setup is done using a cloud hosting service and with its IP we configured the Sorry Cypress as indicated in the [guide](https://docs.sorry-cypress.dev/guide/dashboard-and-api). The process is straightforward, except for the IP which is required to be overwritten within `minio.yml` manifest as the default `http://localhost` value generate CORS issues.

### Cypress Dashboard

E2E tests can be displayed in Cypress dashboard by defining the project ID with the env var `TEST_PROJECT_ID`, then run the script by passing the parameters

```bash
yarn cy:run --record --key YOUR_RECORD_KEY_HERE
```

These values are provided when you create a new project within Cypress dashboard or within `Project settings`.

It's also possible to run a workflow in GitHub Actions E2E test using these values to record on personal dashboards.

## Local and CI/prod run

It is possible to start the project and run all the tests at once with a single command. There's however a difference between `dev` and `production` run. The first will not require an official certificate and will build the project in `.nuxt`, while the production will enable all the SSL configurations to run encrypted.

- `yarn e2e:pre-dev`, to optionally initialize Docker and build the project, if not already done
- `yarn e2e:dev`, single run local development
- `yarn e2e:pre-prod`, to optionally initialize Docker and build the project, required for GitHub Actions
- `yarn e2e:dev`, for production use case and CI, which will also restart Docker and build the project

## Custom Commands

As Cypress common practice, some custom commands have been created within `command.ts` file to simplify the development process. Please consult Cypress documentation for more details about when and how to use them.

Worth mentioning the `cy.getId()` and `cy.findId()` commands, as it is mainly used to select elements. This would require to add `data-testid` to your element inside the markup and optionally matchers.

## Writing tests

Test specs should be grouped logically, normally by page or area of the Dashboard but also by a specific feature or component.

Tests should make use of common Page Object (PO) components. These can be pages or individual components which expose a useful set of tools, but most importantly contain the selectors for the DOM elements that need to be used. These will ensure changes to the underlying components don't require a rewrite of many many tests. They also allow parent components to easily search for children (for example easily finding all anchors in a section instead of the whole page). Given that tests are typescript it should be easy to explore the functionality.

Some examples of PO functionality

```ts
HomePage.gotTo()
new HomePagePo().checkIsCurrentPage()
new BurgerMenuPo().clusters()
new AsyncButtonPO('[data-testid="my-button"]').isDisabled()
new LoginPagePo().username().set('admin')
```

POs all inherit a root `component.po`. Common component functionality can be added there. They also expose their core cypress (chainable) element.

There are a large number of pages and components in the Dashboard and only a small set of POs. These will be expanded as the tests grow.

Note: When selecting an element be sure to use the attribute `data-testid`, even in case of lists where elements are distinguished by an index suffix.

## Tips

The Cypress UI is very much your friend. There you can click pick tests to run, easily visually track the progress of the test, see the before/after state of each cypress command (specifically good for debugging failed steps), see https requests, etc.

Tests can also be restricted before cypress runs, or at run time, by prepending `.only` to the run.

```ts
describe.only('Burger Side Nav Menu', () => {
  beforeEach
```

```ts
it.only('Opens and closes on menu icon click', () => {
```

## Data testid naming

While defining naming, always consider deterministic usage and rely on specific values. For cases where the content is required, e.g. select name specific elements as in cluster selection, consider use the `contain()` method. Further guideline and explanation in the official documentation related section.

In case of complex component, define a prefix for your `data-testid` with a the prop `componentTestid` and a default value. This will help you to define unique value and composable identifier in case of more elements, as well to avoid custom term for each test if not necessary, e.g. no multiple elements.

E.g. given the action menu:

```ts
/**
 * Inherited global identifier prefix for tests
 * Define a term based on the parent component to avoid conflicts on multiple components
 */
componentTestid: {
  type:    String,
  default: 'action-menu'
}
```

```html
<li
  v-for="(option, i) in options"
  :key="opt.action"
  :data-testid="componentTestid + '-' + i + '-item'"
>
```

## Debugging

To summarize what [defined in the documentation](https://docs.cypress.io/guides/guides/debugging), the following modalities of debugging are provided:

- `debugger` flag
- `.debug()` as chained command
- `cy.pause()` for analyzing the state of the test
- Inspect commands in the Cypress dashboard to view the logs
- `.then(console.log)` to append the log to the resolved promise


These values are provided when you create a new project within Cypress dashboard or within `Project settings`.

## Coverage

Both unit and E2E tests generate coverage respectively with Jest and NYC. These values are generated on both PR and push to `master` and `release` after merging. The service used to display the values is Codecov and can be found [here](https://app.codecov.io/gh/rancher/dashboard).

Special attention goes to the E2E as the code is instrumented with Babel and the configuration is set within Nuxt.js.

# E2E Tests

This repo is configured for end-to-end testing with [Cypress](https://docs.cypress.io/api/table-of-contents) and the CI will run using a blank state of Rancher executed locally. The aim is however to enable also tests using remote instances of Ranchers.

Because of this, we extend the [Cypress best practices](https://docs.cypress.io/guides/references/best-practices#How-It-Works), so be sure to read them before write any test.

## Quick start

> This covers running E2E tests locally in a vanilla environment

### Pre-requisites

- Instance of Rancher deployed and set up (passed setup pages)
- Dashboard running locally at the default address (`https://localhost:8005`) pointing to the set up rancher

### Run the tests

This will start the cypress test runner, where you can select which tests to run

```bash
TEST_PASSWORD=<rancher admin password> TEST_SKIP=setup yarn cy:open
```

## Initial Setup

For the cypress test runner to consume the UI, you should specify the environment variables. This may change based on the type of tests you may want to run.

### Setup for remote tests

For tests against a deployed Rancher, e.g. on Digital Ocean, mainly for analyzing the project current state.

- `TEST_USERNAME`, default `admin`
- `TEST_PASSWORD`, user password or custom during first Rancher run
- `TEST_BASE_URL`, the address of your instance
- `TEST_SKIP=setup`, we avoid setup as your instance is already set

> Note: If you want to generate code coverage information, you must enable code instrumentation by setting `TEST_INSTRUMENT` to `true`.

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
- `TEST_SKIP=setup`, avoid to execute bootstrap setup tests for already initialized Rancher instances, it has to be toggled in case of new instances

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

### Skip and only features

Existing `TEST_SKIP_SETUP` logic has been replaced with something more generic included in the `cypress.ts` script/utility.
It is now possible to skip features by using the `TEST_SKIP` env var, e.g. `TEST_SKIP=setup`.
Alternatively is possible to solely run a specific feature by using the `TEST_ONLY` env var, e.g. `TEST_ONLY=setup`.
The features are folder name based and can be found in `cypress/e2e/tests/pages`.

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

### Skip dashboard or tests

CI gates can be disabled in the following way:

- Use label `ci/skip-e2e` to skip the E2E tests in the PR
- Use label `ci/skip-e2e-cypress-dashboard` to run the E2E tests without Sorry Cypress dashboard in the PR (it will enable `TEST_DISABLE_DASHBOARD_LABEL` env var)
- Use GitHub settings and define env var `TEST_DISABLE_DASHBOARD` as `true` (which is string and not boolean) to disable the Cypress dashboard entirely in every CI run

## Local and CI/prod run

It is possible to start the project and run all the tests at once with a single command. There's however a difference between `dev` and `production` run. The first will not require an official certificate and will build the project in `dist`, while the production will enable all the SSL configurations to run encrypted.

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

### Best Practices

#### data-testid
When selecting an element priority should be given to the attribute `data-testid`, if this does not exist using a specific css selector can be used.
- In some cases, including lists, the data-testid is dynamically created with a context prefix or index, so check the DOM even if it code it's not obvious

#### Environment State - Pre / Post Test

##### Initial State
If the test needs a specific state it should not be assumed that the Rancher instance is in that state, it should be confirmed or setup before the test starts.

- Avoid using shaky foundations for a test. For example checking pods in the `cattle-system` namespace which will change a lot after Rancher is provisioned (and tests run immediately against it)
- Test needs 500 events, tests create pods to create those events. 9/10 there's enough events, 1/10 there are not and the test will fail
- Test expects helm repos to be added and ready, however slow Rancher setup means these are in flux

##### Finishing State
If the tests have altered the state of the Rancher instance they should return it back to it's original state after the tests have run

*Included (Examples)*
- created resources
- language selected
- filtering by namespace

*Not included*
- Page the user is on
- Logged in state

##### Hooks
Utilize the `beforeAll` and `afterAll` hooks to setup the test, and then clean up afterwards. Be careful though, these won't run again if Cypress retries individual failed tests

Returning the environment to it's original state via afterAll is important to avoid subsequent tests being affected, for example by resources created during test execution.


#### Resources In tests
When the test needs to exercise the UI with resources, where possible, they should be actual resources. Where not possible they can be mocked locally (in a scalable way).

*Resource Names*
Names of resources should almost always come from the `createE2EResourceName` command. This pre/post fixes a run id to the name and makes it really clear when e2e tests leave stale resources around. In the future it also opens us up to automatically cleaning them up

##### Creating resources
Resources can either be created
- Preferred - Via cy commands calling the Rancher API
- Via the UI itself

##### Mocking Resources
`cy.intercept` can be used to intercept http requests and return mock resources.

- Mock resources can be brittle and verbose, but are good for testing at scale
- Ideally we need a library of `create<ResourceType>` functions that can be called 100s of times if required (rather than hardcoding 100s of resources)

*revision / resourceRevision*
Mock resources should `revision` (resource) and `resourceRevision` (list) properties to `CYPRESS_SAFE_RESOURCE_REVISION`. A value that's too low can results in CPU impactful spam

1. UI makes a request to fetch a resource, mock resource with too low revision is provided
1. UI tries to watch resource over websocket with the too low revision
1. Rancher rejects the too low revision
1. UI tries to fix this by fetching the resource, but the mock resource with too low revision is returned again
1. Repeat ad nauseam

A revision will be too low depending on the Rancher instance.

#### Excluding a test

*Track how to include*
Add a comment referencing an issue that will lead to the test being included again

*Avoid `skip`*

To exclude a test the jasmine `.skip` notation can be used. However this can cause havoc with grep tags / sorry cypress ending in longer running test runs and fluff results.

It's better to just comment out the test instead.

#### Where's my Page Object?

Page Objects (POs) generally represent UI components or pages.

A UI component could be
- quite core
  - `LabeledInput`
- intermediate
  - `ArrayList` (contains `LabeledInput`s),
  - `shell/edit/networking.k8s.io.ingress/Certificate.vue` (contains `ArrayList`)
- singular at the page level
  - `shell/edit/networking.k8s.io.ingress/index.vue` (contains `networking.k8s.io.ingress/Certificate.vue`)
- generic, and singular at the page level
  - `shell/components/ResourceDetail/index.vue` (contains `shell/edit/networking.k8s.io.ingress/index.vue`)

A Page component could be more conceptual, for example the `Edit Service` page (which under the hood is `shell/pages/c/_cluster/_product/_resource/_id`).

**When writing tests start by first searching at the page level and then working further down the stack towards the core component. Once a PO is found work back up the stack, implementing POs as required.**

##### Example
Considering the chain above, if we were to test the Create/Edit Ingress's page's Certificate tabs Hosts list consider the DOM

```
<div data-v-9b95c6bc="" data-testid="array-list-box0" class="box">
  <div data-v-9b95c6bc="" class="value">
    <div data-v-33afc918="" data-v-9b95c6bc="" class="labeled-input edit compact-input">
      <input data-v-33afc918="" type="text" placeholder="e.g. bar" autocomplete="off" autocapitalize="off" data-testid="labeled-input-0" class="no-label">
        <div data-v-33afc918="" class="labeled-tooltip error hoverable"><i class="icon status-icon icon-warning has-tooltip" data-original-title="null"></i></div>
      </input>
    </div>
  </div>
  <div data-v-9b95c6bc="" class="remove">
    <button data-v-9b95c6bc="" type="button"  data-testid="remove-item-0" class="btn role-link">
        Remove
    </button>
  </div>
</div>
```

- 1/10 - Not great
  - in the spec file create a LabeledInput PO to access the first entry using the selector `data-testid="labeled-input-0"`
- 2/10 - Not much better
  - in the spec file create a ArrayList PO to to access the first entry using the selector `data-testid="array-list-box0"`
- 3/10 - Still not there
  - in `cypress/e2e/po/edit/ingress.po.ts` create functions that directly return either of above
- 10/10 - Top of the class
  - find the page level PO for the Ingress edit page `cypress/e2e/po/edit/ingress.po.ts`
    - this is where the access chain should start
  - discover it has no way to access the Certificates component, so create a `cypress/e2e/po/edit/ingress/certificates.po.ts` called `IngressCertificatesPo`
    - Expose the new PO in `cypress/e2e/po/edit/ingress.po.ts` as a new method `.certificates(): IngressCertificatesPo`
  - in `IngressCertificatesPo` create a new method `hostsArrayList` that returns an `ArrayList`
  - in `IngressCertificatesPo` create a method `hosts(index: number)` that returns a new LabelSelect given `.hostsArrayList(index)`
  - this all means in the spec file we can do `<page po instance>.certificates.hosts(x)...`

The best case scenario means future test creates will be able to easily
- understand the ingress test
- write new or expands tests around external addresses, or other features on the page

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

> Note: To enable instrumentation required for code coverage, you must set the environment variable `TEST_INSTRUMENT` to `true`.

## Cypress Tags (cypress-grep plugin)

`[cypress-grep](https://github.com/cypress-io/cypress/tree/develop/npm/grep#cypressgrep)` is a plugin that is integrated with our project to group e2e tests by adding tags to them.

Reasons we are grouping our tests:

- To add test coverage for different types of users
- Split tests for different features
- Parallelization within CI
- In the future support sets of tests specific to the context they run in (PR CI, overnight, etc).

### E2E with user role tags

Tags currently in use for the roles are `@adminUser` and `@standardUser`.

We use `GREP_TAGS` and `TEST_USERNAME` environment variables to execute all tests which contain @admin or @standardUser tags respectively:

E.g. when running locally:

```bash
GREP_TAGS=@adminUser TEST_USERNAME=admin yarn cy:run

OR 

GREP_TAGS=@standardUser TEST_USERNAME=<standard user username> yarn cy:run

```

More info about cypress-grep plugin can be found [here](https://www.npmjs.com/package/@cypress/grep#filter-with-tags).

### E2E with feature tags

As part of parallelization process and identification of features, tags have been added following the file tree structure of `cypress/e2e/tests/pages`.
These are the added specs tags for each category: `@components`, `@navigation`, `@charts`, `@explorer`, `@extensions`, `@fleet`, `@generic`, `@globalSettings`, `@manager`, `@userMenu`, `@usersAndAuths`.

### E2E tests parallelization in CI

Tests in CI are executed in parallel within GitHub workflow, reducing drastically time and avoiding to slow down the machine as it may happen with the flag `--parallel` of Cypress, which will use and need a machine with more cores.
This process is achieved using [job matrix](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs) definitions with objects where we intersect user roles and features.

Current matrix state:

```yaml
matrix:
  role: [
    { username: 'admin', tag: '@adminUser' }, 
    { username: 'standard_user', tag: '@standardUser' }
  ]
  features:  [
    ['@navigation', '@extensions'],
    ['@charts'],
    ['@explorer'],
    ['@fleet'],
    ['@generic', '@globalSettings'],
    ['@manager'],
    ['@userMenu', '@usersAndAuths'],
    ['@components'],
  ]
```

In this case the tags defined for the process will then become `GREP_TAGS=@adminUser+@generic`. This means that the tests will need to have both tags to be executed.
Some tests have been paired due GH limits of concurrent jobs and have then been defined as `@adminUser+@generic @adminUser+@globalSettings`. It means that either one of the 2 combinations which be considered as filter criteria.
To summarize, space between tags is considered as `AND` operator, while `+` is considered as `OR` operator.

To allow re-run of flaky tests only which may fail, the job is flagged as `fail-fast: false` and will prevent to interrupt the others.

**DISCLAIMER:** It is not possible to execute multiple tests with the same ID and therefore for the temporary test initialization where we use the setup, the configuration will have extra tags such like `@adminUserSetup` and `@standardUserSetup`. This will be replaced with a script as planned.

## Cypress Utilities

In case of logic used within the E2E, utilities can be defined in `scripts/cypress.ts` and tested in the related file with unit tests.

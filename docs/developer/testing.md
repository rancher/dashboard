# Testing

## E2E Tests

This repo is configured for end-to-end testing with [Cypress](https://docs.cypress.io/api/table-of-contents) and the CI will run using a blank state of Rancher executed locally. The aim is however to enable also tests using remote instances of Ranchers.

Because of this, we extend the [Cypress best practices](https://docs.cypress.io/guides/references/best-practices#How-It-Works), so be sure to read them before write any test.

### Initial Setup

For the cypress test runner to consume the UI, you should specify the environment variables:

- Local authentication credentials
  - `TEST_USERNAME`, default `admin`
  - `TEST_PASSWORD`, user password or custom during first Rancher run
  - `CATTLE_BOOTSTRAP_PASSWORD`, initialization password which will also be used as `admin` password (do not pick `admin`)
- `TEST_BASE_URL` // URL used by Cypress to run the tests, default `https://localhost:8005`
- `TEST_SKIP_SETUP` // Avoid to execute bootstrap setup tests for already initialized Rancher instances
- Dashboard
  - `TEST_PROJECT_ID` // Project ID used by Cypress/Sorry cypress to run the tests
  - `TEST_RUN_ID` (optional) // Identifier for your dashboard run, default value is timestamp

### Development with watch/dev

While writing the tests, you can simply run Rancher dashboard and then open the Cypress dashboard with the commands

- `yarn dev`
- `yarn cy:open`

The Cypress dashboard will contain the options and the list of test suites. These will automatically re-run if they are altered (hot reloading).

For further information, consult [official documentation](https://docs.cypress.io/guides/guides/command-line#cypress-open).

### E2E Dashboard 

#### Self-hosted: Sorry Cypress

Link to the dashboard: http://139.59.134.103:8080/

E2E tests can be added and displayed in a dashboard by defining the project ID with the env var `TEST_PROJECT_ID`, then run the script:

```bash
yarn cy:run:sorry
```

#### Cypress Dashboard

E2E tests can be displayed in Cypress dashboard by defining the project ID with the env var `TEST_PROJECT_ID`, then run the script by passing the parameters

```bash
yarn cy:run --record --key YOUR_RECORD_KEY_HERE
```

These values are provided when you create a new project within Cypress dashboard or within `Project settings`.

It's also possible to run a workflow in GitHub Actions E2E test using these values to record on personal dashboards.

### Local and CI/prod run

It is possible to start the project and run all the tests at once with a single command. There's however a difference between `dev` and `production` run. The first will not require an official certificate and will build the project in `.nuxt`, while the production will enable all the SSL configurations to run encrypted.

- `yarn e2e:pre-dev`, to optionally initialize Docker and build the project, if not already done
- `yarn e2e:dev`, single run local development
- `yarn e2e:pre-prod`, to optionally initialize Docker and build the project, required for GitHub Actions
- `yarn e2e:dev`, for production use case and CI, which will also restart Docker and build the project

### Custom Commands

As Cypress common practice, some custom commands have been created within `command.ts` file to simplify the development process. Please consult Cypress documentation for more details about when and how to use them.

Worth mentioning the `cy.getId()` and `cy.findId()` commands, as it is mainly used to select elements. This would require to add `data-testid` to your element inside the markup and optionally matchers.

### Writing tests

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

### Tips

The Cypress UI is very much your friend. There you can click pick tests to run, easily visually track the progress of the test, see the before/after state of each cypress command (specifically good for debugging failed steps), see https requests, etc.

Tests can also be restricted before cypress runs, or at run time, by prepending `.only` to the run.

```ts
describe.only('Burger Side Nav Menu', () => {
  beforeEach
```

```ts
it.only('Opens and closes on menu icon click', () => {
```

### Data testid naming

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

### Debugging

To summarize what [defined in the documentation](https://docs.cypress.io/guides/guides/debugging), the following modalities of debugging are provided:

- `debugger` flag
- `.debug()` as chained command
- `cy.pause()` for analyzing the state of the test
- Inspect commands in the Cypress dashboard to view the logs
- `.then(console.log)` to append the log to the resolved promise

### Cypress Dashboard

E2E tests can be displayed in Cypress dashboard by adding the key `"projectId": "YOUR_PROJECT_ID_HERE"` to the `cypress.json` file and run the script by passing the parameters

```bash
yarn cy:run  --record --key YOUR_RECORD_KEY_HERE
```

These values are provided when you create a new project within Cypress dashboard or within `Project settings`.

## Unit tests

The dashboard is configured to run unit tests with Jest in combination of vue-test-utils, for Vue scoped cases.

Requirements to accept tests:

- JS and TS formats
- Suffix with `.test` or `.spec`
- Contained in any directory `__tests__`

Adopted commands:

- `yarn test`, run and watch every test
- `yarn test:ci`, script used for CI, which outputs a coverage report to `/coverage` folder

Example tests can be found in `/components/__tests__`. For more information about testing vue components, see the [vue test utils](https://vue-test-utils.vuejs.org/) and [jest](https://jestjs.io/docs/getting-started) docs.

### VSCode debugging tools

It is possible to use debugging tools within Jest via VSCode. To do so, open the debugger panel (Ctrl/Cmd+Shift+D) and select the `Debug Jest Tests` option from the dropdown. This will start a debug session with the Jest tests, allowing you to set breakpoint, inspect code and visualize variables on the panel itself. As usual it's possible to execute the tests by `F5` after selecting the right option.

### Style guide

On top of the recommendation provided by the [Vue documentation](https://vuejs.org/guide/scaling-up/testing.html), it is also encouraged to follow these patterns to create readable and aimed tests.

#### Describe and test/it statement

To clearly state the scope of the test, it's convenient to define in the first `describe` always define with a noun the name of the function, method, or component being tested. Multiple assertions may be grouped together under a common statement in `describe` block, as it helps to avoid repetition and ensure a set of tests to be included. Each `test`/`it` block should then start with a verb related to what is the expectation.

```ts
describe('myfunction', () => {
  describe('given the same parameter', () => {
    it('should return the same result', () => {
      // Test code
    });
   
    it('should return something else for a second parameter', () => {
      // Test code
    });
  });
});
```

For further information, consult the [Jest API](https://jestjs.io/docs/api#describename-fn) documentation.

#### Simple tests

Test with the highest readability and reliability should avoid logic, as this will increase line of code and have to be tested as well. Static data is then preferred over computation and should be declared always within the describe or test or as close as possible.

Don't:

```ts
test('define if is required to use this in our component from the response', () => {
  const myData = externalFunction(externalData);

  for(data in myData) {
    data.key = 'something else'
  }
  
  expect(isRequired(myData)).toBe(true);
});
```

Do:

```ts
describe('FX: isRequired', () => {
  test('should return true', () => {
    const myData = { key: 'required case' };
    
    const result = isRequired(myData);

    expect(result).toBe(true);
  });
});
```

#### AAA pattern

Adoption of AAA format (arrange, act, assert) for tests. 

- Arrange is where you prepare test, e.g. set properties to a component or declare variables
- Act is when an event or function is triggered
- Assertion correspond to the expectation of the test

Don't:

```ts
describe('FX: isRequired', () => {
  test('should return true', () => {
    let myData = { key: 'required case' };

    expect(myData).toBeTruthy();

    myData.key = 'something else';
    const result = isRequired(myData);

    expect(result).toBe(true);

    myData['key2'] = 'another key/value';

    expect(result).toBe(false);
  });
});
```

Do:

```ts
describe('FX: isRequired', () => {
  test('should return true', () => {
    const myData = { key: 'required case' };
    
    const result = isRequired(myData);

    expect(result).toBe(true);
  });

  test('should return false if malformed data', () => {
    const myData = {
      key: 'required case',
      key2: 'another key/value'
    };
    
    const result = isRequired(myData);

    expect(result).toBe(false);
  });
});
```

#### Behaviors over implementations

As also defined in the Vue documentation for [component](https://vuejs.org/guide/scaling-up/testing.html#component-testing) and [composable testing](https://vuejs.org/guide/scaling-up/testing.html#testing-composables), it is recommended to test rendered elements over internal API of the component.

Following an input example as in the [documentation](https://v2.vuejs.org/v2/cookbook/unit-testing-vue-components.html?redirect=true#Base-Example).

Don't:

```ts
const wrapper = mount(YourComponent);
const inputWrapper = wrapper.find(`[data-testid=your-component]`;

inputWrapper.setValue(1);

expect(wrapper.emitted('input')[0][0]).toBe(1);
```

Do:

```ts
const wrapper = mount(YourComponent);
const inputWrapper = wrapper.find(`[data-testid=your-component]`;

inputWrapper.setValue(1);

expect(wrapper.text()).toContain('1')
```

#### Parameterization

When multiple cases are required to be tested for the same component, it is recommended to avoid multiple actions and assertions or even worse logic, but rather rely on Jest functions to parametrize the test.

Don't:

```ts
describe('FX: isRequired', () => {
  test('should return true', () => {
    let myData = { key: 'required case' };

    expect(myData).toBeTruthy();

    myData.key = 'something else';

    expect(result).toBe(true);

    myData.key = 'another value';

    expect(result).toBe(true);
  });
});
```

Do:

```ts
describe('FX: isRequired', () => {
  test.each([
    'required case',
    'something else',
    'another value',
  ])('should return true', (key) => {
    const myData = { key };
    
    const result = isRequired(myData);

    expect(result).toBe(true);
  });
});
```

# Testing

## E2E Tests

This repo is configured for end-to-end testing with [Cypress](https://docs.cypress.io/api/table-of-contents).

### Initial Setup

For the cypress test runner to consume the UI, you must specify two environment variables, `TEST_USERNAME` and `TEST_PASSWORD`. By default the test runner will attempt to visit a locally running dashboard at `https://localhost:8005`. This may be overwritten with the `DEV_UI` environment variable. Run `yarn e2e:dev` to start the dashboard in SSR mode and open the cypress test runner. Run tests through the cypress GUI once the UI is built. Cypress tests will automatically re-run if they are altered (hot reloading). Alternatively the dashboard ui and cypress may be run separately with `yarn dev` and `yarn cypress open`.

### Writing tests

Test specs should be grouped logically, normally by page or area of the Dashboard but also by a specific feature or component.

Tests should make use of common Page Object (PO) components. These can be pages or individual components which expose a useful set of tools, but most importantly contain the selectors for the DOM elements that need to be used. These will ensure changes to the underlying components don't require a rewrite of many many tests. They also allow parent components to easily search for children (for example easily finding all anchors in a section instead of the whole page). Given that tests are typescript it should be easy to explore the functionality.

Some examples of PO functionality

```ts
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

```ts
describe.only('Burger Side Nav Menu', () => {
  beforeEach
```

```ts
it.only('Opens and closes on menu icon click', () => {
```

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

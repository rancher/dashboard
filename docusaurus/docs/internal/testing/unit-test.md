# Unit Tests

The dashboard is configured to run unit tests with Jest in combination of vue-test-utils, for Vue scoped cases.

Requirements to accept tests:

- JS and TS formats
- Suffix with `.test` or `.spec`
- Contained in any directory `__tests__`

Adopted commands:

- `yarn test`, run and watch every test
- `yarn test:ci`, script used for CI, which outputs a coverage report to `/coverage` folder

Example tests can be found in `/components/__tests__`. For more information about testing vue components, see the [vue test utils](https://vue-test-utils.vuejs.org/) and [jest](https://jestjs.io/docs/getting-started) docs.

## VSCode debugging tools

It is possible to use debugging tools within Jest via VSCode. To do so, open the debugger panel (Ctrl/Cmd+Shift+D) and select the `Debug Jest Tests` option from the dropdown. This will start a debug session with the Jest tests, allowing you to set breakpoint, inspect code and visualize variables on the panel itself. As usual it's possible to execute the tests by `F5` after selecting the right option.

## Style guide

On top of the recommendation provided by the [Vue documentation](https://vuejs.org/guide/scaling-up/testing.html), it is also encouraged to follow these patterns to create readable and aimed tests.

## Jest global configuration

Some of the global configuration for Jest can be found in the `jest.setup.js` file, mainly to avoid repetitions. This will include:

- Global Vue mounted
  - Components
  - Modules
  - Directives
  - Getters (e.g., i18n/t)
- Global hooks, e.g. `afterEach()` with mocks resets

### Describe and test/it statement

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

### Simple tests

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

### AAA pattern

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

### Behaviors over implementations

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

### Parameterization

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

## Coverage

Both unit and E2E tests generate coverage respectively with Jest and NYC. These values are generated on both PR and push to `master` and `release` after merging. The service used to display the values is Codecov and can be found [here](https://app.codecov.io/gh/rancher/dashboard).

Special attention goes to the E2E as the code is instrumented with Babel and the configuration is set within Nuxt.js.

# Extensions Tests

The Extensions framework is tested by the GitHub action `check-plugins.yaml`. This runs the script `./shell/scripts/test-plugins-build.sh`
which runs the actual tests.

The tests check the following:

- Ensures that Verdaccio is installed and running locally (Verdaccio provides a local NPM registry that the tests can use to publish packages without having to publish to npm)
- Verifies the build of the following, by building and then publishing them to the local registry
  - Shell
  - Yarn Creator packages
  - Rancher components package
- Verifies that a new app can be created with the `@rancher/app` creator and built (test case of a new extension in a new repository)
- Verifies that an extension can be added with the `@rancher/pkg` creator to the new app and that the dashboard build passes with the new extension present
- Verifies that the extension can be build standalone
- Verifies that an extension can be added to the existing dashboard and that the dashboard build passes with the new extension present

## Possible causs of test failures

### Dependencies

For the standalone case of a new app using the `@rancher/shell` package, the dependency versions can end up being different to that of the dashboard codebase. This is typically due to dependencies being top-level dependencies in the case of the dashboard codebase, but child dependencies in the case of the new app. In the later case, yarn can hoist dependency versions differently.

### Imports

Importing Vue components using the `~` syntax should not be used - this will build in the case of the dashboard repository, but not in the case of a standalone app.

## Running Tests locally

You can run the script `./shell/scripts/test-plugins-build.sh` locally in a terminal to run the test suite on a developer machine.

> Note: After running the tests the `package.json` files in `shell` and `pkg/rancher-components` will be modified - ensure you reset these and do not check in changes.
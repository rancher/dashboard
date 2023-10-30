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

## Running Tests locally

You can run the script `./shell/scripts/test-plugins-build.sh` locally in a terminal to run the test suite on a developer machine.

Run the script with `-h` to see the list of options available.

## Possible causes of test failures

### Dependencies

For the standalone case of a new app using the `@rancher/shell` package, the dependency versions can end up being different to that of the dashboard codebase. This is typically due to dependencies being top-level dependencies in the case of the dashboard codebase, but child dependencies in the case of the new app. In the later case, yarn can hoist dependency versions differently.

To debug this situation, run the test script with `-i -k` - this will only run the standalone tests (`-i` ignores the in-tree tests) and will keep the generate application after the test run (`-k`).

After the test run, cd to the test app folder (as logged by the test run) and then cd into the `test-app` folder.

If you run `yarn build` you should see the same error that the tests reported.

Dependency errors can occur in the in-tree tests (these create an extension in the dashboard repository folder and test with the dashboard shell code in-tree, rather than being referenced by the shell package).

To run only the in-tree tests, run the test script with `-s` - this will ignore the standalone tests. Additionally, running with `-e` will keep the test extension in the folder `./pkg/test-pkg`.

To debug, run: `yarn build-pkg test-pkg` and you should see the same error as the in-tree test report.

### Imports

Importing Vue components using the `~` syntax should not be used - this will build in the case of the dashboard repository (in-tree test), but not in the case of a standalone app (standalone test).


## Node Dependencies

Dependencies are managed via `package.json` and `yarn`

- To install dependencies use `yarn install`. This will fail if dependencies and versions listed in `package.json` are out of step with the `yarn.lock` file
- To add a dependency use `yarn run add:no-lock ...` instead of `yarn add`
- To upgrade a dependency use `yarn run upgrade:no-lock ...` instead of `yarn upgrade`
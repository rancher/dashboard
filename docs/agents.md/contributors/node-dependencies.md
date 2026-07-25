## Node Dependencies

Dependencies are managed via `package.json` and `yarn` (Yarn Berry, pinned through the `packageManager` field and activated with Corepack)

- To install dependencies use `yarn install`. CI uses `yarn install --immutable`, which fails if the dependencies and versions listed in `package.json` are out of step with the `yarn.lock` file
- To add a dependency use `yarn add ...`
- To upgrade a dependency use `yarn up ...`
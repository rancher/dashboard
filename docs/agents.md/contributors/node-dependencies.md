## Node Dependencies

Dependencies are managed via `package.json` and `yarn` (Yarn Berry, pinned through the `packageManager` field and activated with Corepack)

- To install dependencies use `yarn install`. Every `.yarnrc.yml` sets `enableImmutableInstalls: true`, so this fails if the dependencies and versions listed in `package.json` are out of step with the `yarn.lock` file, rather than silently rewriting the lockfile. Never work around this by passing `--no-immutable`
- To add a dependency use `yarn add -E ...`
- To upgrade a dependency use `yarn up -E ...`
- Always pass `--exact` (`-E`). Without it `yarn add`/`yarn up` write a caret range, which breaks the rule that all dependencies are pinned to a specific patch version
- `yarn add` and `yarn up` are unaffected by `enableImmutableInstalls` and update `yarn.lock` as normal. Commit the resulting `yarn.lock` changes and review them carefully
- `npmMinimalAgeGate: 7d` means `yarn add`/`yarn up` will not resolve to a version published within the last 7 days, matching the Dependabot cooldown
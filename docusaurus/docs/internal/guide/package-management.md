# Package Management

NPM Package dependencies can be found in the usual `./package.json` file. There is also `./yarn.lock` which fixes referenced dependency's versions.

Changes to these files should be kept to a minimum to avoid regression for seldom used features (caused by newer dependencies changing and breaking them).

Changes to `./yarn.lock` should be reviewed carefully, specifically to ensure no rogue dependency url is introduced.

## Pinning
All dependencies in any `package.json` should be pinned to a specific patch version

Note that `yarn add` and `yarn up` default to writing a caret range (`^1.2.3`), which would break this rule. Always pass `--exact` (`-E`):

```sh
yarn add -E <package>
yarn up -E <package>
```

## Restrictions

### Immutable installs

Every `.yarnrc.yml` in the repository sets `enableImmutableInstalls: true` to apply immutable installs by default everywhere, rather than only in CI. Without it Yarn allows local developer installs to rewrite `yarn.lock`. Immutable installs ensure that malicious or unexpected dependency bumps are not installed/used in cases where a dependency does not pin to a specific version.

Under an immutable install Yarn regenerates the lockfile in memory, compares it against the one on disk, and aborts with a diff of the difference if they do not match. It also aborts if the lockfile does not exist.

Immutability applies only to `yarn install`. `yarn add ...` and `yarn up ...` are unaffected and update `yarn.lock` as normal.

For the rare case where `yarn install` must rebuild the lockfile, use one of the following:

```sh
yarn install --no-immutable
YARN_ENABLE_IMMUTABLE_INSTALLS=false yarn install
```

Do not use these to work around a failing install in this repository. A failure means `package.json` and `yarn.lock` have drifted, and the fix is to make the intended change with `yarn add`/`yarn up` and commit the lockfile.

### Minimum release age

Every `.yarnrc.yml` also sets:

```yaml
npmMinimalAgeGate: 7d
```

Yarn will not resolve to a package version published within the last 7 days, which reduces exposure to compromised releases. This mirrors the `cooldown.default-days: 7` setting used in `.github/dependabot.yml`.


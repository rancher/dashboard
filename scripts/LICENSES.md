# Third-party licenses

The dashboard ships a `licenses.json` file listing every npm package that
ends up in the bundle, along with the full text of each package's license.
The `/licenses` page in the app reads this file at runtime.

## Files

- `licenses.json` (repo root) — the committed bundle. Shipped to production.
- `scripts/analyze-licenses` — generates `licenses.json` from a webpack build.
- `scripts/lib/MIT.license.md` — fallback template used when an MIT-licensed
  package ships without a `LICENSE` file.

## Regenerating `licenses.json`

When you add, remove, or upgrade a bundled dependency:

```sh
ANALYZE_LICENSES=true yarn build
node ./scripts/analyze-licenses -u
git add licenses.json
```

`ANALYZE_LICENSES=true` tells [`shell/vue.config.js`](../shell/vue.config.js)
to emit `dist/report.json` via `webpack-bundle-analyzer`. The script reads
that report to enumerate the packages that actually made it into the bundle
(transitive deps included), resolves each one's license text from — in
order — its `LICENSE` file, its README's `License` section, GitHub's
Contents API, or the MIT template above, and (with `-u`) writes the result
to `licenses.json`. If `dist/report.json` is missing when the script runs,
it fails immediately with a hint pointing at the build command.

## CI enforcement

The `check-licenses` job in
[`.github/workflows/test.yaml`](../.github/workflows/test.yaml) runs the
analyzer-enabled build and then the script with no flags on every PR. It:

- fails when the freshly-generated bundle differs from the committed
  `licenses.json` (dependency drift), or
- fails when any bundled package uses a license outside the allow-list
  (`MIT`, `Apache-2.0`, `BSD-3-Clause`, `ISC`, `BSD`) or has no license
  content after every fallback.

The failure message repeats the commands above.

## Script options

```
node ./scripts/analyze-licenses [options]

  -u, --update   Write the generated bundle to licenses.json at the repo
                 root. Without this, the script runs in check mode.
  -h, --help     Show help.
```

Set `GITHUB_TOKEN` in the environment to raise GitHub's 60/hr rate limit
when the script has to fall back to the Contents API for a package.

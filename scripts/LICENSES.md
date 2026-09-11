# Third-party licenses

The dashboard ships a `licenses.json` file listing every third-party npm
package that ends up in the bundle, along with the full text of each
package's license. The `/licenses` page in the app reads this file at
runtime.

Each package is listed once. The dashboard's own packages — the repo root and
any workspace declaring the same `repository` as the root `package.json` — are
not listed at all.

## Files

- `licenses.json` (repo root) — the committed bundle. Shipped to production.
- `scripts/analyze-licenses` — generates `licenses.json` from a webpack build.

## Shape

`packages` holds one record per package — `name`, `license`, the original
`licenseField` expression when it was simplified, `home`, `author`, and a
`licenseRef` key into the `licenses` map, which stores each unique license
text once as `{ text }` or `{ markdown }`. Every field except `name` and
`license` is omitted when the package doesn't declare it. Versions are
deliberately not shipped.

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
order — its `LICENSE` file, its README's `License` section, or GitHub's
Contents API, and (with `-u`) writes the result to `licenses.json`.

### Packages that ship no license text

Plenty of small npm packages declare `MIT` in `package.json` and ship no
`LICENSE` file at all. For those the script generates a short notice naming
the license the package declares and pointing at its home page, and stores
that as the package's license content. The notice says explicitly that it was
generated and is not part of the library, so nobody mistakes it for the real
terms.

The panel already shows the package's home page and author above the license
body, so the notice doesn't repeat them. It spells a URL out only for a
package with no `home` of its own, falling back to `homepage` and then the
package's npm page.

It is deliberately not a copy of the MIT text: filling in a copyright holder
and year the package never stated would put words in the author's mouth. For
the same reason the notice carries no version or date, so it doesn't churn
between runs.

This fallback is scoped to `MIT`. A missing license file under any other
license is unusual enough that it should fail the check below and get a
human's attention.

Duplicates are removed on the way out. A bundle report names many files per
package, and files with no `package.json` of their own resolve to an
ancestor's, so entries are keyed by the resolved `package.json` — one per
installed copy. Because the shipped file omits versions, copies of a package
that agree on name, license and license text then collapse to a single
record; copies whose license text differs are all kept.

If `dist/report.json` is missing when the script runs,
it fails immediately with a hint pointing at the build command.

## CI enforcement

The `check-licenses` job in
[`.github/workflows/test.yaml`](../.github/workflows/test.yaml) runs the
analyzer-enabled build and then the script with no flags on every PR. It:

- fails when the freshly-generated bundle differs from the committed
  `licenses.json` (dependency drift), or
- fails when any bundled package uses a license outside the allow-list
  (`MIT`, `Apache-2.0`, `BSD-3-Clause`, `ISC`, `BSD`) or has no license
  content after every fallback, including the generated notice.

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

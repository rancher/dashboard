# Bundling Extensions (requires Shell 3.0.15 or greater + Rancher 2.17 or later)

:::warning
Bundles require **Rancher 2.17 or later**. Earlier versions can install an umbrella
chart, but their Extensions screen does not understand bundles — it shows the members
as separate cards whose Uninstall removes nothing, leaving the bundle stuck on the
cluster. Every bundle therefore carries `catalog.cattle.io/rancher-version` with a
floor of 2.17 or later, which the build sets for you. See
[the Rancher version floor](#the-rancher-version-floor).
:::

A repository with several related extensions normally publishes one chart per extension,
so each appears as its own card on the Extensions screen and has to be installed,
upgraded and removed separately.

A **bundle** ships them as a single Helm release instead: one card, one version, one
install. It is a Helm umbrella chart whose member extension charts are vendored inside
it, so Helm applies them together.

Use a bundle when a set of extensions is only ever meaningful together. If users need
to install them independently, or they are released on unrelated cadences, publish them
individually instead.

:::note
A bundle release publishes only the bundle. Its members' charts are built, vendored
into the umbrella and never published on their own, so a bundle is always exactly one
card.

This also means a repository can release an extension **standalone and as part of a
bundle**, from the same source. The two releases write entirely separate paths and
neither rewrites the other. See [Publishing both](#publishing-both).
:::

## Declaring a bundle

Bundles are declared under `rancher.bundles` in the **root** `package.json` of the
extension repository — not in the per-package `package.json` files.

```json title="package.json"
{
  "name": "security-ui-exts",
  "version": "0.9.1",
  "rancher": {
    "bundles": [
      {
        "name": "security-ui-exts",
        "version": "1.0.0",
        "displayName": "SUSE Security",
        "description": "Vulnerability scanning and runtime enforcement for Rancher Manager",
        "icon": "https://raw.githubusercontent.com/rancher/security-ui-exts/main/pkg/vulnerability-scanner/assets/img/icon.svg",
        "homepage": "https://github.com/rancher/security-ui-exts",
        "readme": "docs/bundles/security-ui-exts/README.md",
        "keywords": ["security", "vulnerability", "runtime"],
        "noAuth": false,
        "packages": [
          "vulnerability-scanner",
          "runtime-enforcer"
        ],
        "annotations": {
          "catalog.cattle.io/rancher-version": ">= v2.17.0-0",
          "catalog.cattle.io/ui-extensions-version": ">= 3.0.0 < 4.0.0",
          "catalog.cattle.io/kube-version": ">= v1.16.0-0"
        }
      }
    ]
  }
}
```

| Property | Required | Description |
| --- | :---: | --- |
| `name` | yes | Chart name for the bundle, and its Helm release name. Must not match any directory under `pkg/`. |
| `version` | yes | The bundle's own version, independent of the root `version` and of any member's. |
| `packages` | yes | Directory names under `pkg/` to include. Each must exist and must not be listed twice. |
| `standaloneMembers` | no | Members that should *also* be offered on their own inside a [catalog image](../catalog.mdx). Must be names from `packages`. Has no effect on a branch, where tagging decides. See [Publishing both](#publishing-both). |
| `displayName` | no | Shown on the card. Becomes `catalog.cattle.io/display-name`. |
| `description` | no | Shown on the card, below the name. |
| `icon` | no | Card icon. Falls back to the default extension icon. |
| `homepage` | no | Becomes `home` in `Chart.yaml`. Omit it and the field is dropped rather than defaulting. |
| `keywords` | no | Becomes `keywords` in `Chart.yaml`. Omitted means no keywords. |
| `readme` | no | Repo-relative path to a Markdown file, shown in the extension info panel. See [Writing the README](#writing-the-readme). |
| `noAuth` | no | Set `true` if the extensions must load before a user authenticates. |
| `annotations` | no | Compatibility and certification annotations. See [Compatibility](#compatibility). |

`rancher.bundles` is an array, so a repository can declare more than one bundle.

### The version is the bundle's own

A bundle version is independent of the root `package.json` version and of its members'
versions. The card shows the **bundle's** version; members keep their own versions
internally.

Because a bundle is one Helm release, upgrade and uninstall apply to the whole set.
Upgrading moves every member to the versions that ship with the target bundle version.
A patch to a single member therefore means a new bundle version, and every user sees
that version change.

## Compatibility

Only the **bundle's** annotations decide whether its card is installable. A member's own
`rancher.annotations` are not consulted when it is installed as part of a bundle, so the
bundle must declare its own ranges:

```json
"annotations": {
  "catalog.cattle.io/rancher-version": ">= v2.17.0-0",
  "catalog.cattle.io/ui-extensions-version": ">= 3.0.15 < 4.0.0",
  "catalog.cattle.io/kube-version": ">= v1.16.0-0",
  "catalog.cattle.io/prime-only": "true"
}
```

They should be the **intersection** of the members' ranges. If one member needs Rancher
2.17 and another needs 2.18, the bundle needs `>= v2.18.0-0` — nothing checks this for
you.

### The Rancher version floor

`catalog.cattle.io/rancher-version` is the exception: its floor is always **2.17 or
later**, and `build-extensions-bundle` raises it for you. If you declare a lower floor
it is raised, if you declare none one is added, and if you declare 2.17 or later it is
left alone. The build logs whenever it changes something, so update your
`package.json` to match rather than relying on it.

Only the floor is ever touched, and only upwards. Raising it narrows the range you
declared, which is safe. Widening it is not, so the build will never drop or move an
upper bound to make a range work — where that would be the only fix, it fails and
leaves the decision to you.

So a range fails the build when **nothing from 2.17 onwards is left in it**:

| Range | Result |
| --- | --- |
| `>= 2.11.0-0 < 2.18.0-0` | raised to `>= v2.17.0-0 < 2.18.0-0` |
| `>= 2.11.0-0 <= 2.17.0` | raised, upper bound kept |
| `< 2.20.0-0` | floor added |
| `>= 2.11.0-0 < 2.17.0-0` | **fails** |
| `>= 2.13.0-0 < 2.14.0-0` | **fails** |
| `< 2.14.0-0` | **fails** |

Three more shapes fail for the same reason, since none of them can be raised without
changing what the author asked for: a `~` or `^` range, which carries its own upper
bound; an exact pin below 2.17; and a range that is already contradictory before the
floor is touched at all, such as `>= 2.18.0-0 < 2.14.0-0`.

Two fail because they cannot be read unambiguously: more than one lower bound, and
anything that is not a version range.

This is what keeps a bundle away from Rancher versions that cannot uninstall it, and
it needs no change to those versions. Rancher filters chart versions by this
annotation **server-side** — both the index it serves and the chart download itself —
so an older Rancher never sees the bundle at all. That applies equally to airgapped
installs fed from a catalog image, since a catalog image is consumed as an ordinary
`ClusterRepo` and goes through the same filtering.

:::note
Installing the umbrella chart directly with Helm, against the published URL rather
than through Rancher, bypasses this. So does downgrading Rancher below 2.17 while a
bundle is installed, since nothing re-evaluates the chart. Neither is supported.
:::

## Writing the README

Helm only exposes a chart's **top-level** README, so the READMEs of the member
extensions are not visible once they are vendored into a bundle. Point `readme` at a
file describing the suite:

```json
"readme": "docs/bundles/security-ui-exts/README.md"
```

It is rendered in the extension's information panel. If the path does not exist the
build fails; if `readme` is omitted the build warns, and the panel is empty.

## Tagging a release

Bundle releases use a dedicated tag format:

```
bundle-<bundle-name>-<version>
```

For the example above:

```
bundle-security-ui-exts-1.0.0
```

The three parts are:

- **`bundle-`** — a fixed prefix marking this as a bundle release. It is what tells the
  release pipeline to build an umbrella chart rather than a single extension, so one
  release workflow handles both kinds of release with no extra configuration.
- **`<bundle-name>`** — must match a `name` in `rancher.bundles`. It may contain hyphens.
- **`<version>`** — must match that entry's `version`.

Both the name and the version are checked against `rancher.bundles` before anything is
built. A tag naming an undeclared bundle, or declaring a version that does not match
`package.json`, cancels the run — so a mistyped version cannot publish the wrong
release.

Individual extensions keep their existing `<pkg-name>-<version>` tags, for example
`vulnerability-scanner-0.9.2`. Catalog images keep `<root-name>-<root-version>`. The
three formats are distinguishable, so a repository can use all of them.

:::note
Because the bundle name must not match any directory under `pkg/`, there is never any
ambiguity about which kind of release a tag refers to.
:::

## Releasing

No workflow changes are needed. The existing charts workflow recognises the tag format:

```yaml title=".github/workflows/release.yml"
on:
  release:
    types: [released]

jobs:
  build-extension-charts:
    uses: rancher/dashboard/.github/workflows/build-extension-charts.yml@master
    permissions:
      contents: write
      pull-requests: write
    with:
      target_branch: gh-pages
      tagged_release: ${{ github.ref_name }}
```

Publishing a GitHub release tagged `bundle-security-ui-exts-1.0.0` will:

1. build only the extensions listed in that bundle's `packages`
2. assemble them into an umbrella chart, vendoring their generated charts
3. publish the members' JavaScript under `extensions/<bundle>/<version>/`, leaving any
   standalone copies untouched
4. merge the bundle into the published Helm index, preserving every previously released
   chart version
5. commit the result to the target branch

[Catalog images](../catalog.mdx) need no extra configuration either: a catalog image
contains everything in the repository, so every declared bundle is included
automatically alongside the individual extensions.

## Publishing both

A repository can release `runtime-enforcer` on its own **and** a bundle that contains
it. They are two independent releases, each tagged in its own format, writing disjoint
paths:

```
# standalone release, tag: runtime-enforcer-0.1.1
charts/runtime-enforcer/0.1.1/
assets/runtime-enforcer/runtime-enforcer-0.1.1.tgz
extensions/runtime-enforcer/0.1.1/

# bundle release, tag: bundle-security-ui-exts-1.0.0
charts/security-ui-exts/1.0.0/              # members vendored inside
assets/security-ui-exts/security-ui-exts-1.0.0.tgz
extensions/security-ui-exts/1.0.0/runtime-enforcer/0.1.1/
```

A bundle release never writes a path a member's own release owns. It does not rewrite
the member's chart, repackage its archive, alter its annotations or change its index
entry — so an already-published version keeps its contents and its digest. The cost is
that the JavaScript exists twice when both are published, which is the price of each
release being independent.

:::warning
### In a catalog image

A catalog image is a single build over the whole repository, with no tags involved, so
nothing tells it which members you meant to offer separately. By default it offers the
bundle only — one card, matching the branch.

To offer a member on its own there too, name it:

```json
{
  "name": "security-ui-exts",
  "packages": ["vulnerability-scanner", "runtime-enforcer"],
  "standaloneMembers": ["runtime-enforcer"]
}
```

That image then carries `security-ui-exts` **and** `runtime-enforcer` as separate
cards, while `vulnerability-scanner` remains available only through the bundle. Naming
something that is not in `packages` fails the build rather than being ignored.

:::warning
An extension can only be **installed** once on a cluster, even though it can be
published twice. The backend indexes plugins by name, so a bundle and a standalone copy
of one of its members cannot both be installed at the same time.

The Extensions screen prevents this: installing a bundle is blocked while any of its
members is installed individually, and installing an extension is blocked while an
installed bundle already provides it. The card explains which one is in the way.
Uninstall it first.
:::

## Migrating from individual extensions

If the extensions are already published on their own, adding a bundle does not disturb
them. The bundle is a new chart at a new path; every previously released version keeps
its archive, its index entry and its card.

What changes is for your users, and only when they choose to move:

1. The bundle appears as a new card alongside the existing ones.
2. A user running `runtime-enforcer` individually **cannot install the bundle** until
   they uninstall it — the Extensions screen blocks it and says so.
3. Uninstalling and installing the bundle replaces the individual install with the
   bundled copy of the same extension.

There is no automatic migration, and nothing forces one. If you want new users to see
only the bundle, stop tagging releases for the individual extensions — the already
published versions stay installable for anyone who has them.

:::note
Keep publishing the individual extensions if anyone depends on installing them
separately. Both can be released from the same repository indefinitely.
:::

## What users see

On the Extensions screen a bundle is a single card, showing the bundle's display name,
description, icon and version. Installing it installs every member; uninstalling removes
every member. Members never appear as cards of their own.

After install or uninstall, the Extensions screen asks for a page reload — the member
extensions are loaded into the running UI and cannot be added or removed without one.

## Checking a bundle before you tag

A bundle has no JavaScript of its own, so there is nothing to serve with
`yarn serve-pkgs` and nothing to developer-load. Develop and load the member
extensions individually, exactly as you would without a bundle.

What you *can* do locally is generate the bundle and look at it, which catches the
mistakes that otherwise surface only after you have tagged a release — a `readme` path
that does not exist, a member missing from `pkg/`, a version that does not match the
tag. Run the same command the release workflow runs:

```bash
yarn publish-pkgs -s <org>/<repo> -b gh-pages -t bundle-security-ui-exts-1.0.0
```

Then inspect what it produced:

```bash
helm template security-ui-exts charts/security-ui-exts/1.0.0 \
  -n cattle-ui-plugin-system
```

You should see one `UIPlugin` per member, each named after the member, at the member's
own version, with an endpoint under `extensions/<bundle>/<version>/`.

Installing the result still needs a Helm repository the cluster can reach, so a full
install test means publishing to a branch and pointing a `ClusterRepo` at it.

:::warning
`-s` and `-b` tell the build where the already-published `index.yaml` lives, so it can
be merged rather than replaced. Pointing them at the wrong repository or branch, or
omitting them when the branch already has published charts, will drop every previously
released chart version from the index.
:::

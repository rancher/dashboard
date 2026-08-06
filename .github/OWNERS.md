# Rancher UI Repository Owners

This is the canonical list of the public GitHub repositories the Rancher UI team owns. It lives in `rancher/dashboard` so that there is a single source of truth to reference.

## Why the CODEOWNERS files are empty

Every repository listed here carries a `CODEOWNERS` file that contains only comments, pointing back to this document.

GitHub [automatically requests a review](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners#about-code-owners) from every code owner matched by a pull request and that behaviour can't be disabled. Declaring owner rules across the UI repositories would generate a constant stream of requests, which is why the team has previously chosen not to adopt `CODEOWNERS`.

A comments-only `CODEOWNERS` file keeps ownership discoverable through this document instead of through notifications.

Owners are recorded as GitHub team handles rather than individuals. Teams can be checked against the org and do not go stale when people change roles. To reach a team, mention the handle on an issue or pull request.

## Repositories owned by the UI team

| Repository | Owner | Notes |
|---|---|---|
| [`rancher/ali-ui`](https://github.com/rancher/ali-ui) | `@rancher/ui` | Alibaba UI Extension |
| [`rancher/api-ui`](https://github.com/rancher/api-ui) | `@rancher/ui` | UI for the Rancher API explorer |
| [`rancher/capi-ui-extension`](https://github.com/rancher/capi-ui-extension) | `@rancher/ui` | CAPI UI Extension. Deprecated |
| [`rancher/dashboard`](https://github.com/rancher/dashboard) | `@rancher/ui` | Main UI for Rancher, and home of this document |
| [`rancher/icons`](https://github.com/rancher/icons) | `@rancher/ui` | Rancher icon library |
| [`rancher/partner-extensions`](https://github.com/rancher/partner-extensions) | `@rancher/ui` | Promoted partner UI Extensions |
| [`rancher/rancher-ai-ui`](https://github.com/rancher/rancher-ai-ui) | `@rancher/ui` | AI Assistant UI Extension |
| [`rancher/ui`](https://github.com/rancher/ui) | `@rancher/ui` | Legacy Ember UI. Deprecated |
| [`rancher/ui-plugin-charts`](https://github.com/rancher/ui-plugin-charts) | `@rancher/ui` | Rancher Prime UI Extensions |
| [`rancher/ui-plugin-examples`](https://github.com/rancher/ui-plugin-examples) | `@rancher/ui` | Example UI Extensions |
| [`rancher/virtual-clusters-ui`](https://github.com/rancher/virtual-clusters-ui) | `@rancher/ui` | Virtual Clusters UI Extension. QA: `@rancher/ui-qa` |
| [`rancher-sandbox/dashboard`](https://github.com/rancher-sandbox/dashboard) | `@rancher/ui` | **Archived.** Original sandbox for the dashboard, cannot accept a `CODEOWNERS` commit |
| [`rancher/ui-plugin-server`](https://github.com/rancher/ui-plugin-server) | — | **Archived**, and not on the team's own repository list. Ownership needs confirming before it can be closed out on #2301 |
| [`rancher/elemental-ui`](https://github.com/rancher/elemental-ui) | `@rancher/ui` | Elemental UI Extension |
| [`rancher/kubewarden-ui`](https://github.com/rancher/kubewarden-ui) | `@rancher/ui` | Kubewarden UI Extension. Has its own populated `CODEOWNERS` naming `@kubewarden` teams |
| [`rancher/prov-capi-ui-extensions`](https://github.com/rancher/prov-capi-ui-extensions) | `@rancher/ui` | v2prov CAPI UI Extensions |
| [`rancher/security-ui-exts`](https://github.com/rancher/security-ui-exts) | `@rancher/ui` | SUSE Security UI Extensions. UI team has read-only access |
| [`rancher/ui-locales`](https://github.com/rancher/ui-locales) | `@rancher/ui` | UI locales. Not yet on the team's repository list |
| [`rancher/ux`](https://github.com/rancher/ux) | `@rancher/ui` | Product design. Not yet on the team's repository list |
| [`harvester/harvester-ui-extension`](https://github.com/harvester/harvester-ui-extension) | `@rancher/ui` | Harvester UI Extension. Has its own populated `CODEOWNERS` naming individuals |
| [`longhorn/longhorn-ui`](https://github.com/longhorn/longhorn-ui) | `@rancher/ui` | Longhorn UI, React |
| [`neuvector/manager`](https://github.com/neuvector/manager) | `@neuvector/nv-ui` | NeuVector UI. Has its own populated `CODEOWNERS` |
| [`neuvector/manager-ext`](https://github.com/neuvector/manager-ext) | `@rancher/ui` | NeuVector UI Extension for Rancher |
| [`rancher-sandbox/rancher-ai-llm-mock`](https://github.com/rancher-sandbox/rancher-ai-llm-mock) | `@rancher/ui` | LLM mock server for AI Assistant E2E tests |

## Adding a repository

1. Add a row with the owning GitHub team handle. Public repositories go in the table above. Never add a private repository here.
2. Add a comments-only `CODEOWNERS` file to the new repository. Copy [`.github/CODEOWNERS`](https://github.com/rancher/dashboard/blob/master/.github/CODEOWNERS) from this repository verbatim, it is deliberately repository-agnostic.

`scripts/github/apply-codeowners.sh` reads the table above and can do step 2 for you. The script runs as a dry run by default:

```bash
./scripts/github/apply-codeowners.sh              # report what would change
./scripts/github/apply-codeowners.sh --apply      # open the pull requests
```

Point it at the internal list with `--owners` to do the same for the private repositories:

```bash
./scripts/github/apply-codeowners.sh --owners /path/to/internal/OWNERS.md
```

Repositories outside the `rancher` org need somebody with push access in that org to run it. Private repositories need somebody who has been granted access to them.

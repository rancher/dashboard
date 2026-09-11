# Dead Code Detector — Lessons

Written and maintained by the Dead Code Detector workflow
(`.github/workflows/dead-code-detector.md`), which reads this file at the start of every run.

## Provenance and confidence

Git history is what separates a guess from a judgement. For every candidate, establish how it
came to have no consumers, and let that set the confidence — not how empty the search looked.

Three shapes recur, in descending order of certainty:

- **Explicitly replaced** — a commit swaps a reference to this component for a reference to
  another one, typically in a config or table-headers file. Someone decided this component was
  superseded and acted on it. **Very high confidence (95%+)**
- **Orphaned by a removal** — the only consumers lived in a directory or package that was later
  deleted wholesale. The component was not judged, it was left behind. There is a clear audit
  trail, but nobody ever decided about this file specifically. **High confidence (85–95%)**
- **Never used** — the search finds no consumer at any point in history. The code may be
  speculative, half-finished, or carried over from another codebase. Absence of a decision is not
  a decision: string-keyed and dynamic references are exactly what leaves no import to find, so
  this shape needs runtime confirmation. **Medium confidence (70–85%) at best**

Anything that fits none of the three — unclear provenance, recent changes, or a dynamic resolution
pattern that could not be ruled out — is **Low (<70%)** and is not reported at all.

Establish the shape with a history search for the name across config and package directories, and
a search for the commit where the last usage disappeared. Quote the commands and their real output
in the issue — a confidence level with no commands behind it is an assertion, and the reviewer has
no way to check it without redoing the work.

### Worked examples

Three formatter components, one per shape. All three are currently unreferenced by any config
file, so the search of current code cannot tell them apart — only the history can.

**Explicitly replaced** — `shell/components/formatter/DelayedValue.vue`:

```bash
git log --all --oneline -S "DelayedValue" -- "shell/config/"
# cab999d02f Use a delayed loading column for Pod Restarts
# 609f73918d Performance: Fix issues with live and delayed columns
```

The second commit changes `formatter: 'DelayedValue'` to `formatter: 'LivePodRestarts'`. Someone
decided and acted.

**Orphaned by a removal** — `shell/components/formatter/ImagePercentageBar.vue`:

```bash
git log --all --oneline -S "ImagePercentageBar" -- "pkg/"
# 34cbd6d66a remove harvester pkg
# 43d338fac2 Harvester Plugin
```

Its only consumer was a table-headers file in a package that was later deleted wholesale. Clear
audit trail, but no decision was ever made about this file.

**Never used** — `shell/components/formatter/LinkDetailImage.vue`:

```bash
git log --all --oneline -S "LinkDetailImage" -- "shell/config/" "pkg/"
# (no output)
```

No consumer at any point in history. This is the weakest of the three, not the strongest: an
empty history is also what a string-keyed reference that never touched a config file looks like.

## Format for lessons

Lessons are things that made live code look dead, or made an empty result look like proof.
Append them at the end, newest last, using exactly this shape:

```markdown
### YYYY-MM-DD — Short title

- **Trigger**: what was being analysed when this surfaced
- **Rule**: the check to run from now on, stated as an instruction
- **Command**: a command that demonstrates the rule, with its real output
```

Do not add an entry that merely restates a rule already in the detector prompt. An entry earns
its place only if following the prompt as written would still have produced the wrong answer.

A near-miss with an existing entry is still a new entry. Two failures that share a symptom but
need different checks belong in different entries — say in the **Rule** how the new one differs.

Say each thing once and point at it from anywhere else. If an entry refers to another one, name
it by its title and re-read that entry first to confirm it still says what you are claiming; a
pointer that has gone stale reads as verified and is not.

This file is about identifying dead code, and nothing else. Problems with the workflow itself —
a missing dependency, a wrong runtime version, a gate that will not start — do not belong here.
Describe the pattern, not where it was filed: never name a repository or a fork in an entry, and
do not cite issue numbers.

## Lessons

### 2026-08-19 — `--include` does not expand braces

- **Trigger**: Candidates reported as unreferenced on evidence that was entirely empty `grep`
  output
- **Rule**: Never pass a brace list to `--include`. It takes one glob per flag and does not expand
  braces, so the command searches nothing and exits 0 — and no output reads exactly like proof of
  deadness. Pass repeated flags, or use `rg`, which does not need them. Before trusting any
  negative, run the same command against a symbol known to be live; if the control also returns
  nothing, the command is broken rather than the codebase
- **Command**:

  ```bash
  grep -rn --include="*.{ts,js,vue}" "ResourceTable" shell | wc -l
  # 0
  grep -rn --include="*.ts" --include="*.js" --include="*.vue" "ResourceTable" shell | wc -l
  # 284
  ```

### 2026-08-19 — Relative imports hide consumers

- **Trigger**: A utility module reported as dead while a sibling module was importing it
- **Rule**: Search every import form, not just the `@shell/…` alias. Files in the same directory
  import each other as `./name`, and `../` and `~/` forms also occur. A search for the aliased
  path alone finds none of them
- **Command**:

  ```bash
  grep -rn "from './queue'" shell/utils/
  # shell/utils/promise.js:1:import Queue from './queue';
  ```

### 2026-08-19 — One exported name, two modules

- **Trigger**: An export that looked unused because every importer was taking the identically
  named export from a different file
- **Rule**: Attribute a symbol to its module before calling it unused. Read the module path in
  each importer's `from` clause rather than counting name matches. If a second definition is
  absorbing all the traffic, the duplicate really is dead — but for a different reason and with a
  different fix, and the issue has to say which copy is which
- **Command**:

  ```bash
  grep -rn "export function sortableNumericSuffix" shell/utils/
  # shell/utils/sort.js:220:export function sortableNumericSuffix(str) {
  # shell/utils/string.js:37:export function sortableNumericSuffix(str) {
  grep -rn "sortableNumericSuffix" shell pkg | grep import
  # six importers, every one of them from '@shell/utils/sort'
  ```

### 2026-08-19 — Excluding by bare filename drops real consumers

- **Trigger**: A reference count taken with the defining file filtered out by name
- **Rule**: `grep -v` and `--exclude` match on the basename, so filtering out a definition also
  filters out every same-named file elsewhere in the tree — including consumers. Filter on the
  full path
- **Command**:

  ```bash
  find shell pkg -name "version.js" -not -path "*/node_modules/*"
  # shell/config/version.js
  # shell/plugins/version.js
  # shell/utils/version.js
  # `grep -v "version.js"` drops all three; shell/utils/version.js imports
  # sortableNumericSuffix and is a genuine consumer
  ```

### 2026-08-19 — A name match is not a reference

- **Trigger**: A component whose apparent consumers were a CSS class and an unrelated identifier
  that happened to contain its name
- **Rule**: Never judge a component by a bare-name search. Search the forms that constitute a real
  reference — `import ... from '.../Name'`, a `components: {}` entry, `<Name`, `<kebab-name` — and
  read every remaining match before counting it as a consumer; a hit inside a longer identifier is
  noise until you have opened the line. This is not the two-modules case above: there is no second
  definition here, only a name that happens to be a substring. The reverse case matters too — a
  style rule left behind in a file that no longer uses the component is itself dead code, so list
  it in the removal steps instead of letting it scare you off the finding
- **Command**:

  ```bash
  grep -rn "CountGauge\|count-gauge" shell --include="*.vue" | grep -v node_modules
  # shell/components/SingleClusterInfo.vue:41:    totalCountGaugeInput() {          <- substring
  # shell/components/CountGauge.vue:77:    class="count-gauge"                     <- itself
  # shell/detail/workload/index.vue:391:    .count-gauge {                         <- orphaned style
  # shell/pages/c/_cluster/explorer/index.vue:310:    totalCountGaugeInput() {      <- substring
  # not one import of the component
  grep -rn "import.*CountGauge\|<CountGauge\|<count-gauge" shell pkg cypress storybook \
    --include="*.vue" --include="*.ts" --include="*.js" | wc -l
  # 0 — the reference-shaped search, which is the one that answers the question
  ```

### 2026-08-19 — A test is not a consumer

- **Trigger**: Exports kept alive in every reference count solely by their own unit tests
- **Rule**: Static tools treat a test file as a legitimate importer, so this shape is never
  surfaced automatically — look for it deliberately. Re-run the reference check excluding
  `__tests__/`, `*.test.*` and `*.spec.*`, and confirm the remaining hits are zero. Report the
  implementation and its test together as one removal; the test is part of the dead cluster, not
  evidence against it
- **Command**:

  ```bash
  grep -rn "ALL_STATE_COLORS" shell pkg --include="*.ts" --include="*.vue" --include="*.js" \
    | grep -v node_modules
  # shell/utils/style.ts:2  — the definition
  # shell/utils/__tests__/style.test.ts:2, :145 — the only importer
  ```

  The same shape holds for `toBgColor` and `getHighestAlertColor` in the same file, and for
  `shell/utils/poller-sequential.js`.

### 2026-08-19 — Formatters are registered by glob and referenced by string

- **Trigger**: Formatter components reported as orphaned because nothing imports them — which is
  true of every formatter, including the live ones
- **Rule**: Two `require.context` globs register every `[A-Z]\w+.vue` under
  `shell/components/formatter/` automatically, so no formatter ever has an import. They are
  invoked by string instead, as `formatter: 'Name'` in table configs. To rule one out, search for
  the quoted name across `shell/config` and `pkg/*/config/`, and search the history for the same
  string. Re-run the glob search rather than trusting this list — it changes
- **Command**:

  ```bash
  grep -rn "require.context" shell pkg --include="*.js" --include="*.ts" | grep -v node_modules
  # shell/plugins/global-formatters.js:2  '@shell/components/formatter'  (global Vue components)
  # shell/plugins/formatters.js:8         '@shell/components/formatter'  (FORMATTERS cache for SortableTable)
  # shell/utils/dynamic-importer.js:98    '@shell/config/product'
  # shell/utils/require-asset.ts:37,42    '@shell/assets'
  grep -rn "'FormatterName'\|\"FormatterName\"" shell/config pkg
  ```

### 2026-08-19 — An unresolved question is not high confidence

- **Trigger**: Re-exports from an extension API entry point filed as **Confidence: High** with
  removal steps that opened "verify with the team whether this is an external extension API"
- **Rule**: Those two statements cannot both stand. Any open question about whether code is
  _meant_ to have no in-repo consumers caps confidence below the reporting threshold — resolve it
  or drop the finding. Never file it anyway and leave the verification to the reader. A module
  whose job is to expose an API has no in-repo importers by design; that is what it is for, not
  evidence against it
- **Command**:

  ```bash
  head -1 shell/apis/index.ts
  # // Main export for APIs
  # exists so out-of-tree extensions can import from '@shell/apis'
  ```

### 2026-08-19 — One consumer does not exonerate a file

- **Trigger**: A cluster reported at half its real size, with a "do NOT remove" note pointing at
  dead code. Four components were reported and a fifth explicitly cleared, on the grounds that it
  had a consumer — a consumer that turned out to have none of its own
- **Rule**: A consumer only exonerates a file if the consumer is itself reachable. Before
  concluding "X is still used by Y", run the reference check on Y, and keep walking up until you
  reach something reachable or the chain ends. Stopping at the first importer is the most common
  way the closure check fails. Note that the chain crosses directory boundaries, so the cluster
  can be larger than the directory it started in
- **Command**:

  ```bash
  grep -rn "Glance" shell pkg --include="*.vue" --include="*.ts" --include="*.js" \
    | grep -v node_modules
  # every match is projectGlance / glanceItem / getGlanceItemValueId
  # not one reference to shell/components/Glance.vue, which sits above CountGauge.vue,
  # which sits above shell/components/graph/Circle.vue
  ```

### 2026-08-19 — Cluster boundaries drift between runs

- **Trigger**: The same underlying findings split three ways on one run and bundled into a single
  eighteen-component issue on the next
- **Rule**: Apply a fixed boundary so it does not depend on the run. A cluster is one directory,
  plus whatever its members transitively drag in. Never file one issue spanning several unrelated
  directories merely because everything in it is an unreferenced component — that is a report, not
  a cluster, and it cannot become a clean pull request. Do not split a single directory across
  several issues either
- **Command**: none — this is a reporting-boundary rule, not a search rule

### 2026-08-19 — Derive counts from the list you are publishing

- **Trigger**: An issue that announced "9 files, ~1,870 lines" directly above a list of 11 files
  totalling 2,014 lines
- **Rule**: Every count and total in an issue comes from the list immediately below it, counted,
  not estimated. A summary line that disagrees with its own list discredits the evidence under it
- **Command**:

  ```bash
  wc -l <every file in the list> | tail -1
  ```

### 2026-08-25 — Convention directories are loaded by a template-literal import

- **Trigger**: Files under the resource-type directories reported as orphaned because nothing imports
  them — which is true of every file in those directories, the live ones included
- **Rule**: These directories are addressed by Kubernetes resource type at runtime, not by import.
  `shell/utils/dynamic-importer.js` builds the path from a string, so no static import to the file will
  ever exist and no reference search can find one. Never report a file in `shell/models/`,
  `shell/detail/`, `shell/edit/`, `shell/list/`, `shell/chart/`, `shell/cloud-credential/`,
  `shell/machine-config/`, `shell/promptRemove/`, `shell/dialog/` or their `pkg/*/` equivalents as
  unreferenced. The same shape hides a reference anywhere a component is named by a computed string —
  `defineAsyncComponent`, `resolveComponent`, `<component :is="...">`, and any `import()` containing a
  template literal. Search for the bare name as a quoted string before concluding anything
- **Command**:

  ```bash
  sed -n '39,44p' shell/utils/dynamic-importer.js
  # export function importList(name) {
  #   if (!name) {
  #     throw new Error('Name required');
  #   }
  #   return defineAsyncComponent(() => import(`@shell/list/${name}`));
  # }
  grep -rn "defineAsyncComponent\|resolveComponent" shell pkg \
    --include="*.vue" --include="*.ts" --include="*.js" | grep -v node_modules | wc -l
  # 43
  ```

### 2026-08-25 — Entry points have no importers by design

- **Trigger**: Package entry points and API modules counted as dead because a repository-wide search
  found nothing importing them
- **Rule**: A module whose job is to be imported from outside the repository has no in-repo importer,
  and that is what it is for rather than evidence against it. Never report `shell/apis/**`,
  `pkg/*/index.ts`, `shell/initialize/entry.js`, `shell/config/router/routes.js`, store, plugin or
  directive registration files, or anything named as a `main`, `types` or `exports` target in a
  `package.json` or as an entry in build config
- **Command**:

  ```bash
  python3 -c "import json;d=json.load(open('shell/package.json'));print({k:d.get(k) for k in ('types','files')})"
  # {'types': 'types/shell/index.d.ts', 'files': ['**/*']}
  ```

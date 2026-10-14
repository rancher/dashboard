# Rancher Dashboard — UI Patterns Reference

Recurring compositions of multiple components that solve a class of UX problem. Use these as starting templates, not rigid rules. For individual component details, see `rancher-ui-components.md`; for the spacing, colour and layout tokens the snippets below use, see `rancher-ui-styling.md`.

> **On the API style below.** Several templates are Options API because the shell CRUD scaffolding they wrap (`CruResource` + the `CreateEditView`, `FormValidation`, `ResourceFetch` mixins) has not been migrated yet. Treat that as tech debt you're working around, not the target. Write new code as `<script setup lang="ts">`, keep any Options API wrapper minimal, and see rule #7 in `SKILL.md`.

> **On staleness.** These are compositions, not API contracts. Verify component props against https://rancher.github.io/storybook/ and the behaviour of any store action or shell API against the [docs](https://extensions.rancher.io/extensions/next/api/overview) before relying on a snippet here.

---

## Contents

**CRUD Foundation**
- [Resource List Page](#resource-list-page)
- [Resource Edit / Create Form](#resource-edit--create-form)
- [Resource Detail View](#resource-detail-view)
- [Detail Page Masthead](#detail-page-masthead)

**Forms**
- [Wizard / Multi-Step Form](#wizard--multi-step-form)
- [Questions / Helm Dynamic Form](#questions--helm-dynamic-form)
- [Multi-Column Form Row](#multi-column-form-row)
- [Key-Value Configuration Panel](#key-value-configuration-panel)
- [Labels & Annotations Tab](#labels--annotations-tab)
- [Dynamic Array Input](#dynamic-array-input)
- [Icon Grid Selector](#icon-grid-selector)
- [Conditional Field Group](#conditional-field-group)
- [Table of Contents Form Navigation](#table-of-contents-form-navigation)

**Modals & Overlays**
- [Dialog / Confirmation Modal](#dialog--confirmation-modal)
- [Modal System (Store-Backed)](#modal-system-store-backed)
- [Drawer / Side Panel](#drawer--side-panel)
- [Slide-In Context Help Panel](#slide-in-context-help-panel)
- [Window Manager / Float Panel](#window-manager--float-panel)

**Data Display**
- [Dashboard Metrics](#dashboard-metrics)
- [Resource Summary Cards](#resource-summary-cards)
- [Status Indicator Row](#status-indicator-row)
- [Overview / Security Dashboard Page](#overview--security-dashboard-page)
- [Summary Strip](#summary-strip)
- [Top-N List](#top-n-list)
- [Security Detail Page](#security-detail-page)
- [Dashboard Empty State](#dashboard-empty-state)
- [Scan Actions & Auto-Refresh](#scan-actions--auto-refresh)
- [SUSE Security Source Map](#suse-security-source-map)

**Resource Selection**
- [Resource Selector](#resource-selector)
- [Select or Create Auth Secret](#select-or-create-auth-secret)

**Auth & Credentials**
- [Cloud Credential Form](#cloud-credential-form)
- [Membership / Access Control Editor](#membership--access-control-editor)

**Specialised Pages**
- [Helm Chart Install Wizard](#helm-chart-install-wizard)
- [Home / Dashboard Landing Page](#home--dashboard-landing-page)

---

## Resource List Page

Standard pattern for displaying a paginated, filterable table of Kubernetes resources with a create button and RBAC-aware controls.

**Used in:** `shell/list/`
**Core components:** `Masthead`, `PaginatedResourceTable`
**Mixins:** `ResourceFetch`

**Skeleton:**
```vue
<template>
  <div>
    <Masthead
      :schema="schema"
      :resource="resource"
      :is-creatable="isCreatable"
      :create-location="createLocation"
    />
    <PaginatedResourceTable
      :schema="schema"
      :headers="headers"
    />
  </div>
</template>

<script>
import ResourceFetch from '@shell/mixins/resource-fetch';
import Masthead from '@shell/components/ResourceList/Masthead';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';

export default {
  components: { Masthead, PaginatedResourceTable },
  mixins: [ResourceFetch],

  data() {
    return { resource: 'my.resource.type' };
  },

  computed: {
    schema() {
      return this.$store.getters['cluster/schemaFor'](this.resource);
    },
    isCreatable() {
      return !!this.schema?.collectionMethods?.includes('POST');
    },
    createLocation() {
      return { name: `c-cluster-product-resource-create` };
    },
    headers() {
      return this.$store.getters['type-map/headersFor'](this.schema);
    },
  },
};
</script>
```

**Variations:**
- Use `ResourceTable` instead of `PaginatedResourceTable` for small, fully client-side collections (< 500 rows)
- Add `#extraActions` slot on `Masthead` for secondary actions (e.g., "Import", "Sync") without disrupting the primary Create button
- Add `#subHeader` slot on `Masthead` for a contextual `Banner` or feature notice below the title bar
- Pass `groupBy="metadata.namespace"` to `PaginatedResourceTable` to segment rows by namespace

**Notes:**
- `ResourceFetch` mixin wires up `fetch()`, `$fetchState`, and the store watch subscription automatically
- `headers` override schema-derived defaults — only provide them when columns need reordering or custom `formatter` values
- Create button visibility is RBAC-governed via `schema` — always pass it; never hardcode `isCreatable: true`

---

## Resource Edit / Create Form

Standard pattern for a create or edit page for a Kubernetes resource. Provides a validated, tabbed form with a save/cancel footer, error rollup, and optional YAML toggle.

**Used in:** `shell/edit/`
**Core components:** `CruResource`, `Tabbed`, `Tab`, `NameNsDescription`
**Mixins:** `CreateEditView`, `FormValidation`

**Skeleton:**
```vue
<template>
  <CruResource
    :mode="mode"
    :resource="value"
    :validation-passed="fvFormIsValid"
    @finish="save"
    @error="e => (errors = [e])"
  >
    <NameNsDescription :value="value" :mode="mode" />

    <Tabbed :side-tabs="true" default-tab="general">
      <Tab name="general" :label="t('tab.general')" :weight="10">
        <div class="row mt-20">
          <div class="col span-6">
            <LabeledInput
              v-model:value="value.spec.field"
              :label="t('myResource.field.label')"
              :rules="fvGetAndReportPathRules('spec.field')"
              :mode="mode"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model:value="value.spec.type"
              :label="t('myResource.type.label')"
              :options="typeOptions"
              :mode="mode"
            />
          </div>
        </div>
      </Tab>

      <Tab name="labels" :label="t('tab.labelsAnnotations')" :weight="99">
        <Labels :value="value" :mode="mode" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Labels from '@shell/components/form/Labels';

export default {
  components: { CruResource, Tabbed, Tab, NameNsDescription, Labels },
  mixins: [CreateEditView, FormValidation],

  props: {
    value: { type: Object, required: true },
    mode: { type: String, required: true },
  },

  computed: {
    fvFormRuleSets() {
      return [{ path: 'spec.field', rules: ['required'] }];
    },
    typeOptions() {
      return ['typeA', 'typeB', 'typeC'];
    },
  },
};
</script>
```

**Variations:**
- For simple forms with ≤ 3 logical sections, skip `Tabbed` and use `RcSection` blocks instead
- Use the `subtypes` prop on `CruResource` when the resource has distinct variants (e.g., Job vs. CronJob)
- Omit `NameNsDescription` for cluster-scoped resources that have no namespace
- Add `:display-alert-icon="tabHasErrors"` on `Tab` to flag sections with validation errors in the tab bar
- Use `Accordion` inside a tab to collapse optional or advanced sub-sections

**Notes:**
- `fvFormIsValid` (from `FormValidation` mixin) must be bound to `CruResource`'s `validationPassed`
- `fvGetAndReportPathRules` wires per-field validation so errors surface in both the field and the footer rollup
- Always use `side-tabs="true"` for forms with 4+ tabs — horizontal tabs overflow at 1280px width
- Labels and annotations always go in a dedicated tab at `weight: 99`, never inline in the main form tab

---

## Resource Detail View

Standard pattern for a read-only detail page showing a resource's configuration, status, conditions, and related sub-resources. Conditions, Events, and Labels & Annotations tabs are injected automatically by `ResourceTabs`.

**Used in:** `shell/detail/`
**Core components:** `ResourceTabs`, `Tab`, `ResourceTable`, `SortableTable`
**Mixins:** `CreateEditView`

**Skeleton:**
```vue
<template>
  <ResourceTabs :value="value" :mode="mode" default-tab="overview">
    <Tab name="overview" :label="t('tab.overview')" :weight="1">
      <div class="row">
        <div class="col span-6">
          <!-- Summary metrics or key field display -->
        </div>
      </div>
    </Tab>

    <Tab v-if="podSchema" name="pods" :label="t('tab.pods')" :weight="2">
      <ResourceTable :schema="podSchema" :rows="pods" />
    </Tab>
  </ResourceTabs>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: { ResourceTabs, Tab, ResourceTable },
  mixins: [CreateEditView],

  props: {
    value: { type: Object, required: true },
    mode: { type: String, default: 'view' },
  },

  computed: {
    podSchema() { return this.$store.getters['cluster/schemaFor']('pod'); },
    pods() { return this.value.pods || []; },
  },
};
</script>
```

**Variations:**
- Use `SortableTable` instead of `ResourceTable` when related data is not a native Kubernetes resource
- Add `:display-alert-icon="hasWarnings"` on `Tab` to surface per-tab issues in the tab bar
- Add a `DashboardMetrics` component in a dedicated Metrics tab for workloads with Prometheus/Grafana

**Notes:**
- Guard tab content with `v-if="podSchema"` — schemas may not exist on all clusters or permission levels
- Use `weight` below 99 for custom tabs — `ResourceTabs` injects standard tabs at weight 99+
- Keep `mode="view"` — detail pages do not mutate resources
- The area above the tabs follows [Detail Page Masthead](#detail-page-masthead)

---

## Detail Page Masthead

The top of a detail page, above the tabs or the main table: who is this, what state is it in, what are its key facts. Rancher's new resource-detail pages build it from three layers: **title bar → metadata → cards**. Use the same layers for every detail page, including ones that show data proxied from a third-party API.

**Used in:** `shell/components/Resource/Detail/Masthead/index.vue`, `shell/detail/configmap.vue`, `shell/detail/secret.vue`, `shell/detail/fleet.cattle.io.gitrepo.vue`, `shell/detail/provisioning.cattle.io.cluster.vue`
**Core components** (all under `@shell/components/Resource/Detail/`, present in shell 3.0.x / Rancher 2.15; check older targets before relying on them):

| Component | Import | What it gives you |
|---|---|---|
| `Masthead` | `Masthead/index.vue` | The whole stack: `TitleBar` + `Metadata` + `Cards` (from `resource.cards`). Props `titleBarProps`, `metadataProps` |
| `TitleBar` | `TitleBar/index.vue` | `h1` "Type: name" (type optionally a link back to the list), state `BadgeState` at 16px, actions on the right, muted `description` under it (max 60% wide). Props `resource`, `resourceTypeLabel`, `resourceName`, `resourceTo?`, `description?`, `badge?: { color: 'bg-success' \| 'bg-error' \| 'bg-warning' \| 'bg-info', label }`, `additionalActions?`, `actionMenuResource?`. Also renders the `DETAILS_MASTHEAD` extension panel |
| `IdentifyingInformation` | `Metadata/IdentifyingInformation/index.vue` | Label/value rows: label 30% wide `.text-deemphasized`, 8px between rows, `—` for empty values, optional 8px status dot. `rows: Row[]`, `Row = { label, value?, to?, status?: 'success' \| 'warning' \| 'info' \| 'error', valueOverride?: { component, props } }` (the override only renders when `value` is set) |
| `SpacedRow` | `SpacedRow.vue` | `grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px`. The row for metadata columns and cards |
| `Card` | `Card/index.vue` | Bordered box (16px padding, `--border-radius-md`, `--border`), 18px/600 title, slots `title`, `heading-action` (right of the title), default. **Not** the `@components/Card` dialog card |
| `ResourceUsageCard` | `Card/ResourceUsageCard/index.vue` | "Used — 3 / 10 / 30%" plus a `PercentageBar`. Props `title`, `used`, `available`, `usedFormatter?`, `availableFormatter?`, `unit?` |
| `PercentageBar` | `PercentageBar.vue` | 16px bar. Props `percent`, `percentageColor?` (default `var(--primary)`), `baseColor?` |
| `StatusCard` / `StateCard` | `Card/StatusCard`, `Card/StateCard` | Resource counts by state, with a status bar |

**Choosing the variant:**
- **Kubernetes resource with a model** → `Masthead` with `useDefaultMastheadProps(resource)`; add cards through the model's `cards` getter.
- **Anything else** (a proxied third-party API, aggregated data, a custom page) → keep your page header, and compose `SpacedRow` + `Card` + `IdentifyingInformation` + `PercentageBar` yourself. `TitleBar` expects a model for its extension panel and action menu, so copy its layout (name, 16px badge, muted description, actions on the right) rather than feeding it a plain object.

**Skeleton (non-Kubernetes data):**
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { BadgeState } from '@components/BadgeState';
import RcCounterBadge from '@components/Pill/RcCounterBadge';
import SpacedRow from '@shell/components/Resource/Detail/SpacedRow.vue';
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import PercentageBar from '@shell/components/Resource/Detail/PercentageBar.vue';
import IdentifyingInformation, { Row } from '@shell/components/Resource/Detail/Metadata/IdentifyingInformation/index.vue';
import LiveDate from '@shell/components/formatter/LiveDate.vue';

const detailRows = computed<Row[]>(() => [
  { label: t('myext.details.type'), value: t(`myext.type.${ item.value.type }`) },
  { label: t('myext.details.owner'), value: item.value.owner, to: ownerRoute.value },
  { label: t('myext.details.created'), value: item.value.created, valueOverride: { component: LiveDate, props: { value: item.value.created, addSuffix: true } } },
]);
</script>

<template>
  <!-- 1. Title bar: name + one state badge + description; actions right -->
  <header class="title-bar">
    <h1>{{ item.name }} <BadgeState class="state" color="bg-info" :label="t('myext.state.mirror')" /></h1>
    <div class="actions"><!-- external link, primary action --></div>
  </header>
  <p class="text-deemphasized">{{ t('myext.description', { upstream }) }}</p>

  <!-- 2 + 3. Facts and cards in one 3-column row -->
  <SpacedRow class="mb-30">
    <Card :title="t('myext.details.title')">
      <IdentifyingInformation :rows="detailRows" />
    </Card>
    <Card :title="t('myext.policies.title')">
      <template #heading-action><a :href="settingsUrl" target="_blank" rel="noopener noreferrer nofollow">{{ t('myext.manage') }} <i class="icon icon-external-link" /></a></template>
      <!-- checklist: BooleanMark-style ✓ / — in a fixed 16px column, label, optional muted detail on the right -->
    </Card>
    <Card :title="t('myext.quota.title')">
      <!-- "Used ........ 1.2 GiB / 10 GiB / 12%" then a PercentageBar; var(--error) above a threshold -->
      <PercentageBar :percent="percent" :percentage-color="percent >= 85 ? 'var(--error)' : undefined" />
    </Card>
  </SpacedRow>

  <!-- Section header for what follows: title + count -->
  <div class="section-header">
    <h2>{{ t('myext.children.title') }}</h2>
    <RcCounterBadge :count="children.length" type="inactive" />
  </div>
  <SortableTable ... />
</template>

<style lang="scss" scoped>
.state { font-size: 16px; } // TitleBar badge size
.section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; h2 { margin: 0; } }
</style>
```

**Rules:**
- **One badge in the title.** It's the single most important state (health, mirror/proxy, read-only). Everything else goes into the metadata or cards. Show it only when it adds information. A badge that says "Normal" on every page is noise.
- **Facts go in `IdentifyingInformation` rows**, not inline "Label value · Label value" text. Rows scan vertically, align, and get a consistent `—` for missing data.
- **Group into at most three columns or cards**, each with one topic: identity/details, configuration/policies, capacity/usage. A fourth topic goes in a tab, not in a second masthead row.
- **On/off settings are a checklist** (✓ in `text-success`, muted `—`, label muted when off, value like "High and above" right-aligned). Don't use rows of grey/green `BadgeState`s or status dots on every row: a dot means health, not a toggle.
- **Usage gets a bar:** use `ResourceUsageCard`, or `Card` + `PercentageBar` when you need a threshold colour or an "unlimited" state (show the used amount, no bar, plus a muted "no limit" line).
- **Read-only extensions link out** to where the setting is edited (card `heading-action`, external-link icon, `rel="noopener noreferrer nofollow"`).
- **Every card renders**, even when its data failed to load: a muted "not available" line keeps the grid from collapsing.
- **The section after the masthead gets a header with a count** (`h2` + `RcCounterBadge type="inactive"`) and `margin-bottom` ~30px above it. Don't leave a bare `h2` hanging under the facts.

**Anti-patterns:**

| Weak masthead | Do instead |
|---|---|
| A wrapping flex row of `<span class="text-muted">Label</span> value` pairs | `IdentifyingInformation` rows inside a `Card` |
| A strip of `BadgeState`s for toggles, `bg-darker` for "off" | Checklist card with ✓ / — |
| Inline `ProgressBarMulti` squeezed next to text | Quota/usage card with `PercentageBar` |
| Upstream/source details in brackets after a value | `TitleBar`-style muted description under the title |
| Bare `<h2>` straight under the facts | Section header with count and spacing |

---

## Wizard / Multi-Step Form

Guides users through a complex configuration sequence, showing one logical step at a time with a progress indicator. Built on the `Wizard` component, which can also be activated from `CruResource` via the `steps` prop.

**Used in:** `shell/pages/c/_cluster/apps/charts/install.vue`, `shell/components/CruResource.vue`
**Core components:** `Wizard`, `Tab` (as step slots)

**Skeleton:**
```vue
<template>
  <Wizard
    :steps="steps"
    :edit-first-step="true"
    @finish="onFinish"
    @cancel="onCancel"
  >
    <template #basics="{ step }">
      <!-- Step 1 content -->
      <LabeledInput v-model:value="config.name" label="Name" />
    </template>

    <template #config="{ step }">
      <!-- Step 2 content -->
      <RadioGroup
        v-model:value="config.mode"
        name="mode"
        :options="modeOptions"
        label="Mode"
      />
    </template>

    <template #review="{ step }">
      <!-- Step 3 — read-only summary -->
    </template>
  </Wizard>
</template>

<script>
import Wizard from '@shell/components/Wizard';

export default {
  components: { Wizard },

  data() {
    return {
      steps: [
        { name: 'basics', label: 'Basics', ready: true },
        { name: 'config', label: 'Configuration', ready: false },
        { name: 'review', label: 'Review', ready: true },
      ],
      config: {},
    };
  },

  methods: {
    onFinish() { /* submit */ },
    onCancel() { this.$router.back(); },
  },
};
</script>
```

**Step definition fields:**
| Field | Type | Purpose |
|---|---|---|
| `name` | String | Matches the slot name |
| `label` | String | Display label in the step bar |
| `ready` | Boolean | Gate whether the user can advance |
| `loading` | Boolean | Show spinner on the step |
| `hidden` | Boolean | Hide from the step bar |

**Variations:**
- Use `CruResource` with `steps` prop to get a Wizard inside the standard CRUD shell (save/cancel managed for you)
- Add `beforeGoToStep` callback on `Wizard` to run async validation before advancing a step
- Use `bannerImage` prop to display a product illustration alongside the wizard steps

**Notes:**
- Keep each step focused on one decision or group of related inputs — steps that require scrolling should be split further
- A read-only Review step as the final step significantly reduces submission errors
- `ready: false` disables the Next button for that step — bind it to `fvFormIsValid` for validated steps

---

## Questions / Helm Dynamic Form

Renders a complete form from a Helm chart values schema without any hand-built inputs. Handles all question types, conditional visibility (JEXL), validation, and nesting automatically.

**Used in:** `shell/pages/c/_cluster/apps/charts/install.vue`, chart configuration pages
**Core components:** `Questions`

**Skeleton:**
```vue
<template>
  <div>
    <Questions
      v-if="chartValues"
      v-model:value="chartValues"
      :source="questionsSource"
      :mode="mode"
      :tabbed="true"
      :target-namespace="targetNamespace"
      @updated="onValuesUpdated"
    />
  </div>
</template>

<script>
import Questions from '@shell/components/Questions';

export default {
  components: { Questions },

  props: {
    chart: { type: Object, required: true },
    mode: { type: String, default: 'edit' },
  },

  data() {
    return {
      chartValues: {},
      targetNamespace: 'default',
    };
  },

  computed: {
    questionsSource() {
      return this.chart.questions || this.chart.valuesSchema;
    },
  },

  methods: {
    onValuesUpdated(values) {
      this.chartValues = values;
    },
  },
};
</script>
```

**Variations:**
- Set `tabbed: false` for single-group schemas to render as a flat form
- Pass `mode="view"` for a read-only values summary on detail or confirmation pages

**Notes:**
- Never build manual `LabeledInput` fields for Helm values — `Questions` handles types, defaults, conditionals, and validation from the schema
- JEXL expressions in the schema control conditional visibility; `Questions` evaluates them against the current `value` object automatically

---

## Multi-Column Form Row

Grid-based layout for placing two or more form inputs side by side. The standard arrangement for form fields — one `div.row` per logical row, each field in a `div.col.span-N`.

**Used in:** `shell/edit/`, `shell/cloud-credential/`, anywhere form inputs appear

**Skeleton:**
```vue
<!-- Two equal columns -->
<div class="row mt-20">
  <div class="col span-6">
    <LabeledInput v-model:value="value.spec.name" label="Name" :mode="mode" />
  </div>
  <div class="col span-6">
    <LabeledSelect
      v-model:value="value.spec.type"
      label="Type"
      :options="typeOptions"
      :mode="mode"
    />
  </div>
</div>

<!-- Three equal columns (resource limits) -->
<div class="row mt-20">
  <div class="col span-4">
    <UnitInput v-model:value="value.spec.cpu" label="CPU" base-unit="cores" :mode="mode" />
  </div>
  <div class="col span-4">
    <UnitInput
      v-model:value="value.spec.memory"
      label="Memory"
      base-unit="B"
      :increment="1024"
      :mode="mode"
    />
  </div>
  <div class="col span-4">
    <LabeledInput v-model:value="value.spec.replicas" label="Replicas" type="integer" :mode="mode" />
  </div>
</div>
```

**Column widths:**

| Classes | Width | Use when |
|---|---|---|
| `span-12` | 100% | Full-width fields: description, YAML editor, `ArrayList`, `KeyValue` |
| `span-6` + `span-6` | 50% / 50% | Two equal side-by-side fields (most common) |
| `span-4` + `span-4` + `span-4` | 33% each | Three equal columns (resource limits, CPU/memory/replicas) |
| `span-8` + `span-4` | 67% / 33% | Main field with narrow auxiliary (name + port, path + method) |
| `span-3` × 4 | 25% each | Four compact columns — use only for very short labels |

**Notes:**
- Always add `mt-20` on each row `div` — the standard vertical gap between form rows. (Shell has two spacing scales; this one is the legacy 5px scale and is still the convention for form rows — see **Spacing** in `rancher-ui-styling.md`)
- In view-only mode, form inputs render as display text automatically — no separate read-only template needed
- Don't exceed 3 columns on a single row; 4+ columns become unreadable at 1280px

---

## Key-Value Configuration Panel

Standard pattern for editing any flat map of string pairs: environment variables, generic config, custom annotations. For `metadata.labels` + `metadata.annotations` together, use the [Labels & Annotations Tab](#labels--annotations-tab) pattern instead.

**Used in:** `shell/edit/`, any form that needs a flat key-value map
**Core components:** `KeyValue`

**Skeleton:**
```vue
<div class="row mt-20">
  <div class="col span-12">
    <KeyValue
      :value="value.spec.env"
      :mode="mode"
      title="Environment Variables"
      key-label="Variable"
      value-label="Value"
      :initial-empty-row="true"
      @update:value="value.spec.env = $event"
    />
  </div>
</div>
```

**Variations:**
- Use `binaryValueKeys` to mask secret values inline (e.g., password env vars)
- Use `hideKeyColumn: false` (default) — only hide the key column for read-only badge displays
- Wrap in a `Tab` or `RcSection` when the map is secondary to the main form fields

**Notes:**
- Use `key` prop on each `KeyValue` when rendering multiple instances in the same component — prevents Vue from reusing the wrong instance
- `initialEmptyRow: true` is appropriate when the map is required; `false` when it is optional
- In view mode, `KeyValue` renders as a read-only list automatically

---

## Labels & Annotations Tab

Standard pattern for the dedicated Labels & Annotations tab that appears in every resource edit form. Uses the `Labels` component which manages both `metadata.labels` and `metadata.annotations` in one consistent layout.

**Used in:** `shell/edit/` — always at `weight: 99`
**Core components:** `Tab`, `Labels`

**Skeleton:**
```vue
<Tab name="labels" :label="t('tab.labelsAnnotations')" :weight="99">
  <Labels :value="value" :mode="mode" />
</Tab>
```

**Variations:**
- Use `displaySideBySide: true` on `Labels` when both sections are sparse and screen width allows
- Use `showAnnotations: false` on `Labels` only when the resource type has no annotations
- For resources where you need to show labels and annotations separately (unusual), use two `KeyValue` components directly with `key="labels"` / `key="annotations"` attributes

**Notes:**
- Always use `weight: 99` so this tab is the last in the form — it is secondary to configuration tabs
- `Labels` mutates `value.metadata.labels` and `value.metadata.annotations` directly — no `@update` handler needed
- The `ResourceTabs` component on detail pages injects a read-only version of this tab automatically — do not add it again manually

---

## Dynamic Array Input

Pattern for editing an ordered list of string values where the user can add, remove, and edit items. Use when the number of values is unknown at design time and can grow to any length.

**Used in:** `shell/edit/`
**Core components:** `ArrayList`

**Skeleton:**
```vue
<div class="row mt-20">
  <div class="col span-12">
    <ArrayList
      :value="value.spec.hostnames"
      :mode="mode"
      title="Hostnames"
      value-label="Hostname"
      value-placeholder="e.g. example.com"
      :initial-empty-row="true"
      @update:value="value.spec.hostnames = $event"
    />
  </div>
</div>
```

**Variations:**
- Wrap in `RcSection` with `expandable: true` when the array is optional and most users leave it empty
- Use `showHeader: true` when the column label adds meaningful context beyond the section title
- Add `protip` text for format hints (CIDR blocks, glob patterns)
- Use `ArrayListGrouped` (from `shell/components/form/ArrayListGrouped.vue`) for grouped arrays with multiple input columns per row (e.g., node affinity rules)

**Notes:**
- `initialEmptyRow: true` when the field is required — a visible empty input is clearer than a hidden "Add" button
- For key-value pairs, use `KeyValue` instead
- `ArrayList` handles its own add/remove state internally — only bind `@update:value` to sync to the resource

---

## Icon Grid Selector

Pattern for choosing between resource subtypes or provider types by clicking icon cards arranged in a grid. Used at the start of a create flow when the user must first commit to one of several distinct variants.

**Used in:** `shell/edit/secret/index.vue`, `shell/edit/cloudcredential.vue`, `shell/edit/provisioning.cattle.io.cluster/index.vue`
**Core components:** `SelectIconGrid`

**Skeleton:**
```vue
<template>
  <div v-if="!selectedType">
    <SelectIconGrid
      :options="subtypeOptions"
      :value="selectedType"
      @select="onTypeSelected"
    />
  </div>

  <component
    :is="selectedComponent"
    v-else
    :value="value"
    :mode="mode"
  />
</template>

<script>
import SelectIconGrid from '@shell/components/SelectIconGrid';

export default {
  components: { SelectIconGrid },

  data() {
    return { selectedType: null };
  },

  computed: {
    subtypeOptions() {
      return [
        { id: 'typeA', label: 'Type A', icon: 'icon-a', description: 'Description A' },
        { id: 'typeB', label: 'Type B', icon: 'icon-b', description: 'Description B' },
      ];
    },
    selectedComponent() {
      return this.selectedType ? `Edit${this.selectedType}` : null;
    },
  },

  methods: {
    onTypeSelected(type) {
      this.selectedType = type;
    },
  },
};
</script>
```

**Notes:**
- Show the grid only before a type is selected — once chosen, replace with the type-specific form
- Pass the `subtypes` prop to `CruResource` when the subtype selection should be persistent and visible in the form header
- Use `RadioButton` directly for small sets (≤ 4 options) where icon cards would be too heavy

---

## Conditional Field Group

Pattern for showing or hiding a related group of form fields based on another field's value. Uses `v-if` / `v-show` and optionally a visual container (`RcSection`, `Accordion`) to communicate the grouping.

**Used in:** `shell/edit/provisioning.cattle.io.cluster/tabs/AgentConfiguration.vue`, complex edit forms
**Core components:** `RcSection`, `Accordion`, any form inputs

**Skeleton:**
```vue
<template>
  <div>
    <RadioGroup
      v-model:value="mode"
      name="mode"
      :options="modeOptions"
      label="Mode"
      :mode="formMode"
    />

    <!-- Fields shown only when mode === 'advanced' -->
    <RcSection
      v-if="mode === 'advanced'"
      title="Advanced Configuration"
      class="mt-20"
    >
      <div class="row mt-20">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.spec.timeout"
            label="Timeout (s)"
            type="integer"
            :mode="formMode"
          />
        </div>
      </div>
    </RcSection>

    <!-- Optional section always visible but collapsible -->
    <Accordion title="Optional Settings" class="mt-20">
      <Checkbox
        v-model:value="value.spec.enabled"
        label="Enable feature"
        :mode="formMode"
      />
    </Accordion>
  </div>
</template>
```

**Notes:**
- Prefer `v-if` over `v-show` when the hidden fields have no meaningful view-mode value — `v-if` avoids rendering and validating invisible fields
- Use `Accordion` for optional settings that are collapsed by default but accessible without changing another field first
- Use `RcSection` for settings that are always contextually relevant but only appear after a prerequisite choice

---

## Table of Contents Form Navigation

Pattern for long forms (10+ sections) that need a sticky side-navigation to let users jump between sections without scrolling. Renders alongside `Tabbed` (via `side-tabs`) for forms too complex even for side tabs.

**Used in:** Complex provisioning forms, `shell/components/TableOfContents/`
**Core components:** `TableOfContents`, `Tabbed`, `Tab`
**Composables:** `useFormSummary`, `useInSummary`

**Skeleton:**
```vue
<template>
  <Tabbed :side-tabs="true" :use-hash="true">
    <Tab name="basics" label="Basics" :weight="10" title="Basics">
      <!-- title prop registers this section in the TOC -->
      <LabeledInput v-model:value="value.name" label="Name" />
    </Tab>
    <Tab name="networking" label="Networking" :weight="20" title="Networking">
      <!-- ... -->
    </Tab>
  </Tabbed>
</template>
```

**Notes:**
- Set `title` on each `Tab` — the `TableOfContents` component reads this to build its navigation entries
- Use `use-hash="true"` so each tab's URL hash updates as the user navigates — deep links work correctly
- The `TableOfContents` component is rendered automatically by `Tabbed` in side-tabs mode when sections define `title`
- Use `useInSummary` composable inside a tab's content to register sub-sections within the same TOC

---

## Dialog / Confirmation Modal

Standard pattern for a blocking confirmation dialog — delete, apply, force action. For multi-step forms, use the Wizard pattern instead.

**Used in:** `shell/dialog/`
**Core components:** `Card`, `Banner`, `AsyncButton`

**Skeleton:**
```vue
<template>
  <div class="prompt-remove" @keydown.esc="close">
    <Card :show-highlight-border="false">
      <template #title>
        <h4 class="text-default-text">
          {{ t('dialog.title') }}
        </h4>
      </template>

      <template #body>
        <Banner v-if="warning" color="warning" :label="warning" />
        <p>{{ t('dialog.body', { name: resourceName }) }}</p>
      </template>

      <template #actions>
        <button class="btn role-secondary" @click="close">
          {{ t('generic.cancel') }}
        </button>
        <AsyncButton
          class="btn role-primary"
          mode="delete"
          :disabled="!canProceed"
          @click="submit"
        />
      </template>
    </Card>
  </div>
</template>

<script>
import Card from '@rancher/components/Card/Card';
import Banner from '@rancher/components/Banner/Banner';
import AsyncButton from '@shell/components/AsyncButton';

export default {
  components: { Card, Banner, AsyncButton },
  props: { resources: { type: Array, default: () => [] } },

  computed: {
    resourceName() { return this.resources[0]?.name || ''; },
    warning() {
      return this.resources.length > 1
        ? this.t('dialog.multiWarning', { count: this.resources.length })
        : null;
    },
    canProceed() { return this.resources.length > 0; },
  },

  methods: {
    close() { this.$emit('close'); },
    async submit(cb) {
      try {
        await Promise.all(this.resources.map(r => r.doAction('myAction')));
        cb(true);
        this.close();
      } catch (e) {
        cb(false);
      }
    },
  },
};
</script>
```

**Variations:**
- Use `color="error"` on `Banner` for destructive/irreversible action warnings
- Add a `LabeledInput` text-confirmation field for high-risk deletes (user types the resource name)
- Use `color="info"` banner for non-destructive informational context

**Notes:**
- Always handle `@keydown.esc` — keyboard accessibility requirement
- `AsyncButton` with `mode="delete"` applies the red delete label automatically — do not override `actionColor`
- Always call `cb(false)` in the catch block — without it, the button stays in loading state permanently

---

## Modal System (Store-Backed)

Open a dialog from anywhere without prop drilling. Rendered once by `ModalManager` in the app shell.

> **Docs:** [`ModalApi`](https://extensions.rancher.io/extensions/next/shell-api/interfaces/ModalApi) and [`ModalConfig`](https://extensions.rancher.io/extensions/next/shell-api/interfaces/ModalConfig) for the supported API; [`folder-structure#dialog`](https://extensions.rancher.io/extensions/next/folder-structure#dialog) for the legacy `promptModal` prop table. Check those for the current option set — the snippets below are orientation only.

**Use `shell.modal.open()`** — the supported extension API. Pass the component itself; no string lookup, no registration:

```ts
import { useShell } from '@shell/apis';
import MyModal from './MyModal.vue';

useShell().modal.open(MyModal, { props: { onConfirm }, resources: [resource], width: '800px' });
```

The modal emits `close` to dismiss and receives `resources` as a prop. Options API: `this.$shell.modal.open(...)`.

**Legacy `promptModal`** — resource models can't call `useShell()`, so model actions dispatch the older action, which resolves the component **by filename** from `pkg/<name>/dialog/`:

```js
this.$dispatch('promptModal', { resources, component: 'MyDialog' }); // → dialog/MyDialog.vue
```

A typo in `component` fails silently — no modal, no error.

**Delete confirmation:** `this.$store.dispatch('promptRemove', [resource])`. Customise the body per type with `pkg/<name>/promptRemove/<resource.type>.vue`.

**Notes:**
- `AppModal` handles backdrop, focus trapping and focus return — don't reimplement
- There is no `dialog/open` action and no `dialog` store module; these two are the only paths
- Never use `v-if` + a local dialog ref for dialogs that may be triggered from multiple locations — the store-backed system handles this cleanly

---

## Drawer / Side Panel

Pattern for surfacing resource details or contextual content in a slide-out panel anchored to the right edge of the screen, without navigating away from the current page.

**Used in:** `shell/components/Drawer/`, `shell/pages/c/_cluster/apps/charts/ChartInfoDrawer.vue`, list page row interactions
**Core components:** `RcDrawer`, optionally `RcDrawerCard`, opened with the shell's slide-in

**Skeleton:**
```vue
<!-- ResourceDrawer.vue -->
<script setup lang="ts">
import { RcDrawer } from '@components/RcDrawer';
import { RcButton } from '@components/RcButton';
import KeyValue from '@shell/components/form/KeyValue.vue';

const props = defineProps<{ resource: any }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <RcDrawer :title="props.resource.name" @close="emit('close')">
    <KeyValue :value="props.resource.metadata.labels" mode="view" title="Labels" />

    <template #additional-actions>
      <RcButton variant="primary" size="large" @click="props.resource.goToEdit()">
        Edit
      </RcButton>
    </template>
  </RcDrawer>
</template>
```

```ts
// In the list page or table row that opens it
import { useShell } from '@shell/apis';
import ResourceDrawer from './ResourceDrawer.vue';

useShell().slideIn.open(ResourceDrawer, {
  props:  { resource },
  width:  'wide',
  height: 'full'
});
```

**Notes:**
- The slide-in returns focus to the element that opened the drawer; pass `returnFocusSelector` when that element is re-rendered while the drawer is open
- Don't pass `title` to `slideIn.open` for a component that renders `RcDrawer`, or it is wrapped in a second drawer
- Keep drawer content supplementary; never put a full edit form inside a Drawer
- The footer always has Close; put the drawer's own actions in `#additional-actions`

---

## Slide-In Context Help Panel

Pattern for context-sensitive help or documentation that slides in from the right, typically driven by a keyboard shortcut or help icon rather than a resource selection. It is a [Drawer](#drawer--side-panel) with the help content in its body.

**Used in:** `pkg/kubectl-explain/slide-in.js`, `pkg/kubectl-explain/components/SlideInPanel.vue`, `pkg/kubectl-explain/components/ExplainPanel.vue`
**Core components:** `RcDrawer` + `ExplainPanel`, opened with the shell's slide-in

**Notes:**
- Open it with `slideIn.open(...)` like any other drawer; the slide-in traps focus and closes it on Escape
- Use the `#title` slot for anything richer than plain text, such as breadcrumbs, and keep the `title` prop as its plain-text name
- Pass `closeOnRouteChange` when the panel should stay open across some route changes
- Use for help docs, API reference, or kubectl explain output — content that users want alongside the form they're filling in

---

## Window Manager / Float Panel

Pattern for multi-instance floating panels (terminal shells, log streams, README viewers) that users can open, switch between, and close independently. Uses the `WindowManager` store module.

**Used in:** `shell/components/Window/`, triggered from workload/pod detail pages
**Core components:** `Window`, `WindowManager` (app shell), `ContainerShell`, `ContainerLogs`, `ChartReadme`

**Opening a window:**
```js
// Open a shell window for a container
this.$store.dispatch('wm/open', {
  id: `${this.pod.id}-shell`,       // stable unique ID
  label: `${this.pod.name} Shell`,  // tab label
  icon: 'terminal',
  component: 'ContainerShell',
  attrs: {
    pod: this.pod,
    container: this.containerName,
  },
});
```

**Notes:**
- Always use a stable, resource-scoped `id` — `WindowManager` uses it to avoid duplicate windows for the same resource
- `WindowManager` is rendered once in the app shell and manages its own tab bar — do not add a second instance
- Use `beforeClose` callback on `Window` to prompt before closing an active terminal session
- Available window components: `ContainerShell` (xterm.js terminal), `ContainerLogs` (streaming logs), `ChartReadme` (Helm chart docs)

---

## Dashboard Metrics

Pattern for embedding Grafana-backed metric charts on detail pages. Shows CPU, memory, and network graphs for resources that have monitoring configured.

**Used in:** `shell/detail/workload/index.vue`, `shell/detail/pod.vue`, `shell/detail/node.vue`
**Core components:** `DashboardMetrics`

**Skeleton:**
```vue
<Tab
  v-if="metricsAvailable"
  name="metrics"
  :label="t('tab.metrics')"
  :weight="5"
>
  <DashboardMetrics
    :detail-url="metricsDetailUrl"
    :summary-url="metricsSummaryUrl"
  />
</Tab>
```

**Notes:**
- Always guard with `v-if="metricsAvailable"` — the tab should only appear when monitoring is installed
- Derive `detailUrl` and `summaryUrl` from the resource's monitoring annotations or the cluster's Grafana endpoint
- `DashboardMetrics` handles iframe loading, error states, and dark mode adaptation internally

---

## Resource Summary Cards

Pattern for showing aggregate counts of related resources (ready pods, running nodes, healthy services) in a visual summary row, typically at the top of a detail page or cluster overview.

**Used in:** Fleet cluster details, namespace details, cluster explorer
**Core components:** `ResourcesSummary`

**Skeleton:**
```vue
<template>
  <div>
    <ResourcesSummary
      v-if="value.status.resourceCounts"
      :value="value.status.resourceCounts"
    />

    <ResourceTabs :value="value" :mode="mode">
      <!-- tabs below -->
    </ResourceTabs>
  </div>
</template>
```

**Notes:**
- `ResourcesSummary` reads a `resourceCounts` status object in the format `{ ready, notReady, transitioning, error }` — structure the data to match
- Place above the tab bar so it is always visible regardless of which tab is active
- Use `BadgeState` inline with count numbers for individual state breakdowns when `ResourcesSummary` is too coarse

---

## Status Indicator Row

Pattern for displaying the current state of a resource with both a visual indicator and a text label in a detail page header or summary section.

**Used in:** Detail page headers, table cell renderers, cards
**Core components:** `StateDot` + text, or `BadgeState`, or `RcTag`

**Skeleton:**
```vue
<!-- Compact indicator — icon + text -->
<span class="state-indicator">
  <StateDot :color="resource.stateColor" size="10px" />
  <span>{{ resource.stateDisplay }}</span>
</span>

<!-- Full badge — colored pill with label -->
<BadgeState :value="resource" />

<!-- Tag style — for non-K8s states -->
<RcTag :type="tagType" :highlight="isActive">
  {{ label }}
</RcTag>
```

**Choosing between variants:**

| Scenario | Component |
|---|---|
| Kubernetes resource state in a table | `BadgeState` (formatter) |
| Space-constrained icon column | `StateDot` + tooltip |
| Non-K8s arbitrary label / filter chip | `RcTag` |
| Registration / license status | `BadgeState` with custom color |

---

## Overview / Security Dashboard Page

Pattern for a product landing page that summarises state across many objects — scan coverage, vulnerability counts, registry health — rather than listing one resource type.

**Used in:** SUSE Security (`pkg/vulnerability-scanner/pages/c/_cluster/vulnerability-scanner/Dashboard.vue`)
**Core components:** `LabeledSelect`, `SortableTable`, plus the primitives in **Security & Dashboard Primitives** in `rancher-ui-components.md` (stat block, distribution chart, severity amount bar, status pill, score badge)

**Skeleton:**
```vue
<template>
  <div class="overview">
    <!-- 1. Header: title + "as of" subtitle, scope selector on the right -->
    <header class="overview-header">
      <div>
        <h1>{{ t('myext.overview.title') }}</h1>
        <span class="text-muted">{{ t('myext.overview.asOf', { date: asOf }) }}</span>
      </div>
      <LabeledSelect
        v-model:value="scope"
        :options="scopeOptions"
        :label="t('myext.overview.scope')"
        class="overview-scope"
      />
    </header>

    <!-- 2. Nothing set up yet -> empty state instead of empty sections -->
    <DashboardEmptyState v-if="!hasData" />

    <template v-else>
      <!-- 3. One or two summary strips -->
      <div class="summary-section">…</div>

      <!-- 4. The detail table, filtered by clicks in the strips above -->
      <SortableTable :rows="rows" :headers="headers" :table-actions="true" @selection="onSelection">
        <template #header-left>
          <ScanButton :disabled="!selection.length" @click="scan" />
        </template>
      </SortableTable>
    </template>
  </div>
</template>
```

```scss
.overview-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.overview-header h1 { font-size: 24px; margin: 0; }
.overview-scope { width: 225px; }
```

**Notes:**
- **Header:** a 24px title with a muted subtitle carrying the data's freshness ("as of Oct 12, 2026 12:00 pm"), and a `LabeledSelect` on the right (≈225px) scoping the whole page — "All registries", or one registry. This fits multi-instance products well: one selector in the header, defaulting to "All"
- The strips are the navigation: clicking a severity, a status or a CVE filters or routes to the table below. Keep the filter in the route query so the view is linkable and survives a refresh
- Gate everything on `schemaFor(...)` permissions as usual — an overview page that renders zeros because the user cannot list the resource is worse than a "no permission" banner
- Keep the page to one screen of summary plus one table. If a section needs its own table, it needs its own tab

---

## Summary Strip

Pattern for grouping two or three related summaries at the top of a page. **This is the biggest layout difference from a conventional dashboard:** related summaries sit in *one* bordered container, side by side, separated by a divider — not as separate boxed cards in a grid.

**Used in:** SUSE Security `pages/c/_cluster/vulnerability-scanner/RegistriesConfiguration.vue`, `components/ImageDetails.vue`
**Core components:** plain markup plus whatever goes inside — stat blocks, distribution charts, top-N lists

**Skeleton:**
```vue
<div class="summary-section">
  <section class="summary-block">
    <h3 class="summary-title">
      {{ t('myext.overview.mostSevere.title') }}
      <i v-clean-tooltip="t('myext.overview.mostSevere.tooltip')" class="icon icon-question-mark" />
    </h3>
    <!-- top-N list, distribution chart, stat blocks... -->
  </section>
  <section class="summary-block">…</section>
</div>
```

```scss
.summary-section {
  display: flex;
  align-items: stretch;
  border: var(--border-width) solid var(--input-border);
  border-radius: 6px;
  margin-bottom: 24px;
}

.summary-block {
  flex: 1 1 0;
  min-width: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  & + & { border-left: var(--border-width) solid var(--input-border); }
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 400;
  line-height: 21px;
}

@media (max-width: 1200px) {
  .summary-section { flex-direction: column; }
  .summary-block + .summary-block { border-left: 0; border-top: var(--border-width) solid var(--input-border); }
}
```

**Notes:**
- Each section is only as tall as its content, and the strip stacks vertically below 1200px
- The `& + &` rule above is the portable way to get the divider. SUSE Security instead puts a `border-right` on the child component itself (`RecentUpdatedRegistries`), which only works when you control every child — prefer the sibling selector
- `Dashboard.vue` is *not* an example of this: it uses separate bordered panels in a `gap: 24px` row. Use it for unrelated summaries, and the single bordered strip for related ones
- The info icon is `icon-question-mark` with `v-clean-tooltip` — see **Info Tooltip** in `rancher-ui-components.md`
- Put an optional muted total in the section header, on the right ("1575 images")

**Anti-pattern:** a CSS grid of equal-height bordered cards. One tall card (a pod/PVC health list, say) stretches the whole row, and the cards next to it end up mostly empty. Long lists belong in a table or a tab, not in a summary section.

---

## Top-N List

Pattern for the "worst five" section of an overview — highest-scoring CVEs, most affected images, noisiest namespaces. Fixed row count, fixed columns, no pagination.

**Used in:** SUSE Security `components/common/MostSevereVulnerabilities.vue` + `SevereVulnerabilitiesItem.vue`, `components/TopSevereVulnerabilitiesChart.vue`
**Core components:** `ScoreBadge`, `FixAvailableIcon`, severity amount bar (all in `rancher-ui-components.md`)

The CVE variant shows exactly **5 rows** in fixed columns:

| Column | Width | Content |
|---|---|---|
| CVE | 170px | router link, single line, ellipsis |
| Score | 128px | `ScoreBadge`: "9.8 (v3)" on a 96px badge coloured by severity (n/a = grey) |
| Package | flex | single line, ellipsis, full text in `title` |
| Fix | 40px | fix-available icon |

**Notes:**
- If there are fewer than 5 results, pad with empty rows so the section height doesn't change between refreshes
- Hovering a row sets `background: var(--sortable-table-selected-bg)`
- Sort by score descending, then by severity
- **CVE IDs and package versions never wrap onto two lines.** Truncate them and put the full text in a tooltip or `title`
- A "most affected images" list is one row per image: name link (`flex: 1`, ellipsis) + expanded severity amount bar (`flex: 1`)
- Don't build this with `SortableTable` — there is no sorting, filtering or paging to offer, and the table chrome fights the surrounding strip. Plain rows in a flex column are enough
- Every row is a link into the filtered full list; add a "View all" link in the section header for the unfiltered one

---

## Security Detail Page

Pattern for the detail view of a non-Kubernetes object that carries security findings — a container image, a registry, a report.

**Used in:** SUSE Security `components/ImageDetails.vue`
**Core components:** `BadgeState`, `ResourceTabs`, `Tab`, `SortableTable`, plus the summary strip above

**Skeleton:**
```vue
<template>
  <div>
    <!-- Header: back link, name, overall severity, actions -->
    <header class="detail-header">
      <h1>
        <router-link :to="listRoute">{{ t('myext.images.label') }}:</router-link>
        {{ image.name }}
        <BadgeState :color="severityColor" :label="severityLabel" />
      </h1>
      <div class="actions">
        <RcButton @click="downloadSbom">{{ t('myext.image.sbom') }}</RcButton>
        <RcButton @click="downloadReport">{{ t('myext.image.report') }}</RcButton>
      </div>
    </header>

    <!-- 3-column property list -->
    <RancherMeta :value="image" />

    <ResourceTabs :value="image" :need-related="false" :need-events="false">
      <Tab name="vulnerabilities" :label="t('myext.image.tabs.vulnerabilities')">
        <!-- summary strip first: Most severe 5 | Severity distribution -->
        <div class="summary-section">…</div>
        <!-- then the table, filtered by clicks in the strip -->
        <SortableTable :rows="filteredCves" :headers="cveHeaders" />
      </Tab>
    </ResourceTabs>
  </div>
</template>
```

**Notes:**
- The header `h1` is a back link ("Images:"), the resource name, and a `BadgeState` carrying the overall severity. Actions sit on the right (Download SBOM, Download report). The severity badge in `ImageDetails.vue` is 12px; the shell `TitleBar` badge is 16px — see [Detail Page Masthead](#detail-page-masthead)
- The metadata block is a 3-column property list (`pkg/common/components/RancherMeta.vue` — `column-count: 3; column-gap: 24px; margin: 16px 0 24px;` with `break-inside: avoid` on each item)
- **On shell 3.x, prefer Rancher's own resource-detail components** (`TitleBar` layout, `IdentifyingInformation`, `SpacedRow`, `Card`) over hand-rolled header markup — see [Detail Page Masthead](#detail-page-masthead). The hand-rolled version above is what SUSE Security does today
- `ResourceTabs` with `:need-related="false" :need-events="false"` — non-Kubernetes data has no owner graph and no events
- Inside the tab, the summary strip comes first and the table second. Clicking a severity in the strip filters the table

---

## Dashboard Empty State

Pattern for a dashboard with nothing to show yet — no registries configured, no scans run. Show this **instead of** the summary sections, never alongside them.

**Used in:** SUSE Security `pages/c/_cluster/vulnerability-scanner/Dashboard.vue`
**Core components:** `RichTranslation`, `SubtleLink`, `RcButton`

**Skeleton:**
```vue
<div class="empty-state">
  <h1>{{ t('myext.empty.title') }}</h1>
  <p>{{ t('myext.empty.description') }}</p>
  <RichTranslation k="myext.empty.docs">
    <template #link>
      <SubtleLink :href="docsUrl" target="_blank" rel="noopener noreferrer nofollow" />
    </template>
  </RichTranslation>
  <RcButton primary class="empty-cta" @click="goToCreate">
    {{ t('myext.empty.cta') }}
  </RcButton>
</div>
```

```scss
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 72px; text-align: center; }
.empty-cta { min-width: 140px; }
```

**Notes:**
- Four parts, in order: `h1` title, one-line description, a docs link, a primary CTA that goes to the create/setup page
- The docs link goes through `RichTranslation` + `SubtleLink` so the sentence stays translatable, and opens in a new tab
- A dashboard full of zeros is not an empty state — it reads as broken data. Branch on "has the user set anything up", not on "is the total 0"
- Distinguish "nothing configured" (CTA to create) from "configured but no findings" (that is a success message, not an empty state)

---

## Scan Actions & Auto-Refresh

Pattern for pages that trigger long-running backend work and then have to keep themselves current.

**Used in:** SUSE Security `components/common/ScanButton.vue`, `Dashboard.vue`, `RegistriesConfiguration.vue`
**Core components:** `RcButton`, `SortableTable`, `growl` store

**Notes:**
- **Scan button:** `RcButton variant="primary"` with `icon-play`, disabled until something is selected
- **Bulk actions:** `SortableTable` with `:table-actions="true"` and `@selection`, with the custom buttons in the `#header-left` slot
- **Feedback:** dispatch `growl/success` or `growl/error` on completion, then reload the rows. Never leave the button in a loading state with no outcome
- **Refresh:** the Dashboard re-reads every 20 s with `setInterval`, cleared in `beforeUnmount`. Use this *only* for data that does not come from Steve
- **Kubernetes-backed lists need no polling** — `findAll` opens a WebSocket watch and the store updates itself. Adding an interval on top of a watch doubles the API load for nothing
- Clear the interval on unmount *and* pause it while a scan request is in flight, so a slow response doesn't stack up overlapping reloads

---

## SUSE Security Source Map

Where the dashboard patterns above and the primitives in `rancher-ui-components.md` come from, and which files are safe to learn from.

All paths are under [`pkg/vulnerability-scanner/`](https://github.com/rancher/security-ui-exts/tree/c1a1dbac5fa7962247c4777c2521b646c855c693/pkg/vulnerability-scanner) in `rancher/security-ui-exts`, pinned to commit [`c1a1dbac`](https://github.com/rancher/security-ui-exts/tree/c1a1dbac5fa7962247c4777c2521b646c855c693/pkg/vulnerability-scanner), which was `main` on 2026-10-13. Check `main` for newer work before copying.

**Read this first:**
- **Copy the look, not the code.** The repo is Options API with `$fetchState`. Rewrite as `<script setup lang="ts">` (rule #7 in `SKILL.md`)
- **Good examples:** `components/ImageDetails.vue`, `components/common/MostSevereVulnerabilities.vue`, `components/DistributionChart.vue` + `components/common/BarChart.vue`, `components/common/AmountBarBySeverity.vue`, `components/common/StatusBadge.vue`, `components/common/ScoreBadge.vue`, the "Scanning status" panel in `pages/.../Dashboard.vue`, and the summary in `pages/.../RegistriesConfiguration.vue`
- **Don't copy:**
  - `pages/.../Vulnerabilities.vue` — hard-codes `#141419` / `#DCDEE7` / `#FFF` (lines 158/179/180), which break dark mode, and its `cves` array is never populated (no `findAll`), so the table renders empty
  - `components/TopSevereVulnerabilitiesChart.vue` — also hard-codes `#DCDEE7` / `#141419`
  - `components/TopRiskyImagesChart.vue` — hard-coded English title, and not referenced anywhere at this commit
  - `components/rancher-rewritten/shell/components/PercentageBar.vue` + `graph/Bar.vue` — a fork of shell that adds one `height` prop; see **Percentage Bar Variants** in `rancher-ui-components.md`
  - Also skip the `font-family: Lato` lines (shell already uses Lato) and the hex `.btn-link` colours
- **Severity colours are the one allowed custom palette** (rule #4 in `SKILL.md`) — see **Severity & Status Palette** in `rancher-ui-components.md`

**File map:**

| Pattern | File |
|---|---|
| Dashboard page: header + scope select, stat blocks, empty state, 20 s refresh | `pages/c/_cluster/vulnerability-scanner/Dashboard.vue` |
| Detail header, meta, summary strip inside tab | `components/ImageDetails.vue`, `pkg/common/components/RancherMeta.vue` |
| Summary strip (single bordered container) | `pages/c/_cluster/vulnerability-scanner/RegistriesConfiguration.vue`, `components/RecentUpdatedRegistries.vue` |
| Distribution chart | `components/DistributionChart.vue`, `components/common/BarChart.vue` |
| Severity amount bar (+ popover) | `components/common/AmountBarBySeverity.vue`, `components/common/AmountBarBySeverityPoppedDetail.vue`, `formatters/IdentifiedCVEsCell.vue` |
| Percentage bar variants | `components/common/StackedPercentageBar.vue`, `components/common/BlockPercentageBar.vue` |
| Top-5 CVE list, score badge | `components/common/MostSevereVulnerabilities.vue`, `components/common/SevereVulnerabilitiesItem.vue`, `components/common/ScoreBadge.vue` |
| Status pill, registry status updates | `components/common/StatusBadge.vue`, `components/common/RegistryStatusUpdate.vue` |
| Fix-available icon, info tooltip | `components/common/FixAvailableIcon.vue`, `components/common/Tooltip.vue` |
| Scan button | `components/common/ScanButton.vue` |
| RBAC gating from schema methods | `utils/permissions.ts` |
| Palette | `styles/_variables.scss` |
| Table headers/formatters for CVE/image tables | `config/table-headers.ts`, `formatters/*` |

**RBAC note.** `utils/permissions.ts` is the compact version of the permission check described in `SKILL.md`:

```ts
export function getPermissions(getters: any) {
  const resourceMethods = getters['cluster/schemaFor'](RESOURCE.REGISTRY)?.resourceMethods || [];

  return {
    canEdit:   resourceMethods.includes('PUT'),
    canDelete: resourceMethods.includes('DELETE'),
  };
}
```

---

## Resource Selector

Pattern for selecting an existing Kubernetes resource (secret, configmap, PVC, service) from a namespace-scoped dropdown within a form.

**Used in:** Logging configs, monitoring configs, workload volume mounts, ingress TLS
**Core components:** `LabeledSelect` (driven by store resources), or specialized selectors: `SecretSelector`, `SimpleSecretSelector`, `ServiceNameSelect`

**Skeleton:**
```vue
<template>
  <div class="row mt-20">
    <div class="col span-6">
      <LabeledSelect
        v-model:value="value.spec.secretRef.name"
        label="Secret"
        :options="secretOptions"
        :mode="mode"
        :loading="secretsLoading"
        :append-to-body="true"
      />
    </div>
  </div>
</template>

<script>
export default {
  async fetch() {
    await this.$store.dispatch('cluster/findAll', { type: 'secret' });
  },

  computed: {
    secretsLoading() { return this.$fetchState.pending; },
    secretOptions() {
      return (this.$store.getters['cluster/all']('secret') || [])
        .filter(s => s.namespace === this.value.metadata.namespace)
        .map(s => ({ label: s.name, value: s.name }));
    },
  },
};
</script>
```

**Variations:**
- Use `SecretSelector` for the common pattern of selecting a secret by type (TLS, registry, basic-auth)
- Use `SimpleSecretSelector` for read-only display of a selected secret reference
- Use `ServiceNameSelect` for selecting a service by name within a namespace

**Notes:**
- Always filter by namespace when the parent resource is namespace-scoped
- Use `appendToBody: true` on `LabeledSelect` to avoid dropdown clipping inside form panels

---

## Select or Create Auth Secret

Pattern for form fields where the user can either select an existing secret or create a new one inline (username/password, registry credentials, SSH key). Common in logging outputs, image pull secrets, and git authentication.

**Used in:** `shell/edit/` — logging, monitoring, registry configs
**Core components:** `SelectOrCreateAuthSecret`

**Skeleton:**
```vue
<SelectOrCreateAuthSecret
  :value="value.spec.auth"
  :mode="mode"
  :secret-namespace="value.metadata.namespace"
  :secret-schema="secretSchema"
  @update:value="value.spec.auth = $event"
/>
```

**Notes:**
- `SelectOrCreateAuthSecret` presents a dropdown of existing secrets plus a "Create new" option that expands an inline credential form
- Pass `secretNamespace` matching the parent resource's namespace — cross-namespace secret references are generally not valid
- The inline create form mirrors the cloud credential form pattern for the relevant secret type

---

## Cloud Credential Form

Standard pattern for a cloud provider credential input sub-component. These are embedded inside a larger credential creation workflow — not standalone pages.

**Used in:** `shell/cloud-credential/`
**Core components:** `LabeledInput`, `LabeledSelect`, `Checkbox`
**Mixins:** `CreateEditView`, `FormValidation`

**Skeleton:**
```vue
<template>
  <div>
    <div class="row">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.accessKey"
          :label="t('credential.accessKey.label')"
          :mode="mode"
          :rules="fvGetAndReportPathRules('accessKey')"
          type="password"
        />
      </div>
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.secretKey"
          :label="t('credential.secretKey.label')"
          :mode="mode"
          :rules="fvGetAndReportPathRules('secretKey')"
          type="password"
        />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <LabeledSelect
          v-model:value="value.region"
          :label="t('credential.region.label')"
          :options="regionOptions"
          :mode="mode"
          :append-to-body="true"
        />
      </div>
    </div>
  </div>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';

export default {
  mixins: [CreateEditView, FormValidation],

  props: {
    value: { type: Object, required: true },
    mode: { type: String, required: true },
  },

  computed: {
    fvFormRuleSets() {
      return [
        { path: 'accessKey', rules: ['required'] },
        { path: 'secretKey', rules: ['required'] },
      ];
    },
  },

  watch: {
    fvFormIsValid(val) { this.$emit('validationChanged', val); },
    value(val) { this.$emit('valueChanged', val); },
  },
};
</script>
```

**Notes:**
- Always emit `validationChanged` and `valueChanged` — the parent workflow depends on both
- Use `type="password"` for all secret/token fields — never `type="text"`
- Keep the component focused: 30–80 lines, credential-specific fields only
- Validate required fields via `fvFormRuleSets` so errors surface in the parent's footer rollup

---

## Membership / Access Control Editor

Pattern for managing RBAC membership — assigning roles to users or groups for a cluster or project. Used at the end of provisioning forms and in standalone membership management pages.

**Used in:** `pkg/harvester-manager/`, `pkg/gke/`, `pkg/imported/`, `shell/edit/management.cattle.io.cluster/`
**Core components:** `ClusterMembershipEditor`

**Skeleton:**
```vue
<Tab name="members" :label="t('tab.members')" :weight="90">
  <ClusterMembershipEditor
    :mode="mode"
    :parent-id="value.id"
    @membership-update="onMembershipUpdate"
  />
</Tab>
```

**Notes:**
- Place in a dedicated tab at `weight: 90` — after configuration tabs but before the Labels tab
- `ClusterMembershipEditor` manages its own fetch, display, and edit flow — do not add manual member list management
- `@membership-update` returns the pending membership changes; apply them as part of the resource save or as a separate API call depending on whether the cluster already exists

---

## Helm Chart Install Wizard

Specialised pattern combining a `Wizard` step bar with `Questions` (schema-driven values form) and a Readme viewer. The standard UI for guided Helm chart installation.

**Used in:** `shell/pages/c/_cluster/apps/charts/install.vue`
**Core components:** `Wizard`, `Questions`, `ChartReadme`, `ButtonGroup`

**Skeleton:**
```vue
<template>
  <Wizard :steps="installSteps" @finish="install" @cancel="cancel">
    <template #readme="{ step }">
      <ChartReadme :chart="chart" />
    </template>

    <template #values="{ step }">
      <ButtonGroup
        v-model:value="valuesMode"
        :options="['Form', 'YAML']"
        class="mb-20"
      />
      <Questions
        v-if="valuesMode === 'Form'"
        v-model:value="chartValues"
        :source="chart.questions"
        :target-namespace="targetNamespace"
      />
      <YamlEditor
        v-else
        v-model:value="yamlValues"
      />
    </template>

    <template #confirm="{ step }">
      <!-- Read-only summary of selected values -->
      <Questions
        v-model:value="chartValues"
        :source="chart.questions"
        mode="view"
      />
    </template>
  </Wizard>
</template>
```

**Step structure:**

| Step | Content | Purpose |
|---|---|---|
| Readme | `ChartReadme` | Show chart documentation |
| Values | `Questions` (form) or YAML editor | Configure chart values |
| Confirm | `Questions` (view mode) | Review before install |

**Notes:**
- The `ButtonGroup` (Form / YAML) toggle is standard — always provide both input modes for chart values
- Sync between the form model (`chartValues`) and YAML string on toggle — don't lose user input when switching modes
- The Confirm step in view mode uses `Questions` with `mode="view"` — no additional summary component needed

---

## Home / Dashboard Landing Page

Pattern for the app home page showing a cluster list, status summary, and optional dynamic promotional content. A multi-section layout that combines resource tables with contextual widgets.

**Used in:** `shell/pages/home.vue`
**Core components:** `BannerGraphic`, `PaginatedResourceTable`, `SingleClusterInfo`, `BadgeState`, `DynamicContentBanner`, `DynamicContentPanel`

**Skeleton:**
```vue
<template>
  <div class="home-page">
    <!-- Welcome banner -->
    <BannerGraphic :title="t('home.welcome')" />

    <!-- Dynamic content from CMS (optional) -->
    <DynamicContentBanner v-if="hasDynamicContent" :content="dynamicBanner" />

    <!-- Single-cluster shortcut (when only one cluster) -->
    <SingleClusterInfo v-if="singleCluster" :cluster="clusters[0]" />

    <!-- Full cluster list -->
    <PaginatedResourceTable
      v-else
      :schema="clusterSchema"
      :headers="clusterHeaders"
    />

    <!-- Extension panels -->
    <DynamicContentPanel :content="dynamicPanels" />
  </div>
</template>
```

**Notes:**
- `DynamicContentBanner` and `DynamicContentPanel` are driven by an external CMS feed — always guard with `v-if` so the page degrades gracefully if the feed is unavailable
- `SingleClusterInfo` appears when the user has access to exactly one cluster — shows cluster-specific stats without needing a list
- Extension panels (`ExtensionPanel` / `DynamicContentPanel`) allow Rancher extensions to inject content into the home page — always include the extension point slots even if the app currently has no extensions

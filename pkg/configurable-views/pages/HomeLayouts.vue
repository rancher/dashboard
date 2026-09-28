<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import jsyaml from 'js-yaml';
import {
  appliedViewScopes, fetchTemplatingConfigMaps, getPageConfig, savePageConfig, type PageConfig
} from '../templating/template-engine';
import { cssSize, isStockView } from '../templating/view-model';
import type { View, ViewSet } from '../templating/types';

// Lists the saved views — their VIEWS (which render as tabs) and the WIDGETS on each. Editing
// happens on the Home page; this page is for seeing what is stored, and for editing it as YAML.

const store = useStore();

const userId = ref<string | null>(null);
const loaded = ref(false);
const yamlEditing = ref(false);
const yamlDraft = ref('');
const yamlError = ref('');
const savingYaml = ref(false);
const yamlStatus = ref('');

const homeRoute = { name: 'home' };

onMounted(async() => {
  await fetchTemplatingConfigMaps(store);
  const user = await store.dispatch('auth/getUser').catch(() => null);

  userId.value = user?.id || store.getters['auth/user']?.id || null;
  loaded.value = true;
});

const scopes = computed(() => appliedViewScopes(store.getters, userId.value));

// The scopes that actually have a view applied, each with its views.
const sections = computed(() => {
  const out: { key: string; label: string; set: ViewSet }[] = [];

  if (scopes.value.global) {
    out.push({
      key: 'global', label: 'Global (everyone)', set: scopes.value.global
    });
  }
  if (scopes.value.user) {
    out.push({
      key: 'user', label: 'Your Home', set: scopes.value.user
    });
  }

  return out;
});

const isStock = (view: View) => isStockView(view);

// A view's widgets, in the order they sit on the grid.
function rowsFor(view: View) {
  if (isStockView(view)) {
    return [];
  }

  return view.widgets.map((w) => ({
    id:      w.id,
    label:   w.widget.title || w.widget.kind || 'Widget',
    kind:    w.widget.kind,
    size:    `col-span-${ w.colSpan }`,
    padding: [w.padding.top, w.padding.right, w.padding.bottom, w.padding.left].map(cssSize).join(' / '),
  }));
}

// ---- manual YAML editing of the whole stored config (templating-home data.home) ----

function openYaml(): void {
  yamlError.value = '';
  yamlStatus.value = '';
  yamlDraft.value = jsyaml.dump(getPageConfig(store.getters) || {});
  yamlEditing.value = true;
}

function cancelYaml(): void {
  yamlEditing.value = false;
  yamlError.value = '';
}

async function saveYaml(): Promise<void> {
  let parsed: PageConfig;

  try {
    const loadedYaml = jsyaml.load(yamlDraft.value);

    parsed = loadedYaml && typeof loadedYaml === 'object' ? loadedYaml as PageConfig : {};
  } catch (e) {
    yamlError.value = (e as Error)?.message || 'Invalid YAML';

    return;
  }

  savingYaml.value = true;
  yamlError.value = '';

  try {
    await savePageConfig(store, parsed);
    await fetchTemplatingConfigMaps(store);
    yamlStatus.value = 'Saved.';
    yamlEditing.value = false;
  } catch (e) {
    yamlError.value = (e as Error)?.message || String(e);
  } finally {
    savingYaml.value = false;
  }
}
</script>

<template>
  <div class="home-layouts">
    <h1 class="mb-10">
      Home Layouts
    </h1>
    <p class="text-muted mb-20">
      Every saved <b>view</b> of the Home — the tabs in its bar — and the
      <b>widgets</b> on each. They live in the <code>templating-home</code> config. Edit them on the
      <router-link :to="homeRoute">
        Home
      </router-link> page, or by hand with <b>Edit YAML</b>.
    </p>

    <div class="home-layouts__toolbar">
      <button
        v-if="!yamlEditing"
        class="btn btn-sm role-secondary"
        @click="openYaml"
      >
        <i class="icon icon-file" /> Edit YAML
      </button>
      <span
        v-if="yamlStatus"
        class="text-success ml-10"
      >{{ yamlStatus }}</span>
    </div>

    <!-- Manual YAML editor for the whole applied-Home config (templating-home data.home). -->
    <div
      v-if="yamlEditing"
      class="home-layouts__yaml"
    >
      <div class="home-layouts__yaml-bar">
        <span class="text-muted">Editing <code>templating-home</code> · <code>data.home</code> (YAML)</span>
        <span
          v-if="yamlError"
          class="text-error"
        >{{ yamlError }}</span>
        <button
          class="btn btn-sm role-secondary"
          @click="cancelYaml"
        >
          Cancel
        </button>
        <button
          class="btn btn-sm role-primary"
          :disabled="savingYaml"
          @click="saveYaml"
        >
          {{ savingYaml ? 'Saving…' : 'Save' }}
        </button>
      </div>
      <textarea
        v-model="yamlDraft"
        class="home-layouts__yaml-code"
        spellcheck="false"
      />
    </div>

    <div
      v-if="loaded && !sections.length && !yamlEditing"
      class="text-muted"
    >
      No Home view is applied yet. Open the <router-link :to="homeRoute">
        Home
      </router-link> page and click <b>Edit Home</b> to build one.
    </div>

    <div
      v-for="sec in sections"
      :key="sec.key"
      class="home-layouts__scope"
    >
      <h3 class="home-layouts__scope-title">
        {{ sec.label }}
        <span class="text-muted">— {{ sec.set.views.length }} view(s)</span>
      </h3>

      <div class="home-layouts__tabs">
        <div
          v-for="view in sec.set.views"
          :key="view.id"
          class="home-layouts__tab"
        >
          <div class="home-layouts__tab-head">
            <span class="home-layouts__tab-name">{{ view.name }}</span>
            <span
              v-if="isStock(view)"
              class="text-muted"
            >stock</span>
          </div>

          <!-- A stock view renders Rancher's own Home; it has no layout to list. -->
          <div
            v-if="isStock(view)"
            class="text-muted home-layouts__empty"
          >
            Rancher's own Home, shown as a tab. Nothing to configure.
          </div>

          <table
            v-else
            class="home-layouts__views"
          >
            <thead>
              <tr>
                <th>Structure</th>
                <th>Kind</th>
                <th>Size (W × H)</th>
                <th>Padding (T/R/B/L)</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in rowsFor(view)"
                :key="row.id"
              >
                <td>
                  <span>
                    <span class="home-layouts__node-icon">▣</span>
                    {{ row.label }}
                  </span>
                </td>
                <td>
                  <span
                    v-if="row.kind"
                    class="home-layouts__kind"
                  >{{ row.kind }}</span>
                </td>
                <td class="text-muted">
                  {{ row.size }}
                </td>
                <td class="text-muted">
                  {{ row.padding }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-layouts {
  padding: 16px;

  code {
    padding: 1px 4px;
  }

  &__toolbar {
    align-items:   center;
    display:       flex;
    margin-bottom: 16px;
  }

  &__yaml {
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    margin-bottom: 24px;
    overflow:      hidden;
  }

  &__yaml-bar {
    align-items:   center;
    background:    var(--box-bg);
    border-bottom: 1px solid var(--border);
    display:       flex;
    gap:           8px;
    padding:       6px 10px;

    // The first label takes the slack so Cancel/Save sit at the right.
    > span:first-child {
      margin-right: auto;
    }
  }

  &__yaml-code {
    background:  var(--body-bg);
    border:      none;
    color:       var(--body-text);
    font-family: monospace;
    font-size:   12px;
    min-height:  360px;
    padding:     10px;
    resize:      vertical;
    width:       100%;
  }

  &__scope {
    margin-bottom: 28px;
  }

  &__scope-title {
    margin-bottom: 12px;
  }

  &__tabs {
    display: grid;
    gap:     14px;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  }

  &__tab {
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    background:    var(--body-bg);
    overflow:      hidden;
  }

  &__tab-head {
    align-items:     center;
    background:      var(--box-bg);
    border-bottom:   1px solid var(--border);
    display:         flex;
    justify-content: space-between;
    padding:         8px 12px;
  }

  &__tab-name {
    font-weight: 600;
  }

  &__views {
    width:           100%;
    border-collapse: collapse;

    th, td {
      padding:       6px 12px;
      text-align:    left;
      border-bottom: 1px solid var(--border);
    }

    th {
      color:     var(--muted);
      font-size: 12px;
      font-weight: 400;
    }

    tr:last-child td {
      border-bottom: none;
    }
  }

  &__kind {
    border-radius: 10px;
    font-size:     11px;
    padding:       1px 8px;

    &--json { background: var(--info-banner-bg, var(--nav-active)); color: var(--info); }
    &--code { background: var(--box-bg); color: var(--muted); }
    &--missing { background: var(--error-banner-bg, var(--box-bg)); color: var(--error); }
  }

  &__empty {
    padding: 12px;
  }
}
</style>

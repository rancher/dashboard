<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import type { RouteLocationRaw } from 'vue-router';
import jsyaml from 'js-yaml';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';
import { MANAGEMENT } from '@shell/config/types';
import {
  appliedViewScopes, fetchTemplatingConfigMaps, getPageConfig, savePageConfig, type PageConfig, type PageKey
} from '../templating/template-engine';
import { cssSize, isStockView, normalizeSides } from '../templating/view-model';
import { blockLabelKey } from '../templating/widget-catalog';
import type { View, ViewSet, WidgetNode } from '../templating/types';

// CONFIGURABLE VIEWS — what is saved for every configurable page: the Home and the Cluster Dashboard,
// one tab each. A page has VIEWS (the tabs in its bar), for the organization and for you, and each
// view has WIDGETS. Editing happens on the page itself; this is for seeing what is stored, and for
// editing a page's config by hand as YAML.

interface PageEntry {
  key: PageKey;
  /** The page's name, translated. */
  label: string;
  /** Where the page is, to go and edit it there; null when there is nowhere to go yet. */
  to: RouteLocationRaw | null;
}

interface Section {
  key: string;
  label: string;
  set: ViewSet;
}

const store = useStore();
const { t } = useI18n(store);

const userId = ref<string | null>(null);
const loaded = ref(false);
const yamlPage = ref<PageKey | null>(null);
const yamlDraft = ref('');
const yamlError = ref('');
const savingYaml = ref(false);
const yamlStatus = ref('');

interface ClusterSummary {
  id: string;
  isReady?: boolean;
}

// The cluster dashboard belongs to a cluster: the one that is open, else the local one, else the
// first that is up.
const openCluster = computed<string>(() => {
  const id = store.getters['clusterId'];

  if (store.getters['clusterReady'] && id && id !== BLANK_CLUSTER) {
    return id;
  }

  const clusters: ClusterSummary[] = store.getters['management/all'](MANAGEMENT.CLUSTER) || [];

  return (clusters.find((c) => c.id === 'local' && c.isReady) || clusters.find((c) => c.isReady))?.id || '';
});

const pages = computed<PageEntry[]>(() => [
  {
    key: 'home', label: t('nav.home'), to: { name: 'home' }
  },
  {
    key:   'clusterDashboard',
    label: t('clusterIndexPage.header'),
    to:    openCluster.value ? { name: 'c-cluster-explorer', params: { cluster: openCluster.value } } : null,
  },
]);

onMounted(async() => {
  store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER }).catch(() => undefined);
  await fetchTemplatingConfigMaps(store);
  const user = await store.dispatch('auth/getUser').catch(() => null);

  userId.value = user?.id || store.getters['auth/user']?.id || null;
  loaded.value = true;
});

// The scopes that have views for a page: the organization's, then yours.
function sectionsFor(page: PageKey): Section[] {
  const scopes = appliedViewScopes(store.getters, userId.value, page);
  const out: Section[] = [];

  if (scopes.global?.views.length) {
    out.push({
      key: 'global', label: t('configurableViews.savedViews.organization'), set: scopes.global
    });
  }
  if (scopes.user?.views.length) {
    out.push({
      key: 'user', label: t('configurableViews.savedViews.yours'), set: scopes.user
    });
  }

  return out;
}

const isStock = (view: View) => isStockView(view);

// What the catalog calls a building block, or its kind when the catalog has no such block.
function blockTitle(kind: string): string {
  const key = blockLabelKey(kind);

  return key ? t(key) : kind;
}

// A view's widgets, in the order they sit on the grid - and after a Tabs widget, what is in each of
// its tabs, labelled with the tab.
function rowsFor(view: View) {
  if (isStockView(view)) {
    return [];
  }

  const row = (w: WidgetNode, within = '') => {
    const sides = normalizeSides(w.padding);
    const all = [sides.top, sides.right, sides.bottom, sides.left].map(cssSize);

    return {
      id:      w.id,
      within,
      label:   w.widget.title || blockTitle(w.widget.kind),
      kind:    w.widget.kind,
      // Columns of twelve, and the height when it is not left to the content.
      size:    `${ w.colSpan }/12${ w.height && w.height !== 'auto' ? ` × ${ cssSize(w.height) }` : '' }`,
      // One value when every side is the same, which is nearly always.
      padding: all.every((v) => v === all[0]) ? all[0] : all.join(' '),
    };
  };

  return view.widgets.flatMap((w) => [
    row(w),
    ...(w.widget.tabs || []).flatMap((tab) => tab.widgets.map((inner) => row(inner, `${ w.widget.title || blockTitle(w.widget.kind) } › ${ tab.name }`))),
  ]);
}

// ---- editing one page's stored config by hand (templating-home data.<page>) ----

function openYaml(page: PageKey): void {
  yamlError.value = '';
  yamlStatus.value = '';
  yamlDraft.value = jsyaml.dump(getPageConfig(store.getters, page) || {});
  yamlPage.value = page;
}

function cancelYaml(): void {
  yamlPage.value = null;
  yamlError.value = '';
}

async function saveYaml(): Promise<void> {
  const page = yamlPage.value;
  let parsed: PageConfig;

  if (!page) {
    return;
  }

  try {
    const loadedYaml = jsyaml.load(yamlDraft.value);

    parsed = loadedYaml && typeof loadedYaml === 'object' ? loadedYaml as PageConfig : {};
  } catch (e) {
    yamlError.value = (e as Error)?.message || t('configurableViews.savedViews.invalidYaml');

    return;
  }

  savingYaml.value = true;
  yamlError.value = '';

  try {
    await savePageConfig(store, parsed, page);
    await fetchTemplatingConfigMaps(store);
    yamlStatus.value = t('configurableViews.savedViews.saved');
    yamlPage.value = null;
  } catch (e) {
    yamlError.value = (e as Error)?.message || String(e);
  } finally {
    savingYaml.value = false;
  }
}
</script>

<template>
  <div class="saved-views">
    <h1 class="mb-10">
      {{ t('configurableViews.savedViews.title') }}
    </h1>
    <p
      v-clean-html="t('configurableViews.savedViews.intro', {}, true)"
      class="text-muted mb-20"
    />

    <Tabbed>
      <Tab
        v-for="(page, i) in pages"
        :key="page.key"
        :name="page.key"
        :label="page.label"
        :weight="pages.length - i"
      >
        <div class="saved-views__toolbar">
          <router-link
            v-if="page.to"
            :to="page.to"
          >
            {{ t('configurableViews.savedViews.open', { page: page.label }) }}
          </router-link>
          <span
            v-else
            class="text-muted"
          >{{ t('configurableViews.savedViews.openCluster') }}</span>
          <span class="saved-views__gap" />
          <span
            v-if="yamlStatus"
            class="text-success"
          >{{ yamlStatus }}</span>
          <button
            v-if="yamlPage !== page.key"
            class="btn btn-sm role-secondary"
            @click="openYaml(page.key)"
          >
            <i class="icon icon-file" /> {{ t('configurableViews.savedViews.editYaml') }}
          </button>
        </div>

        <!-- This page's whole stored config, by hand (templating-home data.<page>). -->
        <div
          v-if="yamlPage === page.key"
          class="saved-views__yaml"
        >
          <div class="saved-views__yaml-bar">
            <span class="text-muted">{{ t('configurableViews.savedViews.editing') }} <code>templating-home</code> · <code>data.{{ page.key }}</code> (YAML)</span>
            <span
              v-if="yamlError"
              class="text-error"
            >{{ yamlError }}</span>
            <button
              class="btn btn-sm role-secondary"
              @click="cancelYaml"
            >
              {{ t('generic.cancel') }}
            </button>
            <button
              class="btn btn-sm role-primary"
              :disabled="savingYaml"
              @click="saveYaml"
            >
              {{ savingYaml ? t('configurableViews.bar.saving') : t('configurableViews.bar.save') }}
            </button>
          </div>
          <textarea
            v-model="yamlDraft"
            class="saved-views__yaml-code"
            spellcheck="false"
          />
        </div>

        <p
          v-if="loaded && !sectionsFor(page.key).length && yamlPage !== page.key"
          v-clean-html="t('configurableViews.savedViews.none', { page: page.label }, true)"
          class="text-muted"
        />

        <div
          v-for="sec in sectionsFor(page.key)"
          :key="sec.key"
          class="saved-views__scope"
        >
          <h3 class="saved-views__scope-title">
            {{ sec.label }}
            <span class="text-muted">— {{ t('configurableViews.savedViews.count', { count: sec.set.views.length }) }}</span>
          </h3>

          <div class="saved-views__tabs">
            <div
              v-for="view in sec.set.views"
              :key="view.id"
              class="saved-views__tab"
            >
              <div class="saved-views__tab-head">
                <span class="saved-views__tab-name">{{ view.name }}</span>
                <span class="saved-views__tags">
                  <span
                    v-if="sec.set.defaultViewId === view.id"
                    class="saved-views__kind"
                  >{{ t('configurableViews.savedViews.default') }}</span>
                  <span
                    v-if="isStock(view)"
                    class="text-muted"
                  >{{ t('configurableViews.savedViews.stock') }}</span>
                </span>
              </div>

              <!-- A stock view renders Rancher's own page; it has no layout to list. -->
              <div
                v-if="isStock(view)"
                class="text-muted saved-views__empty"
              >
                {{ t('configurableViews.savedViews.stockHint', { page: page.label }) }}
              </div>

              <div
                v-else-if="!rowsFor(view).length"
                class="text-muted saved-views__empty"
              >
                {{ t('configurableViews.savedViews.noWidgets') }}
              </div>

              <div
                v-else
                class="saved-views__scroll"
              >
                <table class="saved-views__views">
                  <thead>
                    <tr>
                      <th>{{ t('configurableViews.savedViews.columns.widget') }}</th>
                      <th>{{ t('configurableViews.savedViews.columns.kind') }}</th>
                      <th>{{ t('configurableViews.savedViews.columns.width') }}</th>
                      <th>{{ t('configurableViews.savedViews.columns.padding') }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="row in rowsFor(view)"
                      :key="row.id"
                    >
                      <td>
                        <span
                          v-if="row.within"
                          class="saved-views__within"
                        >{{ row.within }} ›</span>
                        {{ row.label }}
                      </td>
                      <td>
                        <span
                          v-if="row.kind"
                          class="saved-views__kind"
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
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang="scss" scoped>
.saved-views {
  padding: 16px;

  code {
    padding: 1px 4px;
  }

  &__toolbar {
    align-items:   center;
    display:       flex;
    gap:           10px;
    margin-bottom: 16px;
  }

  &__gap {
    flex: 1 1 auto;
  }

  &__tags {
    align-items: center;
    display:     flex;
    gap:         8px;
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

  &__scroll {
    overflow-x: auto;
  }

  &__within {
    color:     var(--muted);
    display:   block;
    font-size: 12px;
  }

  &__views {
    width:           100%;
    border-collapse: collapse;

    td:nth-child(3),
    td:nth-child(4) {
      white-space: nowrap;
    }

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
    background:    var(--box-bg);
    border:        1px solid var(--border);
    border-radius: 10px;
    font-size:     11px;
    padding:       1px 8px;
  }

  &__empty {
    padding: 12px;
  }
}
</style>

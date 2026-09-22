<script>
import jsyaml from 'js-yaml';
import {
  appliedViewScopes, savedHomeTemplates, templateByName, fetchTemplatingConfigMaps,
  getHomeConfig, saveHomeConfig, ROUTE_SETTINGS
} from '../templating/template-engine';
import { NODE_TEMPLATE, isStockPanel } from '../templating/view-model';
import { BLANK_CLUSTER } from '@shell/store/store-types.js';

// Lists the assembled Home VIEWS — their PANELS (which render as tabs) and, per panel, the tree of
// WIDGETS inside it. Views are NOT templates (they live in the templating-home
// ConfigMap), so they don't appear on the Home Templates page; this is their management view.
// Editing happens on the Home page, or manually via Edit YAML below.
export default {
  name: 'HomeLayouts',

  data() {
    return {
      userId:      null,
      loaded:      false,
      yamlEditing: false,
      yamlDraft:   '',
      yamlError:   '',
      savingYaml:  false,
      yamlStatus:  '',
    };
  },

  async created() {
    await fetchTemplatingConfigMaps(this.$store).catch(() => {});
    const user = await this.$store.dispatch('auth/getUser').catch(() => null);

    this.userId = user?.id || this.$store.getters['auth/user']?.id || null;
    this.loaded = true;
  },

  computed: {
    scopes() {
      return appliedViewScopes(this.$store.getters, this.userId);
    },

    // The scopes that actually have a view applied, each with its panels.
    sections() {
      const out = [];

      if (this.scopes.global) {
        out.push({
          key: 'global', label: 'Global (everyone)', view: this.scopes.global
        });
      }
      if (this.scopes.user) {
        out.push({
          key: 'user', label: 'Your Home', view: this.scopes.user
        });
      }

      return out;
    },

    homeRoute() {
      return { name: 'home' };
    },

    settingsRoute() {
      return { name: ROUTE_SETTINGS, params: { cluster: BLANK_CLUSTER } };
    },
  },

  methods: {
    displayName(name) {
      const t = savedHomeTemplates(this.$store.getters).find((c) => c.metadata?.name === name);

      return t?.spec?.displayName || name;
    },

    kindOf(name) {
      const k = templateByName(this.$store.getters, name).kind;

      return k === 'json' ? 'JSON' : (k === 'code' ? 'Code' : 'missing');
    },

    isStock(panel) {
      return isStockPanel(panel);
    },

    // A panel's widgets, in the order they sit on the grid.
    rowsFor(panel) {
      return (panel?.widgets || []).map((w) => {
        const isTemplate = w.type === NODE_TEMPLATE;

        return {
          id:      w.id,
          isTemplate,
          label:   isTemplate ? this.displayName(w.template) : (w.widget?.title || w.widget?.kind || 'Widget'),
          kind:    isTemplate ? this.kindOf(w.template) : w.widget?.kind,
          size:    `col-span-${ w.colSpan }`,
          padding: [w.padding?.top, w.padding?.right, w.padding?.bottom, w.padding?.left].join(' / '),
        };
      });
    },

    // ---- manual YAML editing of the whole applied-Home config (templating-home data.home) ----
    openYaml() {
      this.yamlError = '';
      this.yamlStatus = '';
      this.yamlDraft = jsyaml.dump(getHomeConfig(this.$store.getters) || {});
      this.yamlEditing = true;
    },

    cancelYaml() {
      this.yamlEditing = false;
      this.yamlError = '';
    },

    async saveYaml() {
      let parsed;

      try {
        parsed = jsyaml.load(this.yamlDraft) || {};
      } catch (e) {
        this.yamlError = e?.message || 'Invalid YAML';

        return;
      }

      this.savingYaml = true;
      this.yamlError = '';

      try {
        await saveHomeConfig(this.$store, parsed);
        await fetchTemplatingConfigMaps(this.$store).catch(() => {});
        this.yamlStatus = 'Saved.';
        this.yamlEditing = false;
      } catch (e) {
        this.yamlError = e?.message || String(e);
      } finally {
        this.savingYaml = false;
      }
    },
  },
};
</script>

<template>
  <div class="home-layouts">
    <h1 class="mb-10">
      Home Layouts
    </h1>
    <p class="text-muted mb-20">
      The assembled Home <b>views</b> — each <b>panel</b> (panels render as tabs) and the
      <b>widgets</b> on it. Views aren't templates (they live in the
      <code>templating-home</code> config), so they don't show on the
      <router-link :to="settingsRoute">
        Home Templates
      </router-link> page. Edit them on the
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
        <span class="text-muted">— {{ sec.view.panels.length }} panel(s)</span>
      </h3>

      <div class="home-layouts__tabs">
        <div
          v-for="panel in sec.view.panels"
          :key="panel.id"
          class="home-layouts__tab"
        >
          <div class="home-layouts__tab-head">
            <span class="home-layouts__tab-name">{{ panel.name }}</span>
            <span
              v-if="isStock(panel)"
              class="text-muted"
            >stock</span>
          </div>

          <!-- A stock panel renders Rancher's own Home; it has no layout to list. -->
          <div
            v-if="isStock(panel)"
            class="text-muted home-layouts__empty"
          >
            Rancher's own Home, shown as a tab. Nothing to configure.
          </div>

          <table
            v-else
            class="home-layouts__panels"
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
                v-for="row in rowsFor(panel)"
                :key="row.id"
              >
                <td>
                  <span>
                    <span class="home-layouts__node-icon">{{ row.isTemplate ? '▤' : '▣' }}</span>
                    {{ row.label }}
                  </span>
                </td>
                <td>
                  <span
                    v-if="row.isTemplate"
                    class="home-layouts__kind"
                    :class="`home-layouts__kind--${ row.kind.toLowerCase() }`"
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

  &__panels {
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

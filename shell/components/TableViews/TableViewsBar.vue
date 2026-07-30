<script>
import { mapPref, TABLE_VIEWS } from '@shell/store/prefs';
import { randomStr } from '@shell/utils/string';
import { LABEL_FIELD_PREFIX, encodeView } from '@shell/utils/table-views';
import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput';

/**
 * The toolbar above a resource table - filter query, column picker, group by, export and
 * saved views. Modelled on the GitHub Projects table toolbar.
 *
 * All of the state lives in the `view` prop so the owning table can apply it; this
 * component only owns the saved view list (stored as a user preference).
 */
export default {
  name: 'TableViewsBar',

  emits: ['update:view', 'export'],

  components: { TableViewQueryInput },

  props: {
    /**
     * { query, columns, labelColumns, groupBy }
     */
    view: {
      type:     Object,
      required: true
    },

    /**
     * ViewField[] - everything filterable/groupable on this table
     */
    fields: {
      type:    Array,
      default: () => []
    },

    /**
     * All rows, before the view query is applied. Used for value autocomplete
     */
    rows: {
      type:    Array,
      default: () => []
    },

    /**
     * How many rows the view query leaves
     */
    matchCount: {
      type:    Number,
      default: 0
    },

    /**
     * Key the saved views are stored under, normally the resource type
     */
    resourceType: {
      type:    String,
      default: ''
    },
  },

  data() {
    return {
      newViewName: '',
      copied:      false,
    };
  },

  computed: {
    allSavedViews: mapPref(TABLE_VIEWS),

    savedViews() {
      return this.allSavedViews?.[this.resourceType] || [];
    },

    columnFields() {
      return this.fields.filter((f) => !f.isLabel);
    },

    labelFields() {
      return this.fields.filter((f) => f.isLabel);
    },

    groupOptions() {
      return [{ id: null, label: this.t('tableViews.group.none') }].concat(
        this.fields.map((f) => ({
          id:    f.id,
          label: f.isLabel ? `${ LABEL_FIELD_PREFIX }${ f.label }` : f.label
        }))
      );
    },

    groupLabel() {
      return this.groupOptions.find((o) => o.id === this.view.groupBy)?.label || this.t('tableViews.group.none');
    },

    hiddenColumnCount() {
      if (!this.view.columns) {
        return 0;
      }

      return this.columnFields.filter((f) => !this.view.columns.includes(f.id)).length;
    },

    /**
     * Which saved view (if any) the current state matches
     */
    activeViewId() {
      return this.savedViews.find((saved) => this.isSameConfig(saved, this.view))?.id || null;
    },

    isDirty() {
      return !this.activeViewId && this.isModified;
    },

    isModified() {
      return !!this.view.query || !!this.view.groupBy || !!this.view.columns || !!this.view.labelColumns?.length;
    },

    shareUrl() {
      const query = { ...this.$route.query, view: encodeView(this.view) };

      return `${ window.location.origin }${ this.$router.resolve({ path: this.$route.path, query }).href }`;
    },
  },

  methods: {
    isSameConfig(a, b) {
      return (a.query || '') === (b.query || '') &&
        (a.groupBy || null) === (b.groupBy || null) &&
        JSON.stringify(a.columns || null) === JSON.stringify(b.columns || null) &&
        JSON.stringify(a.labelColumns || []) === JSON.stringify(b.labelColumns || []);
    },

    update(changes) {
      this.$emit('update:view', { ...this.view, ...changes });
    },

    isColumnVisible(field) {
      return !this.view.columns || this.view.columns.includes(field.id);
    },

    toggleColumn(field) {
      const current = this.view.columns || this.columnFields.map((f) => f.id);
      const next = current.includes(field.id) ? current.filter((id) => id !== field.id) : current.concat([field.id]);

      this.update({ columns: next });
    },

    toggleLabelColumn(field) {
      const current = this.view.labelColumns || [];
      const next = current.includes(field.labelKey) ? current.filter((key) => key !== field.labelKey) : current.concat([field.labelKey]);

      this.update({ labelColumns: next });
    },

    setGroupBy(id) {
      this.update({ groupBy: id });
    },

    resetColumns() {
      this.update({ columns: null, labelColumns: [] });
    },

    applyView(saved) {
      this.$emit('update:view', {
        query:        saved?.query || '',
        columns:      saved?.columns || null,
        labelColumns: saved?.labelColumns || [],
        groupBy:      saved?.groupBy || null,
      });
    },

    persist(views) {
      this.allSavedViews = { ...(this.allSavedViews || {}), [this.resourceType]: views };
    },

    saveView() {
      const name = (this.newViewName || '').trim();

      if (!name) {
        return;
      }

      const view = {
        id:           randomStr(8),
        name,
        query:        this.view.query || '',
        columns:      this.view.columns || null,
        labelColumns: this.view.labelColumns || [],
        groupBy:      this.view.groupBy || null,
      };

      this.persist(this.savedViews.filter((v) => v.name !== name).concat([view]));
      this.newViewName = '';
    },

    updateView(saved) {
      this.persist(this.savedViews.map((v) => (v.id === saved.id ? {
        ...v,
        query:        this.view.query || '',
        columns:      this.view.columns || null,
        labelColumns: this.view.labelColumns || [],
        groupBy:      this.view.groupBy || null,
      } : v)));
    },

    deleteView(saved) {
      this.persist(this.savedViews.filter((v) => v.id !== saved.id));

      if (this.activeViewId === saved.id) {
        this.applyView(null);
      }
    },

    async copyShareUrl() {
      // Loaded on demand - the clipboard polyfill is esm only and pulling it in up front
      // drags it into every consumer of ResourceTable
      const { copyTextToClipboard } = await import('@shell/utils/clipboard');

      await copyTextToClipboard(this.shareUrl);
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    },

    doExport(format, scope) {
      this.$emit('export', { format, scope });
    },
  }
};
</script>

<template>
  <div
    class="table-views"
    data-testid="table-views-bar"
  >
    <div class="view-tabs">
      <button
        type="button"
        class="view-tab"
        :class="{ active: !activeViewId && !isDirty }"
        data-testid="table-views-tab-all"
        @click="applyView(null)"
      >
        {{ t('tableViews.tabs.all') }}
      </button>
      <button
        v-for="saved in savedViews"
        :key="saved.id"
        type="button"
        class="view-tab"
        :class="{ active: activeViewId === saved.id }"
        :data-testid="`table-views-tab-${saved.id}`"
        @click="applyView(saved)"
      >
        {{ saved.name }}
        <i
          class="icon icon-close remove"
          :aria-label="t('tableViews.save.delete')"
          @click.stop="deleteView(saved)"
        />
      </button>
      <span
        v-if="isDirty"
        class="view-tab dirty"
        data-testid="table-views-unsaved"
      >
        {{ t('tableViews.tabs.unsaved') }}
      </span>
    </div>

    <div class="view-controls">
      <TableViewQueryInput
        :value="view.query"
        :fields="fields"
        :rows="rows"
        @update:value="update({ query: $event })"
      />

      <span
        v-if="view.query"
        class="match-count"
        data-testid="table-views-match-count"
      >
        {{ t('tableViews.matches', { count: matchCount }) }}
      </span>

      <v-dropdown
        placement="bottom-end"
        :container="false"
      >
        <button
          type="button"
          class="btn role-tertiary view-control-btn"
          data-testid="table-views-columns"
        >
          <i class="icon icon-list-flat" />
          {{ t('tableViews.columns.label') }}
          <span
            v-if="hiddenColumnCount || view.labelColumns.length"
            class="badge"
          >{{ view.labelColumns.length ? `+${view.labelColumns.length}` : `-${hiddenColumnCount}` }}</span>
          <i class="icon icon-chevron-down" />
        </button>
        <template #popper>
          <div class="view-menu">
            <div class="menu-title">
              {{ t('tableViews.columns.tableColumns') }}
            </div>
            <label
              v-for="field in columnFields"
              :key="field.id"
              class="menu-check"
            >
              <input
                type="checkbox"
                :checked="isColumnVisible(field)"
                @change="toggleColumn(field)"
              >
              <span>{{ field.label }}</span>
            </label>
            <template v-if="labelFields.length">
              <div class="menu-title">
                {{ t('tableViews.columns.labelColumns') }}
              </div>
              <label
                v-for="field in labelFields"
                :key="field.id"
                class="menu-check"
                :data-testid="`table-views-label-col-${field.labelKey}`"
              >
                <input
                  type="checkbox"
                  :checked="view.labelColumns.includes(field.labelKey)"
                  @change="toggleLabelColumn(field)"
                >
                <span>{{ field.label }}</span>
              </label>
            </template>
            <button
              type="button"
              class="btn btn-sm role-link menu-reset"
              @click="resetColumns"
            >
              {{ t('tableViews.columns.reset') }}
            </button>
          </div>
        </template>
      </v-dropdown>

      <v-dropdown
        placement="bottom-end"
        :container="false"
      >
        <button
          type="button"
          class="btn role-tertiary view-control-btn"
          data-testid="table-views-group"
        >
          <i class="icon icon-list-grouped" />
          {{ t('tableViews.group.label', { field: groupLabel }) }}
          <i class="icon icon-chevron-down" />
        </button>
        <template #popper>
          <div class="view-menu">
            <button
              v-for="option in groupOptions"
              :key="option.id || 'none'"
              v-close-popper
              type="button"
              class="menu-item"
              :class="{ selected: option.id === view.groupBy }"
              :data-testid="`table-views-group-${option.id || 'none'}`"
              @click="setGroupBy(option.id)"
            >
              {{ option.label }}
            </button>
          </div>
        </template>
      </v-dropdown>

      <v-dropdown
        placement="bottom-end"
        :container="false"
      >
        <button
          type="button"
          class="btn role-tertiary view-control-btn"
          data-testid="table-views-export"
        >
          <i class="icon icon-download" />
          {{ t('tableViews.export.label') }}
          <i class="icon icon-chevron-down" />
        </button>
        <template #popper>
          <div class="view-menu">
            <template
              v-for="scope in ['selection', 'page', 'all']"
              :key="scope"
            >
              <div class="menu-title">
                {{ t(`tableViews.export.scope.${scope}`) }}
              </div>
              <button
                v-for="format in ['csv', 'json']"
                :key="`${scope}-${format}`"
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-export-${scope}-${format}`"
                @click="doExport(format, scope)"
              >
                {{ t(`tableViews.export.format.${format}`) }}
              </button>
            </template>
          </div>
        </template>
      </v-dropdown>

      <v-dropdown
        placement="bottom-end"
        :container="false"
      >
        <button
          type="button"
          class="btn role-tertiary view-control-btn"
          data-testid="table-views-save"
        >
          <i class="icon icon-pin" />
          {{ t('tableViews.save.label') }}
          <i class="icon icon-chevron-down" />
        </button>
        <template #popper>
          <div class="view-menu save-menu">
            <div class="menu-title">
              {{ t('tableViews.save.newView') }}
            </div>
            <div class="save-row">
              <input
                v-model="newViewName"
                type="text"
                class="input-sm"
                data-testid="table-views-save-name"
                :placeholder="t('tableViews.save.namePlaceholder')"
                @keydown.enter="saveView"
              >
              <button
                type="button"
                class="btn btn-sm role-primary"
                :disabled="!newViewName.trim()"
                data-testid="table-views-save-submit"
                @click="saveView"
              >
                {{ t('tableViews.save.save') }}
              </button>
            </div>
            <template v-if="savedViews.length">
              <div class="menu-title">
                {{ t('tableViews.save.updateExisting') }}
              </div>
              <button
                v-for="saved in savedViews"
                :key="saved.id"
                v-close-popper
                type="button"
                class="menu-item"
                @click="updateView(saved)"
              >
                {{ saved.name }}
              </button>
            </template>
            <div class="menu-title">
              {{ t('tableViews.save.share') }}
            </div>
            <button
              type="button"
              class="menu-item"
              data-testid="table-views-copy-link"
              @click="copyShareUrl"
            >
              <i class="icon icon-copy" />
              {{ copied ? t('tableViews.save.copied') : t('tableViews.save.copyLink') }}
            </button>
          </div>
        </template>
      </v-dropdown>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-views {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;

  .view-tabs {
    display: flex;
    align-items: center;
    gap: 4px;
    border-bottom: 1px solid var(--border);
  }

  .view-tab {
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    padding: 6px 12px;
    cursor: pointer;
    color: var(--body-text);
    font-size: 14px;

    &.active {
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    &.dirty {
      opacity: 0.7;
      font-style: italic;
      cursor: default;
    }

    .remove {
      font-size: 11px;
      opacity: 0;
      margin-left: 4px;
    }

    &:hover .remove {
      opacity: 0.6;
    }
  }

  .view-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .match-count {
    white-space: nowrap;
    opacity: 0.7;
    font-size: 12px;
  }

  .view-control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    white-space: nowrap;
    line-height: 20px;

    .badge {
      background: var(--primary);
      color: var(--primary-text);
      border-radius: 10px;
      font-size: 11px;
      padding: 0 6px;
    }
  }
}

.view-menu {
  display: flex;
  flex-direction: column;
  min-width: 220px;
  max-height: 420px;
  overflow-y: auto;
  padding: 4px 0;

  .menu-title {
    padding: 6px 12px 2px 12px;
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.6;
  }

  .menu-item,
  .menu-check {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: transparent;
    border: none;
    text-align: left;
    cursor: pointer;
    color: var(--body-text);
    margin: 0;

    &:hover {
      background: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
    }

    &.selected {
      font-weight: 600;
    }
  }

  .menu-reset {
    align-self: flex-start;
    padding: 6px 12px;
  }

  &.save-menu .save-row {
    display: flex;
    gap: 6px;
    padding: 4px 12px 8px 12px;
  }
}
</style>

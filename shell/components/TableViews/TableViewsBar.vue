<script>
import { mapPref, TABLE_VIEWS } from '@shell/store/prefs';
import { randomStr } from '@shell/utils/string';
import { LABEL_FIELD_PREFIX, encodeView, isCoreField } from '@shell/utils/table-views';
import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput';
import ButtonGroup from '@shell/components/ButtonGroup';
import Checkbox from '@components/Form/Checkbox/Checkbox.vue';
import AppModal from '@shell/components/AppModal.vue';

/**
 * The toolbar above a resource table - filter query, column picker, group by, export and
 * saved views. Modelled on the GitHub Projects table toolbar.
 *
 * All of the state lives in the `view` prop so the owning table can apply it; this
 * component only owns the saved view list (stored as a user preference).
 */
export default {
  name: 'TableViewsBar',

  emits: ['update:view', 'export', 'update:viewMode', 'request-values'],

  components: {
    TableViewQueryInput, ButtonGroup, Checkbox, AppModal
  },

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
     * Fields offered in the group by menu. Grouping is a sort, so this can be narrower than
     * `fields` - server side only indexed fields can be grouped on. Defaults to all fields.
     */
    groupFields: {
      type:    Array,
      default: null
    },

    /**
     * fieldId -> values in use, fetched from the api. Falls back to scanning `rows` when a field
     * has nothing here yet.
     */
    fieldValues: {
      type:    Object,
      default: () => ({})
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

    /**
     * The core table display / view-mode (flat list / grouped / detail), folded into
     * the "View" popup. Mirrors the ButtonGroup the core table would otherwise render.
     */
    viewMode: {
      type:    [String, Number, Boolean, Object],
      default: null
    },

    /**
     * ButtonGroup options for the display/view-mode toggle
     */
    viewModeOptions: {
      type:    Array,
      default: () => []
    },

    /**
     * Which part of the bar to render:
     *  - 'all'      (default) both the view tabs and the filter/View controls (backward compatible)
     *  - 'tabs'     only the view tabs row
     *  - 'controls' only the filter + single "View" popup, laid out to fill one toolbar line
     * Two instances (tabs + controls) stay in sync because all state comes from props and the
     * shared TABLE_VIEWS preference.
     */
    part: {
      type:    String,
      default: 'all'
    },
  },

  data() {
    return {
      newViewName: '',
      /** The saved view the current state came from, so we can offer save/discard against it */
      editingViewId: null,
      /** Which modal is open, if any: { kind: 'rename' | 'export', view } */
      modal:         null,
      /** Name being typed in the rename / duplicate modal */
      modalName:     '',
      copied:      false,
      renameNames: {},
    };
  },

  computed: {
    allSavedViews: mapPref(TABLE_VIEWS),

    // Short summary of the column selection shown on the "Columns" row of the View menu
    columnsSummary() {
      const total = this.columnFields.length;
      const labels = this.view.labelColumns?.length || 0;

      if (!this.hiddenColumnCount && !labels) {
        return this.t('tableViews.view.allColumns');
      }

      return this.t('tableViews.view.someColumns', { count: total - this.hiddenColumnCount + labels });
    },

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
        (this.groupFields || this.fields).map((f) => ({
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

    /**
     * The saved view the current state was applied from, if it still exists
     */
    editingView() {
      return this.savedViews.find((v) => v.id === this.editingViewId) || null;
    },

    /**
     * Unsaved changes: either edits on top of a saved view, or an unsaved view of one's own
     */
    isDirty() {
      if (this.editingView) {
        return !this.isSameConfig(this.editingView, this.view);
      }

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

    isCoreColumn(field) {
      return isCoreField(field?.id);
    },

    toggleColumn(field) {
      // Core columns (name, age) can't be hidden - the table depends on them
      if (this.isCoreColumn(field)) {
        return;
      }

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
      this.editingViewId = saved?.id || null;

      this.$emit('update:view', {
        query:        saved?.query || '',
        columns:      saved?.columns || null,
        labelColumns: saved?.labelColumns || [],
        groupBy:      saved?.groupBy || null,
      });
    },

    /**
     * Put the view back the way it was - either the saved view being edited, or nothing at all
     */
    discardChanges() {
      this.applyView(this.editingView);
    },

    saveChanges() {
      if (this.editingView) {
        this.updateView(this.editingView);
      }
    },

    openRename(saved) {
      this.modal = { kind: 'rename', view: saved };
      this.modalName = saved.name;
    },

    /**
     * Export needs a scope and a format, which is more than belongs in a menu - ask in a modal.
     * `view` is only used to label it, the rows exported are whatever the table is showing.
     */
    openExport(saved) {
      this.modal = { kind: 'export', view: saved || null };
    },

    closeModal() {
      this.modal = null;
      this.modalName = '';
    },

    confirmRename() {
      const name = (this.modalName || '').trim();
      const saved = this.modal?.view;

      if (!name || !saved || name === saved.name) {
        this.closeModal();

        return;
      }

      this.persist(this.savedViews.map((v) => (v.id === saved.id ? { ...v, name } : v)));
      this.closeModal();
    },

    /**
     * Copy a saved view, so a variation can be built without losing the original
     */
    duplicateView(saved) {
      const base = `${ saved.name } ${ this.t('tableViews.tab.copySuffix') }`;
      let name = base;
      let n = 2;

      while (this.savedViews.find((v) => v.name === name)) {
        name = `${ base } ${ n++ }`;
      }

      this.persist(this.savedViews.concat([{
        ...saved, id: randomStr(8), name
      }]));
    },

    exportFromModal(format, scope) {
      this.doExport(format, scope);
      this.closeModal();
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

    renameView(saved) {
      const name = (this.renameNames[saved.id] ?? saved.name ?? '').trim();

      if (!name || name === saved.name) {
        return;
      }

      this.persist(this.savedViews.map((v) => (v.id === saved.id ? { ...v, name } : v)));
      this.renameNames[saved.id] = '';
    },

    setViewMode(value) {
      this.$emit('update:viewMode', value);
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
    :class="{ 'part-controls': part === 'controls', 'part-tabs': part === 'tabs' }"
    data-testid="table-views-bar"
  >
    <div
      v-if="part !== 'controls'"
      class="view-tabs"
    >
      <!-- All (built-in default): gets a caret dropdown too, but only the options that apply to it
           (Copy link + Export) — it can't be renamed, updated or deleted. -->
      <div
        class="view-tab-wrap"
        :class="{ active: !activeViewId && !isDirty }"
      >
        <button
          type="button"
          class="view-tab in-wrap"
          :class="{ active: !activeViewId && !isDirty }"
          data-testid="table-views-tab-all"
          @click="applyView(null)"
        >
          {{ t('tableViews.tabs.all') }}
        </button>
        <v-dropdown
          placement="bottom-start"
          :container="false"
        >
          <button
            type="button"
            class="view-tab-caret"
            :aria-label="t('tableViews.tab.menu')"
            data-testid="table-views-tab-menu-all"
            @click.stop
          >
            <i class="icon icon-chevron-down" />
          </button>
          <template #popper>
            <div class="view-menu">
              <button
                type="button"
                class="menu-item"
                data-testid="table-views-copy-link-all"
                @click="copyShareUrl"
              >
                <i class="icon icon-copy" />
                {{ copied ? t('tableViews.save.copied') : t('tableViews.tab.copyLink') }}
              </button>

              <button
                v-close-popper
                type="button"
                class="menu-item"
                data-testid="table-views-export-all"
                @click="openExport(null)"
              >
                <i class="icon icon-download" />
                {{ t('tableViews.export.label') }}
              </button>
            </div>
          </template>
        </v-dropdown>
      </div>

      <!-- Saved views: each tab carries its own caret dropdown (rename / save / delete / export / share) -->
      <div
        v-for="saved in savedViews"
        :key="saved.id"
        class="view-tab-wrap"
        :class="{ active: activeViewId === saved.id }"
      >
        <button
          type="button"
          class="view-tab in-wrap"
          :class="{ active: activeViewId === saved.id }"
          :data-testid="`table-views-tab-${saved.id}`"
          @click="applyView(saved)"
        >
          {{ saved.name }}
        </button>
        <v-dropdown
          placement="bottom-start"
          :container="false"
        >
          <button
            type="button"
            class="view-tab-caret"
            :aria-label="t('tableViews.tab.menu')"
            :data-testid="`table-views-tab-menu-${saved.id}`"
            @click.stop
          >
            <i class="icon icon-chevron-down" />
          </button>
          <template #popper>
            <div class="view-menu">
              <button
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-rename-${saved.id}`"
                @click="openRename(saved)"
              >
                <i class="icon icon-edit" />
                {{ t('tableViews.tab.rename') }}
              </button>
              <button
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-duplicate-${saved.id}`"
                @click="duplicateView(saved)"
              >
                <i class="icon icon-copy" />
                {{ t('tableViews.tab.duplicate') }}
              </button>
              <button
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-update-${saved.id}`"
                @click="updateView(saved)"
              >
                <i class="icon icon-pin" />
                {{ t('tableViews.tab.saveChanges') }}
              </button>
              <button
                type="button"
                class="menu-item"
                :data-testid="`table-views-copy-link-${saved.id}`"
                @click="copyShareUrl"
              >
                <i class="icon icon-copy" />
                {{ copied ? t('tableViews.save.copied') : t('tableViews.tab.copyLink') }}
              </button>
              <button
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-export-${saved.id}`"
                @click="openExport(saved)"
              >
                <i class="icon icon-download" />
                {{ t('tableViews.export.label') }}
              </button>
              <div class="menu-divider" />
              <button
                v-close-popper
                type="button"
                class="menu-item"
                :data-testid="`table-views-delete-${saved.id}`"
                @click="deleteView(saved)"
              >
                <i class="icon icon-trash" />
                {{ t('tableViews.tab.delete') }}
              </button>
            </div>
          </template>
        </v-dropdown>
      </div>

      <!-- + New View: name and save the current config as a new saved view -->
      <v-dropdown
        placement="bottom-start"
        :container="false"
      >
        <button
          type="button"
          class="view-tab new-view-tab"
          data-testid="table-views-new-tab"
        >
          <i class="icon icon-plus" />
          {{ t('tableViews.tabs.newView') }}
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
                v-close-popper
                type="button"
                class="btn btn-sm role-primary"
                :disabled="!newViewName.trim()"
                data-testid="table-views-save-submit"
                @click="saveView"
              >
                {{ t('tableViews.save.save') }}
              </button>
            </div>
          </div>
        </template>
      </v-dropdown>

    </div>

    <div
      v-if="part !== 'tabs'"
      class="view-controls"
    >
      <TableViewQueryInput
        class="query-grow"
        :value="view.query"
        :fields="fields"
        :rows="rows"
        :match-count="matchCount"
        :field-values="fieldValues"
        @update:value="update({ query: $event })"
        @request-values="$emit('request-values', $event)"
      />

      <!-- Single "View" popup — a compact list; Columns / Group by each open their OWN nested
           dropdown (a cascading submenu) beside the row, GitHub-style. -->
      <v-dropdown
        placement="bottom-end"
        :container="false"
      >
        <button
          type="button"
          class="btn role-tertiary view-control-btn"
          data-testid="table-views-view-menu"
        >
          {{ t('tableViews.view.label') }}
          <span
            v-if="isDirty"
            v-clean-tooltip="t('tableViews.view.unsaved')"
            class="unsaved-dot"
            data-testid="table-views-unsaved"
          />
          <i class="icon icon-chevron-down" />
        </button>
        <template #popper>
          <div class="view-menu view-popup">
            <template v-if="isDirty">
              <div class="menu-title">
                {{ t('tableViews.view.unsaved') }}
              </div>
              <button
                type="button"
                class="menu-item"
                data-testid="table-views-discard"
                @click="discardChanges()"
              >
                {{ t('tableViews.view.discard') }}
              </button>
              <button
                v-if="editingView"
                type="button"
                class="menu-item"
                data-testid="table-views-save-changes"
                @click="saveChanges()"
              >
                {{ t('tableViews.view.saveChanges') }}
              </button>
              <div class="menu-divider" />
            </template>
            <template v-if="viewModeOptions.length > 1">
              <div class="view-mode-row">
                <ButtonGroup
                  :value="viewMode"
                  :options="viewModeOptions"
                  size="medium"
                  data-testid="table-views-view-mode"
                  @update:value="setViewMode"
                />
              </div>
            </template>

            <!-- Columns → its own nested dropdown -->
            <v-dropdown
              placement="right-start"
            >
              <button
                type="button"
                class="menu-nav"
                data-testid="table-views-view-columns"
              >
                <span class="menu-nav-label">{{ t('tableViews.columns.label') }}</span>
                <span class="menu-nav-value">{{ columnsSummary }}</span>
                <i class="icon icon-chevron-right" />
              </button>
              <template #popper>
                <div class="view-menu">
                  <div class="menu-title">
                    {{ t('tableViews.columns.tableColumns') }}
                  </div>
                  <Checkbox
                    v-for="field in columnFields"
                    :key="field.id"
                    class="menu-check"
                    :value="isColumnVisible(field)"
                    :label="field.label"
                    :disabled="isCoreColumn(field)"
                    @update:value="toggleColumn(field)"
                  />
                  <template v-if="labelFields.length">
                    <div class="menu-title">
                      {{ t('tableViews.columns.labelColumns') }}
                    </div>
                    <Checkbox
                      v-for="field in labelFields"
                      :key="field.id"
                      class="menu-check"
                      :data-testid="`table-views-label-col-${field.labelKey}`"
                      :value="view.labelColumns.includes(field.labelKey)"
                      :label="field.label"
                      @update:value="toggleLabelColumn(field)"
                    />
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

            <!-- Group by → its own nested dropdown -->
            <v-dropdown
              placement="right-start"
            >
              <button
                type="button"
                class="menu-nav"
                data-testid="table-views-view-group"
              >
                <span class="menu-nav-label">{{ t('tableViews.group.byLabel') }}</span>
                <span class="menu-nav-value">{{ groupLabel }}</span>
                <i class="icon icon-chevron-right" />
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
          </div>
        </template>
      </v-dropdown>
    </div>
  </div>

  <!-- Rename and export ask for more than belongs in a menu, so they open here instead -->
  <app-modal
    v-if="modal"
    name="tableViewsModal"
    :width="420"
    height="auto"
    :trigger-focus-trap="true"
    data-testid="table-views-modal"
    @close="closeModal"
  >
    <div class="view-modal">
      <h4 v-if="modal.kind === 'rename'">
        {{ t('tableViews.tab.rename') }}
      </h4>
      <h4 v-else>
        {{ t('tableViews.export.label') }}
      </h4>

      <template v-if="modal.kind === 'rename'">
        <input
          v-model="modalName"
          type="text"
          class="input-sm"
          data-testid="table-views-modal-name"
          @keydown.enter="confirmRename"
        >
        <div class="view-modal-actions">
          <button
            type="button"
            class="btn role-secondary"
            @click="closeModal"
          >
            {{ t('generic.cancel') }}
          </button>
          <button
            type="button"
            class="btn role-primary"
            :disabled="!modalName.trim()"
            data-testid="table-views-modal-save"
            @click="confirmRename"
          >
            {{ t('generic.save') }}
          </button>
        </div>
      </template>

      <template v-else>
        <div
          v-for="scope in ['selection', 'page', 'all']"
          :key="scope"
          class="export-scope"
        >
          <span class="export-scope-label">{{ t(`tableViews.export.scope.${scope}`) }}</span>
          <span>
            <button
              v-for="format in ['csv', 'json']"
              :key="`${scope}-${format}`"
              type="button"
              class="btn btn-sm role-secondary"
              :data-testid="`table-views-modal-export-${scope}-${format}`"
              @click="exportFromModal(format, scope)"
            >
              {{ t(`tableViews.export.format.${format}`) }}
            </button>
          </span>
        </div>
        <div class="view-modal-actions">
          <button
            type="button"
            class="btn role-secondary"
            @click="closeModal"
          >
            {{ t('generic.cancel') }}
          </button>
        </div>
      </template>
    </div>
  </app-modal>
</template>

<style lang="scss" scoped>
.table-views {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;

  // 'controls' instance lives inside the core masthead's search cell — no vertical
  // margin/gap, and it fills the width so the filter grows and the View button sits
  // at the far right, all on a single line.
  &.part-controls {
    margin-bottom: 0;
    gap: 0;
    width: 100%;
    flex: 1 1 auto;

    .view-controls {
      flex-wrap: nowrap;
      width: 100%;
    }
  }

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

    &.in-wrap {
      padding-right: 2px;
    }

    &.new-view-tab {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0.8;

      &:hover {
        opacity: 1;
      }
    }
  }

  // A saved-view tab plus its caret menu, sharing one active underline
  .view-tab-wrap {
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;

    &.active {
      border-bottom-color: var(--primary);

      .view-tab {
        font-weight: 600;
      }
    }

    .view-tab {
      border-bottom: none;
    }
  }

  .view-tab-caret {
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--body-text);
    padding: 6px 6px 6px 0;
    opacity: 0.5;

    &:hover {
      opacity: 1;
    }

    .icon {
      font-size: 12px;
    }
  }

  .view-controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .query-grow {
    flex: 1 1 auto;
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

.unsaved-dot {
  width: 6px;
  height: 6px;
  margin-left: 2px;
  border-radius: 50%;
  background: var(--warning);
}

.menu-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--border);
}

.view-modal {
  padding: 16px;

  h4 { margin-bottom: 12px; }

  input { width: 100%; }

  .export-scope {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;

    .btn { margin-left: 8px; }
  }

  .view-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
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
    padding: 4px 12px;
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

  .menu-subtitle {
    padding: 4px 12px 2px 12px;
    font-size: 11px;
    opacity: 0.6;
  }

  .menu-reset {
    align-self: flex-start;
    padding: 6px 12px;
  }

  .save-row {
    display: flex;
    gap: 6px;
    padding: 4px 12px 8px 12px;
  }

  .export-row {
    display: flex;
    gap: 6px;
    padding: 2px 12px 6px 12px;
  }

  .view-mode-row {
    padding: 4px 12px 8px 12px;
  }

  // GitHub-style drill-down rows in the View popup: label (left) + current value + chevron (right)
  .menu-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--body-text);
    text-align: left;

    &:hover {
      background: var(--dropdown-hover-bg);
      color: var(--dropdown-hover-text);
    }

    .menu-nav-label { font-weight: 500; }
    .menu-nav-value {
      margin-left: auto;
      opacity: 0.7;
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-chevron-right { opacity: 0.6; }
  }

  // "Back" header at the top of a sub-panel
  .menu-back {
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 12px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    color: var(--body-text);
    font-weight: 600;
    text-align: left;

    &:hover { color: var(--link); }
  }

  &.view-popup {
    min-width: 240px;
  }
}
</style>

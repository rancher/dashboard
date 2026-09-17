<script>
import { mapPref, TABLE_VIEWS } from '@shell/store/prefs';
import { randomStr } from '@shell/utils/string';
import { LABEL_FIELD_PREFIX, encodeView, isCoreField } from '@shell/utils/table-views';
import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput';
import TableViewExportModal from '@shell/components/TableViews/TableViewExportModal';
import AppModal from '@shell/components/AppModal.vue';
import { RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator } from '@components/RcDropdown';

/** Where a saved view's key bindings apply, and what they do */
const SHORTCUTS = [
  {
    key: 's', shift: false, method: 'saveChanges'
  },
  {
    key: 's', shift: true, method: 'openSaveAsNew'
  },
  {
    key: 'd', shift: false, method: 'duplicateCurrent'
  },
];

/**
 * The toolbar above a resource table - filter query, column picker, group by, export and
 * saved views. Modelled on the GitHub Projects table toolbar.
 *
 * All of the state lives in the `view` prop so the owning table can apply it; this
 * component only owns the saved view list (stored as a user preference).
 */
export default {
  name: 'TableViewsBar',

  emits: ['update:view', 'export', 'request-values'],

  components: {
    TableViewQueryInput,
    TableViewExportModal,
    AppModal,
    RcDropdown,
    RcDropdownItem,
    RcDropdownTrigger,
    RcDropdownSeparator
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
     * query -> how many rows it matches, counted by the owning table in its own right rather
     * than read off the rows on screen. Shown on the tabs, so someone can see what a view holds
     * without opening it.
     */
    viewCounts: {
      type:    Object,
      default: () => ({})
    },

    /**
     * Plural display name of what the table holds ("clusters"), for the export modal
     */
    resourceLabel: {
      type:    String,
      default: ''
    },

    /**
     * Key the saved views are stored under, normally the resource type
     */
    resourceType: {
      type:    String,
      default: ''
    },

    /**
     * Which part of the bar to render:
     *  - 'all'      (default) both the view tabs and the filter/View controls
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
      /**
       * The tab the user picked, so we can offer save/discard against it and light it up.
       *
       * Three states: `undefined` if nothing has been picked here yet, `null` for the default
       * tab, or the id of a saved view. The default tab has to be distinguishable from "nothing
       * picked", or a saved view holding the same config as it is matched instead.
       */
      pickedViewId:  undefined,
      /** Which modal is open, if any: { kind: 'new' | 'rename' | 'export', view } */
      modal:         null,
      /** Name being typed in the rename / duplicate modal */
      modalName:     '',
      copied:        false,
      /** Column picker drag: the row picked up, and the row it is currently over */
      dragIndex:     null,
      dragOverIndex: null,
      dragMoved:     false,
    };
  },

  mounted() {
    // Only the tabs instance listens, so a bar rendered as two parts doesn't act on each key twice
    if (this.part !== 'controls') {
      window.addEventListener('keydown', this.onShortcut);
    }
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onShortcut);
  },

  computed: {
    allSavedViews: mapPref(TABLE_VIEWS),

    savedViews() {
      return this.allSavedViews?.[this.resourceType]?.views || this.allSavedViews?.[this.resourceType] || [];
    },

    /**
     * The view applied when the list is first opened, if the user has set one
     */
    defaultViewId() {
      return this.allSavedViews?.[this.resourceType]?.defaultViewId || null;
    },

    /** The default tab plus every saved view, in the order they are shown */
    tabs() {
      return [{
        id: null, name: this.t('tableViews.tabs.all'), isDefaultTab: true
      }].concat(this.savedViews.map((saved) => ({
        id: saved.id, name: saved.name, view: saved
      })));
    },

    columnFields() {
      return this.fields.filter((f) => !f.isLabel);
    },

    labelFields() {
      return this.fields.filter((f) => f.isLabel);
    },

    /**
     * Columns in the order the view puts them, so the picker reads the way the table does
     */
    orderedColumnFields() {
      const order = this.view.columnOrder;

      if (!order?.length) {
        return this.columnFields;
      }

      const byId = {};

      this.columnFields.forEach((f) => {
        byId[f.id] = f;
      });

      const out = order.map((id) => byId[id]).filter((f) => !!f);

      return out.concat(this.columnFields.filter((f) => !order.includes(f.id)));
    },

    visibleColumnCount() {
      return this.columnFields.filter((f) => this.isColumnVisible(f)).length + (this.view.labelColumns?.length || 0);
    },

    // "7 / 11", or "Default" while nothing has been changed - shown on the Columns row of the View menu
    columnsSummary() {
      if (!this.view.columns && !this.view.labelColumns?.length && !this.view.columnOrder) {
        return this.t('tableViews.view.columnsDefault');
      }

      // Labels are extras rather than columns of the table, so only the ones actually added count
      // towards the total - otherwise a pod list reads "9 / 42" because of its label keys
      return this.t('tableViews.view.columnsCount', { shown: this.visibleColumnCount, total: this.columnFields.length + (this.view.labelColumns?.length || 0) });
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
      return this.savedViews.find((v) => v.id === this.pickedViewId) || null;
    },

    /**
     * Which saved view the tab bar shows as selected.
     *
     * The view the user picked wins. Two saved views can hold the same config, and matching
     * on config alone would always light up the first of them - so picking the second looked
     * like nothing happened. Fall back to the config when nothing has been picked here yet,
     * so a view arriving in the URL still shows as selected.
     */
    selectedViewId() {
      if (this.pickedViewId !== undefined) {
        return this.pickedViewId === null ? null : this.editingView?.id || this.activeViewId;
      }

      return this.isModified ? this.activeViewId : null;
    },

    /**
     * Unsaved changes: either edits on top of a saved view, or an unsaved view of one's own
     */
    isDirty() {
      if (this.editingView) {
        return !this.isSameConfig(this.editingView, this.view);
      }

      if (this.pickedViewId === null) {
        return this.isModified;
      }

      return !this.activeViewId && this.isModified;
    },

    isModified() {
      return !!this.view.query || !!this.view.groupBy || !!this.view.columns || !!this.view.labelColumns?.length || !!this.view.columnOrder;
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
        JSON.stringify(a.columnOrder || null) === JSON.stringify(b.columnOrder || null) &&
        JSON.stringify(a.labelColumns || []) === JSON.stringify(b.labelColumns || []);
    },

    /**
     * The count shown on a tab. The selected tab is whatever the table is showing right now;
     * the rest are counted separately by the owning table.
     */
    /**
     * What a tab counts: the query it holds, or for the tab in front of the user the query
     * actually in the box, edits included.
     *
     * Counts are looked up by query and never taken from the table's own rows, so a tab keeps
     * its number while the list goes off to fetch a page instead of falling to zero.
     */
    tabCount(tab) {
      const query = (tab.id === this.selectedViewId ? this.view.query : tab.view?.query) || '';

      return this.viewCounts[query];
    },

    tabLabel(tab) {
      const count = this.tabCount(tab);

      return count === undefined ? tab.name : this.t('tableViews.tabs.count', { name: tab.name, count });
    },

    isTabDirty(tab) {
      return this.isDirty && tab.id === this.selectedViewId;
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

    selectAllColumns() {
      this.update({ columns: this.columnFields.map((f) => f.id) });
    },

    /**
     * Move a column to a new position in the picker, which is the order the table renders in
     */
    moveColumn(from, to) {
      const ids = this.orderedColumnFields.map((f) => f.id);

      if (to < 0 || to >= ids.length || from === to) {
        return;
      }

      const next = ids.slice();

      next.splice(to, 0, next.splice(from, 1)[0]);

      this.update({ columnOrder: next });
    },

    /**
     * Pick a column row up by its handle.
     *
     * Native HTML5 dragging is not available here: a menu item calls `preventDefault` on
     * mousedown (so that clicking one doesn't move focus), and without that default there is no
     * `dragstart` to hang a drag off. Tracking the pointer ourselves works regardless.
     */
    startColumnDrag(index, event) {
      if (event.button !== 0) {
        return;
      }

      this.dragIndex = index;
      this.dragOverIndex = index;
      this.dragMoved = false;

      window.addEventListener('mousemove', this.onColumnDragMove);
      window.addEventListener('mouseup', this.endColumnDrag);
    },

    onColumnDragMove(event) {
      if (this.dragIndex === null) {
        return;
      }

      const over = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-col-index]');

      if (!over) {
        return;
      }

      const index = parseInt(over.getAttribute('data-col-index'), 10);

      if (!isNaN(index) && index !== this.dragOverIndex) {
        this.dragOverIndex = index;
        this.dragMoved = true;
      }
    },

    endColumnDrag() {
      window.removeEventListener('mousemove', this.onColumnDragMove);
      window.removeEventListener('mouseup', this.endColumnDrag);

      const { dragIndex, dragOverIndex, dragMoved } = this;

      this.dragIndex = null;
      this.dragOverIndex = null;
      this.dragMoved = false;

      if (!dragMoved || dragIndex === null || dragOverIndex === null) {
        return;
      }

      // The click that follows this mouseup would land on whichever row the pointer ended over,
      // toggling it and closing the menu. A drag is not a click, so it is swallowed.
      const swallow = (event) => {
        event.stopPropagation();
        event.preventDefault();
        window.removeEventListener('click', swallow, true);
      };

      window.addEventListener('click', swallow, true);

      this.moveColumn(dragIndex, dragOverIndex);
    },

    setGroupBy(id) {
      this.update({ groupBy: id });
    },

    resetColumns() {
      this.update({
        columns: null, labelColumns: [], columnOrder: null
      });
    },

    /**
     * Put the whole view back to the table's defaults - the query included
     */
    resetView() {
      this.update({
        query: '', columns: null, labelColumns: [], columnOrder: null, groupBy: null
      });
    },

    applyView(saved) {
      this.pickedViewId = saved?.id || null;

      this.$emit('update:view', {
        query:        saved?.query || '',
        columns:      saved?.columns || null,
        columnOrder:  saved?.columnOrder || null,
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
      } else if (this.isDirty) {
        // Nothing to save over, so this is a new view and it needs a name
        this.openSaveAsNew();
      }
    },

    /**
     * Naming a view is a form rather than a choice, so it belongs in a modal
     */
    openSaveAsNew() {
      if (!this.isDirty && this.pickedViewId === undefined) {
        return;
      }

      this.modal = { kind: 'new', view: null };
      this.modalName = '';
    },

    /**
     * A new tab starts life as an unsaved "Untitled" view holding the table's defaults, so it
     * can be built up in place and named when it is worth keeping
     */
    addView() {
      const view = {
        id:           randomStr(8),
        name:         this.nextUntitledName(),
        query:        '',
        columns:      null,
        columnOrder:  null,
        labelColumns: [],
        groupBy:      null,
      };

      this.persist(this.savedViews.concat([view]));
      this.applyView(view);
    },

    nextUntitledName() {
      const base = this.t('tableViews.tab.untitled');
      let name = base;
      let n = 2;

      while (this.savedViews.find((v) => v.name === name)) {
        name = `${ base } ${ n++ }`;
      }

      return name;
    },

    openRename(saved) {
      this.modal = { kind: 'rename', view: saved };
      this.modalName = saved.name;
    },

    /**
     * The modal's name field either creates a view or renames one
     */
    confirmName() {
      if (this.modal?.kind === 'new') {
        this.saveView();
        this.closeModal();

        return;
      }

      this.confirmRename();
    },

    /**
     * Export needs a format, which is more than belongs in a menu - ask in a modal.
     * `view` is only used to label it, the rows exported are whatever the view matches.
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

      const copy = {
        ...saved, id: randomStr(8), name
      };

      this.persist(this.savedViews.concat([copy]));
      this.applyView(copy);
    },

    duplicateCurrent() {
      if (this.editingView) {
        this.duplicateView(this.editingView);
      }
    },

    /**
     * The view this list opens on. Picking the one already set turns it back off, so there is a
     * way out without another control.
     */
    setDefaultView(saved) {
      const id = this.defaultViewId === saved?.id ? null : saved?.id || null;

      this.persistAll(this.savedViews, id);
    },

    isDefaultView(saved) {
      return !!saved && this.defaultViewId === saved.id;
    },

    persist(views) {
      this.persistAll(views, this.defaultViewId);
    },

    persistAll(views, defaultViewId) {
      // A view that no longer exists can't be the default one
      const validDefault = views.find((v) => v.id === defaultViewId) ? defaultViewId : null;

      this.allSavedViews = {
        ...(this.allSavedViews || {}),
        [this.resourceType]: { views, defaultViewId: validDefault }
      };
    },

    saveView() {
      const name = (this.modalName || '').trim();

      if (!name) {
        return;
      }

      const view = {
        id:           randomStr(8),
        name,
        query:        this.view.query || '',
        columns:      this.view.columns || null,
        columnOrder:  this.view.columnOrder || null,
        labelColumns: this.view.labelColumns || [],
        groupBy:      this.view.groupBy || null,
      };

      this.persist(this.savedViews.filter((v) => v.name !== name).concat([view]));
      this.pickedViewId = view.id;
    },

    updateView(saved) {
      this.persist(this.savedViews.map((v) => (v.id === saved.id ? {
        ...v,
        query:        this.view.query || '',
        columns:      this.view.columns || null,
        columnOrder:  this.view.columnOrder || null,
        labelColumns: this.view.labelColumns || [],
        groupBy:      this.view.groupBy || null,
      } : v)));
    },

    deleteView(saved) {
      const wasSelected = this.selectedViewId === saved.id;

      this.persist(this.savedViews.filter((v) => v.id !== saved.id));

      if (wasSelected) {
        this.applyView(null);
      }
    },

    /**
     * ⌘/ctrl shortcuts for the saved view being edited. Ignored while the user is typing, so
     * ⌘S in the filter box still means whatever the browser makes of it.
     */
    onShortcut(event) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) {
        return;
      }

      const tag = (event.target?.tagName || '').toLowerCase();

      if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) {
        return;
      }

      const match = SHORTCUTS.find((s) => s.key === event.key.toLowerCase() && s.shift === event.shiftKey);

      if (!match) {
        return;
      }

      event.preventDefault();
      this[match.method]();
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

    doExport(formats) {
      this.$emit('export', { formats });
      this.closeModal();
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
      <div
        v-for="tab in tabs"
        :key="tab.id || 'all'"
        class="view-tab-wrap"
        :class="{ active: selectedViewId === tab.id }"
      >
        <button
          type="button"
          class="view-tab"
          :data-testid="tab.isDefaultTab ? 'table-views-tab-all' : `table-views-tab-${ tab.id }`"
          @click="applyView(tab.view || null)"
        >
          {{ tabLabel(tab) }}
          <span
            v-if="isTabDirty(tab)"
            v-clean-tooltip="t('tableViews.view.unsavedShort')"
            class="unsaved-dot"
            data-testid="table-views-unsaved"
          />
        </button>

        <rc-dropdown :placement="'bottom-start'">
          <rc-dropdown-trigger
            variant="link"
            class="view-tab-caret"
            :aria-label="t('tableViews.tab.menu')"
            :data-testid="tab.isDefaultTab ? 'table-views-tab-menu-all' : `table-views-tab-menu-${ tab.id }`"
          >
            <i class="icon icon-chevron-down" />
          </rc-dropdown-trigger>
          <template #dropdownCollection>
            <div class="menu-panel">
              <!-- Unsaved changes, and the three ways out of them -->
              <template v-if="isTabDirty(tab)">
                <div class="menu-notice">
                  <span class="unsaved-dot" />
                  {{ t('tableViews.view.unsaved') }}
                </div>
                <rc-dropdown-item
                  data-testid="table-views-save-changes"
                  @click="saveChanges()"
                >
                  <template #before>
                    <i class="icon icon-download" />
                  </template>
                  {{ t('tableViews.view.saveChanges') }}
                  <template #after>
                    <span class="menu-shortcut">{{ t('tableViews.shortcut.save') }}</span>
                  </template>
                </rc-dropdown-item>
                <rc-dropdown-item
                  data-testid="table-views-save-as-new"
                  @click="openSaveAsNew()"
                >
                  {{ t('tableViews.view.saveAsNew') }}
                  <template #after>
                    <span class="menu-shortcut">{{ t('tableViews.shortcut.saveAsNew') }}</span>
                  </template>
                </rc-dropdown-item>
                <rc-dropdown-item
                  data-testid="table-views-discard"
                  @click="discardChanges()"
                >
                  {{ t('tableViews.view.discard') }}
                </rc-dropdown-item>
                <rc-dropdown-separator />
              </template>

              <!-- The default tab is the table as it comes, so it can't be renamed or deleted -->
              <template v-if="!tab.isDefaultTab">
                <rc-dropdown-item
                  :data-testid="`table-views-rename-${ tab.id }`"
                  @click="openRename(tab.view)"
                >
                  <template #before>
                    <i class="icon icon-edit" />
                  </template>
                  {{ t('tableViews.tab.rename') }}
                </rc-dropdown-item>
                <rc-dropdown-item
                  :data-testid="`table-views-duplicate-${ tab.id }`"
                  @click="duplicateView(tab.view)"
                >
                  <template #before>
                    <i class="icon icon-copy" />
                  </template>
                  {{ t('tableViews.tab.duplicate') }}
                  <template #after>
                    <span class="menu-shortcut">{{ t('tableViews.shortcut.duplicate') }}</span>
                  </template>
                </rc-dropdown-item>
              </template>

              <rc-dropdown-item
                :data-testid="tab.isDefaultTab ? 'table-views-export-all' : `table-views-export-${ tab.id }`"
                @click="openExport(tab.view)"
              >
                {{ t('tableViews.export.label') }}
              </rc-dropdown-item>

              <rc-dropdown-item
                v-if="!tab.isDefaultTab"
                :class="{ selected: isDefaultView(tab.view) }"
                :data-testid="`table-views-set-default-${ tab.id }`"
                @click="setDefaultView(tab.view)"
              >
                {{ t('tableViews.tab.setDefault') }}
                <template
                  v-if="isDefaultView(tab.view)"
                  #after
                >
                  <i class="icon icon-checkmark" />
                </template>
              </rc-dropdown-item>

              <rc-dropdown-item
                :data-testid="tab.isDefaultTab ? 'table-views-copy-link-all' : `table-views-copy-link-${ tab.id }`"
                @click="copyShareUrl"
              >
                {{ copied ? t('tableViews.save.copied') : t('tableViews.tab.copyLink') }}
              </rc-dropdown-item>

              <template v-if="!tab.isDefaultTab">
                <rc-dropdown-separator />
                <rc-dropdown-item
                  :data-testid="`table-views-delete-${ tab.id }`"
                  @click="deleteView(tab.view)"
                >
                  <template #before>
                    <i class="icon icon-trash" />
                  </template>
                  {{ t('tableViews.tab.delete') }}
                </rc-dropdown-item>
              </template>
            </div>
          </template>
        </rc-dropdown>
      </div>

      <button
        type="button"
        class="view-tab new-view-tab"
        data-testid="table-views-new-tab"
        @click="addView"
      >
        <i class="icon icon-plus" />
        {{ t('tableViews.tabs.newView') }}
      </button>
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
        :field-values="fieldValues"
        @update:value="update({ query: $event })"
        @request-values="$emit('request-values', $event)"
      />

      <!-- Single "View" popup - Group by and Columns each open their own nested dropdown
           beside the row, GitHub style. -->
      <rc-dropdown :placement="'bottom-end'">
        <rc-dropdown-trigger
          variant="tertiary"
          class="view-control-btn"
          data-testid="table-views-view-menu"
        >
          <template #before>
            <i class="icon icon-gear" />
          </template>
          {{ t('tableViews.view.label') }}
        </rc-dropdown-trigger>
        <template #dropdownCollection>
          <div class="menu-panel">
            <!-- The View button sits at the right hand end of the toolbar, so the sub menus
                 open to the left of it rather than off screen. -->
            <rc-dropdown
              :placement="'left-start'"
              :distance="4"
            >
              <rc-dropdown-trigger
                variant="link"
                class="menu-nav"
                data-testid="table-views-view-group"
              >
                <span class="menu-nav-label">{{ t('tableViews.view.groupBy') }}</span>
                <span class="menu-nav-value">{{ groupLabel }}</span>
                <i class="icon icon-chevron-right" />
              </rc-dropdown-trigger>
              <template #dropdownCollection>
                <div class="menu-panel">
                  <rc-dropdown-item
                    v-for="option in groupOptions"
                    :key="option.id || 'none'"
                    :class="{ selected: option.id === view.groupBy }"
                    :data-testid="`table-views-group-${ option.id || 'none' }`"
                    @click="setGroupBy(option.id)"
                  >
                    {{ option.label }}
                    <template
                      v-if="option.id === view.groupBy"
                      #after
                    >
                      <i class="icon icon-checkmark" />
                    </template>
                  </rc-dropdown-item>
                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    class="menu-reset"
                    data-testid="table-views-group-reset"
                    @click="setGroupBy(null)"
                  >
                    {{ t('tableViews.view.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown>

            <rc-dropdown
              :placement="'left-start'"
              :distance="4"
            >
              <rc-dropdown-trigger
                variant="link"
                class="menu-nav"
                data-testid="table-views-view-columns"
              >
                <span class="menu-nav-label">{{ t('tableViews.view.columnsConfiguration') }}</span>
                <span class="menu-nav-value">{{ columnsSummary }}</span>
                <i class="icon icon-chevron-right" />
              </rc-dropdown-trigger>
              <template #dropdownCollection>
                <div class="menu-panel columns-panel">
                  <rc-dropdown-item
                    v-for="(field, i) in orderedColumnFields"
                    :key="field.id"
                    :class="{ 'column-row': true, locked: isCoreColumn(field), shown: isColumnVisible(field), dragging: dragIndex === i, 'drag-over': dragIndex !== null && dragOverIndex === i }"
                    :disabled="isCoreColumn(field)"
                    :data-col-index="i"
                    :data-testid="`table-views-col-${ field.id }`"
                    @click="toggleColumn(field)"
                  >
                    <template #before>
                      <i
                        v-if="isCoreColumn(field)"
                        v-clean-tooltip="t('tableViews.columns.locked')"
                        class="icon icon-lock column-handle"
                      />
                      <span
                        v-else
                        v-clean-tooltip="t('tableViews.columns.reorder')"
                        class="column-handle grip"
                        :data-testid="`table-views-col-handle-${ field.id }`"
                        @mousedown="startColumnDrag(i, $event)"
                      />
                    </template>
                    {{ field.label }}
                    <template
                      v-if="isColumnVisible(field)"
                      #after
                    >
                      <i class="icon icon-checkmark" />
                    </template>
                  </rc-dropdown-item>

                  <template v-if="labelFields.length">
                    <div class="menu-title">
                      {{ t('tableViews.columns.labelColumns') }}
                    </div>
                    <rc-dropdown-item
                      v-for="field in labelFields"
                      :key="field.id"
                      :class="{ 'column-row': true, shown: view.labelColumns.includes(field.labelKey) }"
                      :data-testid="`table-views-label-col-${ field.labelKey }`"
                      @click="toggleLabelColumn(field)"
                    >
                      {{ field.label }}
                      <template
                        v-if="view.labelColumns.includes(field.labelKey)"
                        #after
                      >
                        <i class="icon icon-checkmark" />
                      </template>
                    </rc-dropdown-item>
                  </template>

                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    data-testid="table-views-columns-select-all"
                    @click="selectAllColumns"
                  >
                    {{ t('tableViews.columns.selectAll') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    class="menu-reset"
                    data-testid="table-views-columns-reset"
                    @click="resetColumns"
                  >
                    {{ t('tableViews.columns.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown>

            <rc-dropdown-separator />
            <rc-dropdown-item
              class="menu-reset"
              data-testid="table-views-reset"
              @click="resetView"
            >
              {{ t('tableViews.view.reset') }}
            </rc-dropdown-item>
          </div>
        </template>
      </rc-dropdown>
    </div>
  </div>

  <!-- Naming a view asks for more than belongs in a menu, so it opens here instead -->
  <app-modal
    v-if="modal && modal.kind !== 'export'"
    name="tableViewsModal"
    :width="420"
    height="auto"
    :trigger-focus-trap="true"
    data-testid="table-views-modal"
    @close="closeModal"
  >
    <div class="view-modal">
      <h4>
        {{ modal.kind === 'new' ? t('tableViews.save.newView') : t('tableViews.tab.rename') }}
      </h4>
      <input
        v-model="modalName"
        type="text"
        class="input-sm"
        :placeholder="t('tableViews.save.namePlaceholder')"
        data-testid="table-views-modal-name"
        @keydown.enter="confirmName"
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
          @click="confirmName"
        >
          {{ t('generic.save') }}
        </button>
      </div>
    </div>
  </app-modal>

  <TableViewExportModal
    v-if="modal && modal.kind === 'export'"
    :count="matchCount"
    :resource-label="resourceLabel"
    :view-name="modal.view ? modal.view.name : t('tableViews.tabs.all')"
    @close="closeModal"
    @export="doExport"
  />
</template>

<style lang="scss" scoped>
.table-views {
  display: flex;
  flex-direction: column;
  gap: 8px;

  // Both parts are grid items in the table masthead, so they own neither the gap nor the margin
  &.part-controls,
  &.part-tabs {
    gap: 0;
    margin: 0;
    width: 100%;
  }

  &.part-controls .view-controls {
    flex-wrap: nowrap;
    width: 100%;
  }

  .view-tabs {
    display: flex;
    align-items: stretch;
    gap: 2px;
    border-bottom: 1px solid var(--border);
  }

  // A tab and its caret menu, sharing one active underline
  .view-tab-wrap {
    display: flex;
    align-items: center;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px; // sit the underline on the row's own border rather than above it

    &.active {
      border-bottom-color: var(--primary);

      .view-tab,
      .view-tab-caret {
        color: var(--primary);
      }
    }
  }

  .view-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    padding: 8px 4px 8px 12px;
    cursor: pointer;
    color: var(--body-text);
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;

    &.new-view-tab {
      gap: 4px;
      padding: 8px 12px;
      color: var(--link);

      .icon {
        font-size: 14px;
      }
    }
  }

  .view-tab-caret {
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--body-text);
    padding: 8px 10px 8px 2px;

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

  .view-control-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 40px;
    white-space: nowrap;
  }
}

// Marks a view holding changes that aren't saved anywhere
.unsaved-dot {
  width: 6px;
  height: 6px;
  flex: none;
  border-radius: 50%;
  background: var(--error);
}

.view-modal {
  padding: 16px;

  h4 { margin-bottom: 12px; }

  input { width: 100%; }

  .view-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 16px;
  }
}

// Content of an RcDropdown menu. RcDropdown owns the popper, this is the list inside it.
.menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 240px;
  max-height: 60vh;
  overflow-y: auto;
  text-align: left;

  .menu-title {
    padding: 6px 17px 2px 17px;
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.6;
  }

  // The "you have unsaved changes" banner at the top of a dirty view's menu. A quiet tint, not a
  // solid block - it is telling the user where they stand, not asking them to act
  .menu-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    padding: 10px 17px;
    background: var(--accent-btn);
    color: var(--body-text);
    font-size: 13px;
  }

  .menu-shortcut {
    margin-left: auto;
    padding-left: 24px;
    color: var(--muted);
    font-size: 12px;
    white-space: nowrap;
  }

  // A row that opens a sub menu: label (left) + current value + chevron (right)
  .menu-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: flex-start;
    padding: 8px 17px;
    color: var(--body-text);
    text-decoration: none;

    .menu-nav-label { font-weight: 400; }
    .menu-nav-value {
      margin-left: auto;
      color: var(--muted);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .icon-chevron-right { color: var(--muted); }
  }

  // Blue marks what is currently in force, the same way the shown columns are marked
  [dropdown-menu-item].selected {
    color: var(--link);
  }

  .menu-reset {
    color: var(--link);
  }

  // Column rows carry a drag handle (or a lock) and tick only what is shown
  .column-row {
    .column-handle {
      color: var(--muted);
      font-size: 14px;
      cursor: grab;
    }

    // Two short bars - the handle that says a row can be dragged. Drawn rather than taken from
    // the icon font, which has no grip glyph.
    .grip {
      position: relative;
      display: inline-block;
      width: 12px;
      height: 12px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 1.5px;
        border-radius: 1px;
        background: currentColor;
      }

      &::before { top: 3.5px; }
      &::after { top: 7px; }
    }

    &.shown {
      color: var(--link);
    }

    &.locked {
      color: var(--muted);
      cursor: default;

      .column-handle { cursor: default; }
    }

    &.dragging {
      opacity: 0.5;
    }

    // Where the row would land if it were dropped now
    &.drag-over {
      box-shadow: inset 0 -2px 0 var(--primary);
    }
  }
}
</style>

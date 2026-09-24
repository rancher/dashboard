<script>
import { mapPref, TABLE_VIEWS } from '@shell/store/prefs';
import { randomStr } from '@shell/utils/string';
import { moveInOrder, validateQuery } from '@shell/utils/table-views';
import { isMac, shortcutLabel } from '@shell/utils/platform';
import TableViewQueryInput from '@shell/components/TableViews/TableViewQueryInput';
import TableViewExportModal from '@shell/components/TableViews/TableViewExportModal';
import AppModal from '@shell/components/AppModal.vue';
import { RcDropdown, RcDropdownItem, RcDropdownTrigger, RcDropdownSeparator } from '@components/RcDropdown';

/** Where a saved view's key bindings apply, and what they do */
/** How far the pointer travels with a row held before it counts as a drag rather than a click */
const DRAG_THRESHOLD = 4;

/** Clears the handle's tooltip of the row's hover highlight rather than sitting over the handle */
const TOOLTIP_DISTANCE = 12;

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
/**
 * How long the pointer is given to cross one row of the View menu on its way to the sub menu
 * another row opened, before that row is taken to be the one you meant.
 *
 * The sub menus open alongside the menu rather than below the row, so reaching anything but the
 * first entry means travelling diagonally - straight across whichever rows lie between. Acting
 * on those the moment they are touched made the lower half of a sub menu unreachable: the menu
 * you were heading for was replaced before you arrived.
 */
const SUB_MENU_GRACE_MS = 300;

/** How close to an end of the tab strip a held tab has to come before the strip runs that way */
const TAB_SCROLL_EDGE = 56;

/** How fast it runs, per frame */
const TAB_SCROLL_STEP = 12;

/** How long to wait for that run to finish before marking the tab anyway */
const TAB_SCROLL_SETTLE_MAX_MS = 1200;

/** How long the tab that moved is marked for afterwards - the wash's own length */
const TAB_FLASH_MS = 600;

/** The table's own tab has no id, and null is also what "nothing" looks like - so it is named */
function tabKey(tab) {
  return tab.id || 'all';
}

export default {
  name: 'TableViewsBar',

  emits: ['update:view', 'export', 'request-values', 'tab-queries'],

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

    /** Field ids this table will not let go of, so the menu can show them locked */
    coreColumns: {
      type:    Array,
      default: () => []
    },

    /**
     * Field ids the table shows when a view has said nothing about columns.
     *
     * The menu offers every column the type has, which is more than a page showing its own
     * chosen set displays - so "shown" cannot mean "all of them" any more.
     */
    defaultColumns: {
      type:    Array,
      default: () => []
    },

    /**
     * Names of fields the query mentions that this list cannot be filtered by, so the toolbar
     * can say the query did not entirely run
     */
    unsupportedFields: {
      type:    Array,
      default: () => []
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
     * Fields offered as filter suggestions. Narrower than `fields` for the same reason
     * `groupFields` is - server side only indexed fields can be filtered on. Defaults to all
     * fields.
     */
    filterFields: {
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
      /** True while the caret is in the query box, so it is not corrected mid-word */
      queryFocused:      false,
      pickedViewId:      undefined,
      /**
       * Unsaved edits, per tab, for as long as the page is open. Leaving a tab with changes on it
       * holds on to them so coming back finds them where they were, and the tab keeps its mark
       * while you are elsewhere. A reload is where they end - nothing here is written down.
       */
      drafts:            {},
      /** Which modal is open, if any: { kind: 'export', view } */
      modal:             null,
      /**
       * Which sub menu of the View menu is open - 'group', 'columns', or null. A menu item has
       * no trigger of its own, so the row that opens one says so here and the menu takes its
       * open state from it.
       */
      subMenu:           null,
      /**
       * Whether the pointer is inside the open sub menu. The row that opened it takes the
       * highlight back while it is, so the menu says where you are rather than what you last
       * passed over on the way there.
       */
      subMenuHovered:    false,
      /** id of the view being renamed in place, and the name being typed for it */
      renamingId:        null,
      renameDraft:       '',
      /**
       * Column picker drag. `dragId` is the row being held; `dragOrder` is the ids in the order
       * the list is showing them mid-drag, which is what lets the rows shuffle under the cursor
       * instead of waiting for the drop. `dragSlots` are the places the rows sat when the drag
       * began - see captureColumnSlots for why they are taken once rather than read live.
       */
      dragId:            null,
      dragOrder:         null,
      dragMoved:         false,
      dragFrom:          null,
      dragPointerY:      0,
      dragSlots:         null,
      dragStartOrder:    null,
      /**
       * Tab drag, the same shape as the column one a few lines up but along the strip rather than
       * down a list. `tabDragOrder` is the tab keys in the order the pointer has put them.
       */
      tabDragFrom:       null,
      tabDragId:         null,
      tabDragMoved:      false,
      tabDragPointerX:   0,
      tabDragBounds:     null,
      tabDragOrder:      null,
      tabDragStartOrder: null,
      /** Which tab's own menu is open, so it can be closed when the strip moves under it */
      openTabMenuId:     null,
      /** The tab to draw attention to once the strip has finished running back to it */
      flashTabId:        null,
    };
  },

  watch: {
    tabQueries: {
      handler(queries) {
        this.$emit('tab-queries', queries);
      },
      immediate: true,
    },

    /** Whatever was under the pointer belonged to the menu that has just gone */
    subMenu() {
      this.subMenuHovered = false;
    },
  },

  mounted() {
    // Only the tabs instance listens, so a bar rendered as two parts doesn't act on each key twice
    if (this.part !== 'controls') {
      window.addEventListener('keydown', this.onShortcut);
    }
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onShortcut);
    clearTimeout(this._subMenuTimer);
    clearTimeout(this._flashTimer);
    cancelAnimationFrame(this._flashFrame);
    this.endColumnDrag(false);
    this.endTabDrag(false);
  },

  computed: {
    allSavedViews: mapPref(TABLE_VIEWS),

    /**
     * What is wrong with the query, once the user has stopped writing it.
     *
     * Held back while the box has the caret: `state:` is a field with no value, and it is also
     * the halfway point of typing `state:active` - with the values for it on screen at that very
     * moment. Correcting someone mid-word is noise, so this waits until they look away.
     */
    shownProblems() {
      return this.queryFocused ? [] : validateQuery(this.view.query, this.fields);
    },

    /**
     * The shortcuts as this keyboard writes them.
     *
     * The handler already answers to either modifier, so only the label was wrong: it read
     * "CMD-S" on every machine, which is neither what a Mac draws nor what Windows calls the key.
     * `shortcutLabel` is what the rest of the product spells its own shortcuts with.
     */
    shortcuts() {
      const modifier = isMac ? '⌘' : 'Ctrl';

      return {
        save:      shortcutLabel([modifier, 'S']),
        saveAsNew: shortcutLabel([modifier, 'Shift', 'S']),
        duplicate: shortcutLabel([modifier, 'D']),
      };
    },

    /** What the toolbar says about the part of the query that could not be run */
    unsupportedNotice() {
      return this.t('tableViews.query.unsupported', {
        count:  this.unsupportedFields.length,
        fields: this.unsupportedFields.join(', '),
      }, true);
    },

    /**
     * Everything the box has to say about what is in it, for the status icon at its right.
     *
     * A query that cannot be read as written comes first and on its own - saying a field is
     * unfilterable while the query also ends in `and` answers a question nobody asked yet.
     */
    queryStatusMessage() {
      if (this.shownProblems.length) {
        return this.shownProblems.map((problem) => this.problemNotice(problem)).join('<br>');
      }

      return this.unsupportedFields.length ? this.unsupportedNotice : '';
    },

    /**
     * A query that cannot be read is an error - nothing is being filtered by it. A field the
     * server cannot filter on is not: the rest of the query still ran.
     */
    queryStatus() {
      return this.shownProblems.length ? 'error' : 'info';
    },

    savedViews() {
      return this.allSavedViews?.[this.resourceType]?.views || this.allSavedViews?.[this.resourceType] || [];
    },

    /**
     * The view applied when the list is first opened, if the user has set one
     */
    defaultViewId() {
      return this.allSavedViews?.[this.resourceType]?.defaultViewId || null;
    },

    /**
     * Where the table's own tab sits among the saved ones.
     *
     * It is not a saved view, so it has no place in that list to hold - but it can be dragged
     * about like any other tab, so its place has to be kept somewhere. Missing means the front,
     * which is where it was before it could be moved.
     */
    allTabIndex() {
      const at = this.allSavedViews?.[this.resourceType]?.allIndex;

      return Math.min(Math.max(Number.isInteger(at) ? at : 0, 0), this.savedViews.length);
    },

    /** The default tab plus every saved view, in the order they are shown */
    /**
     * The strip: the table as it comes, then the saved views.
     *
     * Except that the view the list opens on leads, and the table's own tab follows it. The first
     * tab is the one you land on, so the one that is actually applied on arrival belongs there -
     * and having marked a view as the default, watching it stay wherever it happened to sit was
     * the menu saying one thing and the strip another. Neither of those two can be dragged out of
     * the first two places; see `firstMovableTabIndex`.
     */
    /** The strip as it is saved, before a drag in progress rearranges it - see `tabs` */
    baseTabs() {
      const all = {
        id: null, name: this.t('tableViews.tabs.all'), isDefaultTab: true
      };
      const tabs = this.savedViews.map((view) => ({
        id: view.id, name: view.name, view
      }));

      tabs.splice(this.allTabIndex, 0, all);

      // The one the list opens on leads, wherever it had been put. With nothing set that is the
      // table's own tab, which is what an empty default means.
      const lead = tabs.findIndex((tab) => (this.defaultViewId ? tab.view?.id === this.defaultViewId : tab.isDefaultTab));

      if (lead <= 0) {
        return tabs;
      }

      return [tabs[lead]].concat(tabs.filter((_, i) => i !== lead));
    },

    /** Mid-drag the strip follows the pointer rather than the saved order */
    tabs() {
      if (!this.tabDragOrder) {
        return this.baseTabs;
      }

      const byKey = {};

      this.baseTabs.forEach((tab) => {
        byKey[tabKey(tab)] = tab;
      });

      return this.tabDragOrder.map((key) => byKey[key]).filter(Boolean);
    },

    /**
     * How many tabs at the head of the strip are held there: the one the list opens on, and only
     * that one. It leads because it is the tab you arrive at, so it cannot be dragged out of the
     * front and nothing can be dropped in front of it. Everything else moves freely, the table's
     * own tab included - it is only pinned to the front while it is itself the default.
     */
    lockedTabCount() {
      return 1;
    },

    columnFields() {
      return this.fields.filter((f) => !f.isLabel);
    },

    /**
     * The handle's tooltip. Empty content is how the directive is told to show nothing, so the
     * tooltip goes the moment a row is picked up rather than riding along with it.
     *
     * Far enough left to clear the row's hover highlight: on the handle itself it sat over the
     * thing being dragged, which is the one place it is in the way.
     */
    reorderTip() {
      return {
        content: this.dragId ? '' : this.t('tableViews.columns.reorder'), placement: 'left', distance: TOOLTIP_DISTANCE
      };
    },

    lockedTip() {
      return {
        content: this.t('tableViews.columns.locked'), placement: 'left', distance: TOOLTIP_DISTANCE
      };
    },

    /**
     * Columns in the order the view puts them, so the picker reads the way the table does
     */
    orderedColumnFields() {
      // Mid-drag the list follows the pointer rather than the saved order
      const order = this.dragOrder || this.view.columnOrder;

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

    /**
     * Labels are left out: a cluster carries as many of them as it likes, so offering every key
     * buries the handful of fields worth grouping on under a list of them.
     */
    groupOptions() {
      return [{ id: null, label: this.t('tableViews.group.none') }].concat(
        (this.groupFields || this.fields)
          .filter((f) => !f.isLabel)
          .map((f) => ({ id: f.id, label: f.label }))
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
     * The one tab in the strip that Tab can land on. A tablist is a single stop and the arrows
     * walk it from there, so the tab holding the current view carries the tabindex and the rest
     * are reachable only through it. If the current view is not among the tabs - a deleted one,
     * say - the first tab takes it, or the strip would have no way in at all.
     */
    focusableTabId() {
      const tabs = this.tabs || [];
      const selected = tabs.find((t) => t.id === this.selectedViewId);

      return (selected || tabs[0])?.id;
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

    /** What a saved view keeps of the state in front of the user */
    viewToSave() {
      return {
        query:          this.view.query || '',
        columns:        this.view.columns || null,
        columnOrder:    this.view.columnOrder || null,
        labelColumns:   this.view.labelColumns || [],
        groupBy:        this.view.groupBy || null,
        sort:           this.view.sort || null,
        sortDescending: !!this.view.sortDescending,
      };
    },

    /** Every query on show, so the table knows which counts it has to go and get */
    tabQueries() {
      return Array.from(new Set(this.tabs.map((tab) => this.tabQuery(tab))));
    },

    isModified() {
      return !!this.view.query || !!this.view.groupBy || !!this.view.columns || !!this.view.labelColumns?.length ||
        !!this.view.columnOrder || !!this.view.sort;
    },
  },

  methods: {
    /**
     * Is `target` part of this table's toolbar - its tabs, its filter, or its View menu?
     *
     * Both halves of the bar live in the same table masthead, so that is what is compared. A
     * second table on the page has its own, and keeps its own shortcuts.
     */
    ownsTarget(target) {
      // `$el` is no use here - the component has a modal beside its bar, so its root is a
      // fragment whose first node may not be an element at all
      const root = this.$refs.root;

      if (!root?.closest || !target?.closest) {
        return false;
      }

      // The toolbar and the table under it together: they are one list as far as the user is
      // concerned, and a shortcut pressed while reading the rows belongs to the list being read.
      // The masthead is the fallback for a table that is not in table views layout.
      const listOf = (el) => el.closest('.has-table-views') || el.closest('.fixed-header-actions');
      const mine = listOf(root);

      return !!mine && listOf(target) === mine;
    },

    isSameConfig(a, b) {
      return (a.query || '') === (b.query || '') &&
        (a.groupBy || null) === (b.groupBy || null) &&
        (a.sort || null) === (b.sort || null) &&
        !!a.sortDescending === !!b.sortDescending &&
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
    /**
     * What a tab is actually filtering by: the box for the tab in front of the user, the edits
     * held for a tab left with some, and the saved query for the rest.
     */
    tabQuery(tab) {
      if (tab.id === this.selectedViewId) {
        return this.view.query || '';
      }

      const draft = this.drafts[this.draftKey(tab.id)];

      return (draft ? draft.query : tab.view?.query) || '';
    },

    tabCount(tab) {
      return this.viewCounts[this.tabQuery(tab)];
    },

    tabLabel(tab) {
      const count = this.tabCount(tab);

      // undefined: not counted yet. null: asked, and the api wouldn't say. Either way the tab
      // shows its name rather than a number that isn't true.
      return count === undefined || count === null ? tab.name : this.t('tableViews.tabs.count', { name: tab.name, count });
    },

    isTabDirty(tab) {
      if (tab.id === this.selectedViewId) {
        return this.isDirty;
      }

      return !!this.drafts[this.draftKey(tab.id)];
    },

    update(changes) {
      this.$emit('update:view', { ...this.view, ...changes });
    },

    problemNotice(problem) {
      return this.t(`tableViews.query.problem.${ problem.kind }`, { text: problem.text, label: problem.label || '' }, true);
    },

    isColumnVisible(field) {
      if (this.view.columns) {
        return this.view.columns.includes(field.id);
      }

      // Nothing chosen yet, so what the table shows is the page's own set. Without a set to
      // compare against every offered column would read as shown, including the ones the page
      // leaves out.
      return !this.defaultColumns.length || this.defaultColumns.includes(field.id);
    },

    isCoreColumn(field) {
      return !!field?.id && this.coreColumns.includes(field.id);
    },

    toggleColumn(field) {
      // Core columns (name, age) can't be hidden - the table depends on them
      if (this.isCoreColumn(field)) {
        return;
      }

      // From what is on screen rather than from every column offered - seeding with all of them
      // turned on the ones the page leaves out the moment anything was toggled
      const current = this.view.columns || this.columnFields.filter((f) => this.isColumnVisible(f)).map((f) => f.id);
      const next = current.includes(field.id) ? current.filter((id) => id !== field.id) : current.concat([field.id]);

      this.update({ columns: next });
    },

    selectAllColumns() {
      this.update({ columns: this.columnFields.map((f) => f.id) });
    },

    /**
     * Eat the click that a mouseup at the end of a drag is about to produce.
     *
     * It would land on whatever the pointer finished over - the row it was dropped on, or the tab
     * it was dropped beside - and toggle or apply it. A drag is not a click.
     */
    swallowNextClick() {
      const swallow = (event) => {
        event.stopPropagation();
        event.preventDefault();
      };

      window.addEventListener('click', swallow, { capture: true, once: true });
      setTimeout(() => window.removeEventListener('click', swallow, true), 0);
    },

    /**
     * Press on a column's grip: arm a possible drag. Nothing is picked up here - a press on a row
     * is far more often the start of a click that toggles the column - so the row is only taken
     * once the pointer has travelled `DRAG_THRESHOLD` with it held.
     */
    startColumnDrag(id, event) {
      if (event.button !== 0) {
        return;
      }

      // Otherwise the pointer selects the labels it crosses on the way
      event.preventDefault();

      this.dragFrom = { id, y: event.clientY };
      this.dragMoved = false;

      window.addEventListener('mousemove', this.onColumnDragMove, true);
      window.addEventListener('mouseup', this.onColumnDragEnd, true);
      window.addEventListener('keydown', this.onColumnDragKey, true);
    },

    onColumnDragMove(event) {
      if (!this.dragFrom) {
        return;
      }

      this.dragPointerY = event.clientY;

      if (!this.dragMoved && Math.abs(event.clientY - this.dragFrom.y) < DRAG_THRESHOLD) {
        return;
      }

      this.beginColumnDrag();
      this.placeDraggedColumn();
    },

    beginColumnDrag() {
      if (this.dragMoved || !this.dragFrom) {
        return;
      }

      this.dragMoved = true;
      this.dragId = this.dragFrom.id;
      this.dragOrder = this.orderedColumnFields.map((f) => f.id);
      this.dragStartOrder = [...this.dragOrder];
      this.captureColumnSlots();
      // The list's own rows are told to say `grabbing` in CSS; this is for everywhere else the
      // pointer can go while still carrying a row.
      document.body.style.cursor = 'grabbing';
    },

    /**
     * The places the rows occupy, measured once as the drag begins.
     *
     * They cannot be read live. A row's box reflects any transform it is under, and the rows
     * displaced by a drag are mid-FLIP for as long as that move lasts - so measuring during the
     * drag reads the positions rows are traveling THROUGH. The pointer then lands on a row that is
     * only passing by, which reorders, which starts another move: the row flails between places
     * instead of settling under the cursor.
     *
     * Held in the panel's own coordinates rather than the viewport's, so that a panel scrolled
     * mid-drag does not put every boundary where the rows no longer are.
     */
    captureColumnSlots() {
      const scroller = this.$refs.columnsPanel;
      const rows = scroller?.querySelectorAll('[data-col-id]') || [];
      const origin = scroller ? scroller.getBoundingClientRect().top - scroller.scrollTop : 0;

      this.dragSlots = [...rows].map((el) => {
        const box = el.getBoundingClientRect();

        return { top: box.top - origin, bottom: box.bottom - origin };
      });
    },

    /**
     * Which row the pointer is over. Past either end it clamps, so dragging beyond the last row
     * parks the column at the end rather than abandoning the move.
     */
    columnIndexAt(clientY) {
      const slots = this.dragSlots || [];
      const scroller = this.$refs.columnsPanel;

      if (!slots.length || !scroller) {
        return -1;
      }

      const y = clientY - scroller.getBoundingClientRect().top + scroller.scrollTop;

      if (y <= slots[0].top) {
        return 0;
      }

      if (y >= slots[slots.length - 1].bottom) {
        return slots.length - 1;
      }

      return slots.findIndex((slot) => y >= slot.top && y <= slot.bottom);
    },

    /**
     * The first place a column can be dropped into. The locked columns hold the head of the list
     * and cannot be moved themselves, so nothing may be carried above them either.
     */
    firstMovableIndex(order) {
      let i = 0;

      while (i < order.length && this.coreColumns.includes(order[i])) {
        i++;
      }

      return i;
    },

    /** Put the held row where the pointer is, so the rest shuffle around it as it travels */
    placeDraggedColumn() {
      const from = this.dragOrder.indexOf(this.dragId);
      const at = this.columnIndexAt(this.dragPointerY);

      if (from === -1 || at === -1) {
        return;
      }

      this.dragOrder = moveInOrder(this.dragOrder, from, Math.max(at, this.firstMovableIndex(this.dragOrder)));
    },

    /** Escape abandons the drag: the list snaps back to the view, and nothing is written */
    onColumnDragKey(event) {
      if (event.key === 'Escape') {
        this.endColumnDrag(false);
      }
    },

    onColumnDragEnd() {
      this.endColumnDrag(this.dragMoved);
    },

    endColumnDrag(commit) {
      window.removeEventListener('mousemove', this.onColumnDragMove, true);
      window.removeEventListener('mouseup', this.onColumnDragEnd, true);
      window.removeEventListener('keydown', this.onColumnDragKey, true);

      const started = this.dragStartOrder || [];
      const order = this.dragOrder;
      const moved = !!order && order.some((id, i) => id !== started[i]);

      if (this.dragMoved) {
        this.swallowNextClick();
      }

      document.body.style.cursor = '';

      this.dragFrom = null;
      this.dragId = null;
      this.dragMoved = false;
      this.dragSlots = null;
      this.dragStartOrder = null;
      this.dragOrder = null;

      if (commit && moved) {
        this.update({ columnOrder: order });
      }
    },

    /**
     * Press on a tab: arm a possible drag.
     *
     * Nothing is picked up here. A press on a tab is far more often the start of a click that
     * selects the view, so the tab is only taken once the pointer has travelled DRAG_THRESHOLD
     * with it held - and the click that would follow the drop is swallowed in endTabDrag.
     */
    startTabDrag(tab, event) {
      const key = tabKey(tab);

      if (event.button !== 0 || this.renamingId || this.baseTabs.findIndex((t) => tabKey(t) === key) < this.lockedTabCount) {
        return;
      }

      this.tabDragFrom = { key, x: event.clientX };
      this.tabDragMoved = false;

      window.addEventListener('mousemove', this.onTabDragMove, true);
      window.addEventListener('mouseup', this.onTabDragEnd, true);
      window.addEventListener('keydown', this.onTabDragKey, true);
    },

    onTabDragMove(event) {
      if (!this.tabDragFrom) {
        return;
      }

      this.tabDragPointerX = event.clientX;

      if (!this.tabDragMoved && Math.abs(event.clientX - this.tabDragFrom.x) < DRAG_THRESHOLD) {
        return;
      }

      this.beginTabDrag();
      this.placeDraggedTab();
    },

    beginTabDrag() {
      if (this.tabDragMoved || !this.tabDragFrom) {
        return;
      }

      this.tabDragMoved = true;
      this.closeTabMenus();
      this.tabDragId = this.tabDragFrom.key;
      this.tabDragOrder = this.baseTabs.map(tabKey);
      this.tabDragStartOrder = [...this.tabDragOrder];
      this.captureTabSlots();
      // Otherwise the pointer selects the tab names it crosses on the way
      window.getSelection()?.removeAllRanges();
      document.body.style.cursor = 'grabbing';
      this.runTabScroll();
    },

    /**
     * The places the tabs occupy, measured once as the drag begins.
     *
     * Fixed, and that is the whole point. Working the places out from the order the pointer has
     * currently put things in feeds the answer back into the question: passing the tab to your
     * right swaps the two, which puts the boundary you just crossed back under the pointer, so
     * it swaps again - and the pair flickers between the two arrangements while you hold still.
     * Measuring once leaves a fixed ladder to read the pointer against.
     *
     * Kept relative to the list rather than to the window, so the strip scrolling under a held
     * tab does not move the rungs.
     */
    captureTabSlots() {
      const list = this.$refs.tabStrip?.querySelector('.view-tabs-list');

      if (!list) {
        return;
      }

      const base = list.getBoundingClientRect().left;
      const boxes = this.baseTabs.map((tab) => {
        const rect = this.tabWrap(tab)?.getBoundingClientRect();

        return rect ? { left: rect.left - base, right: rect.right - base } : null;
      }).filter(Boolean);

      // The line between one tab and the next, which is the middle of the gap they sit either
      // side of. A tab changes places when the pointer crosses one of these, the way a column row
      // changes places when the pointer enters the row below it - not at the far tab's middle,
      // which meant carrying a tab halfway across its neighbour before anything happened.
      this.tabDragBounds = boxes.slice(0, -1).map((box, i) => (box.right + boxes[i + 1].left) / 2);
    },

    /** Where along the strip the pointer is, in the strip's own scrolled-out width */
    tabContentX() {
      const strip = this.$refs.tabStrip;
      const list = strip?.querySelector('.view-tabs-list');

      if (!strip || !list) {
        return 0;
      }

      return this.tabDragPointerX - list.getBoundingClientRect().left;
    },

    /** How many of the lines measured at the start the pointer has crossed */
    tabIndexAt(contentX) {
      const bounds = this.tabDragBounds || [];
      let i = 0;

      while (i < bounds.length && contentX >= bounds[i]) {
        i++;
      }

      return i;
    },

    /** Put the held tab where the pointer is, so the rest shuffle around it as it travels */
    placeDraggedTab() {
      if (!this.tabDragOrder) {
        return;
      }

      const from = this.tabDragOrder.indexOf(this.tabDragId);
      const to = Math.max(this.tabIndexAt(this.tabContentX()), this.lockedTabCount);

      this.tabDragOrder = moveInOrder(this.tabDragOrder, from, to);
    },

    /**
     * Carrying a tab to an end of the strip runs the strip that way, so a tab can be taken
     * somewhere that is not on screen yet. A frame loop rather than something driven by the
     * pointer: holding still at the edge should keep going.
     */
    runTabScroll() {
      const step = () => {
        if (!this.tabDragMoved) {
          return;
        }

        const strip = this.$refs.tabStrip;

        if (strip) {
          const rect = strip.getBoundingClientRect();

          if (this.tabDragPointerX < rect.left + TAB_SCROLL_EDGE) {
            strip.scrollLeft -= TAB_SCROLL_STEP;
            this.placeDraggedTab();
          } else if (this.tabDragPointerX > rect.right - TAB_SCROLL_EDGE) {
            strip.scrollLeft += TAB_SCROLL_STEP;
            this.placeDraggedTab();
          }
        }

        this._tabScrollFrame = requestAnimationFrame(step);
      };

      cancelAnimationFrame(this._tabScrollFrame);
      this._tabScrollFrame = requestAnimationFrame(step);
    },

    /** Escape abandons the drag: the strip snaps back to the saved order, and nothing is written */
    onTabDragKey(event) {
      if (event.key === 'Escape') {
        this.endTabDrag(false);
      }
    },

    onTabDragEnd() {
      this.endTabDrag(this.tabDragMoved);
    },

    endTabDrag(commit) {
      window.removeEventListener('mousemove', this.onTabDragMove, true);
      window.removeEventListener('mouseup', this.onTabDragEnd, true);
      window.removeEventListener('keydown', this.onTabDragKey, true);
      cancelAnimationFrame(this._tabScrollFrame);

      const started = this.tabDragStartOrder || [];
      const order = this.tabDragOrder;
      const moved = !!order && order.some((key, i) => key !== started[i]);

      if (this.tabDragMoved) {
        this.swallowNextClick();
      }

      document.body.style.cursor = '';

      this.tabDragFrom = null;
      this.tabDragId = null;
      this.tabDragMoved = false;
      this.tabDragBounds = null;
      this.tabDragStartOrder = null;

      if (commit && moved) {
        const byId = {};

        this.savedViews.forEach((view) => {
          byId[view.id] = view;
        });

        // The table's own tab is not one of the saved views, so its place is kept beside them
        this.persistAll(order.map((key) => byId[key]).filter(Boolean), this.defaultViewId, order.indexOf('all'));
      }

      this.tabDragOrder = null;
    },

    setGroupBy(id) {
      this.update({ groupBy: id });
    },

    /**
     * Picking a grouping from the menu, where picking the one already applied undoes it.
     *
     * The rows are how the grouping is read as much as how it is set, so the obvious move on
     * seeing the tick against the field you are grouped by is to click it again - and a menu
     * that answers by doing nothing leaves you hunting for None or Reset to say what the row you
     * just clicked was already saying.
     */
    toggleGroupBy(id) {
      this.setGroupBy(id === this.view.groupBy ? null : id);
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
        query: '', columns: null, labelColumns: [], columnOrder: null, groupBy: null, sort: null, sortDescending: false
      });
    },

    /** The default tab has no id of its own, so it needs a key of its own */
    draftKey(id) {
      return id || '__default';
    },

    /**
     * Hold on to the tab being left, if it has changes worth keeping. A tab left in the state it
     * was saved in has nothing to hold, so anything held for it is let go.
     */
    rememberDraft(id) {
      const key = this.draftKey(id);

      if (this.isDirty) {
        this.drafts = { ...this.drafts, [key]: { ...this.view } };

        return;
      }

      this.forgetDraft(id);
    },

    forgetDraft(id) {
      const key = this.draftKey(id);

      if (!this.drafts[key]) {
        return;
      }

      const rest = { ...this.drafts };

      delete rest[key];
      this.drafts = rest;
    },

    /**
     * @param saved the view to show, or null for the default tab
     * @param useDraft whether unsaved edits left on that tab should come back with it. Off for
     *        the paths whose whole purpose is to put a tab back the way it was saved.
     */
    applyView(saved, useDraft = true) {
      const from = this.selectedViewId;
      const to = saved?.id || null;
      const moving = from !== to;

      // Clicking the tab already in front of you is not a request to throw away what is on it.
      // Discarding says so outright, and comes through here with `useDraft` off.
      if (!moving && useDraft) {
        this.pickedViewId = to;

        return;
      }

      // Before the pick moves: what counts as unsaved is measured against the tab being left, and
      // moving the pick first measures it against the one being arrived at, which marks every tab
      // left behind as changed whether anything was typed into it or not.
      if (moving) {
        this.rememberDraft(from);
      }

      this.pickedViewId = to;

      const draft = useDraft ? this.drafts[this.draftKey(to)] : null;

      if (draft) {
        this.$emit('update:view', { ...draft });

        return;
      }

      this.$emit('update:view', {
        query:          saved?.query || '',
        columns:        saved?.columns || null,
        columnOrder:    saved?.columnOrder || null,
        labelColumns:   saved?.labelColumns || [],
        groupBy:        saved?.groupBy || null,
        sort:           saved?.sort || null,
        sortDescending: saved?.sortDescending || false,
      });
    },

    /**
     * Put the view back the way it was - either the saved view being edited, or nothing at all
     */
    discardChanges() {
      this.forgetDraft(this.selectedViewId);
      this.applyView(this.editingView, false);
    },

    saveChanges() {
      if (this.editingView) {
        this.updateView(this.editingView);
      } else if (this.isDirty) {
        // The default tab can't be saved over, and an unsaved view has nothing to save over, so
        // either way what is being asked for is a new view - and it needs a name
        this.openSaveAsNew();
      }
    },

    /**
     * Keep the changes on the tab as a view of their own.
     *
     * The same act as copying a tab, and it lands the same way - the new tab in front of you with
     * its name open for typing. The only difference is what is copied: the tab as it stands with
     * the unsaved changes on it, rather than the view as it was last saved.
     *
     * It used to ask for the name in a modal first. A modal to take one word put the thing being
     * named behind the thing naming it, and it was the one place in the toolbar where naming a
     * view did not happen on the tab itself.
     */
    openSaveAsNew() {
      if (!this.isDirty && this.pickedViewId === undefined) {
        return;
      }

      this.duplicateView({ ...this.viewToSave, name: this.editingView?.name || this.t('tableViews.tabs.all') });
    },

    /**
     * A new tab starts life as an unsaved "New View" holding the table's defaults, so it can be
     * built up in place and named when it is worth keeping
     */
    addView() {
      const view = {
        id:           randomStr(8),
        name:         this.nextNewViewName(),
        query:        '',
        columns:      null,
        columnOrder:  null,
        labelColumns: [],
        groupBy:      null,
      };

      this.persist(this.savedViews.concat([view]));
      this.applyView(view);
      this.focusTab(view.id, true);
    },

    /**
     * `base`, or the first number after it that no view is called yet.
     *
     * `from` is where the counting starts: a new view is just "Untitled" until there is one, so
     * the second is "Untitled 1"; a copy is "X (copy)" and the next is "X (copy) 2", which reads
     * as the second copy rather than as a second thing called copy.
     */
    unusedViewName(base, from) {
      let name = base;
      let n = from;

      while (this.savedViews.find((v) => v.name === name)) {
        name = `${ base } ${ n++ }`;
      }

      return name;
    },

    nextNewViewName() {
      return this.unusedViewName(this.t('tableViews.tab.newViewName'), 1);
    },

    /**
     * A sub menu closing itself - a click outside it, Escape, picking something - is what takes
     * the row out of the open state the click put it in.
     *
     * A menu normally hands focus back to the button that opened it, and this one has no button:
     * it is opened by a row of the menu above. So the row takes focus back, leaving the keyboard
     * where it was rather than at the top of the page.
     */
    /**
     * A row of the View menu coming under the pointer.
     *
     * Opening one is immediate; taking an open one away from another row is not - see
     * SUB_MENU_GRACE_MS. `key` is null for the rows that open nothing, which close what is open
     * on the same terms.
     */
    hoverSubMenu(key) {
      clearTimeout(this._subMenuTimer);

      if (this.subMenu === key) {
        return;
      }

      if (!this.subMenu) {
        this.subMenu = key;

        return;
      }

      this._subMenuTimer = setTimeout(() => {
        this.subMenu = key;
      }, SUB_MENU_GRACE_MS);
    },

    /** Clicking a row says which menu you want outright, with none of the waiting */
    openSubMenu(key) {
      clearTimeout(this._subMenuTimer);
      this.subMenu = key;
    },

    /** The pointer has left a row without settling on it, so it never meant to choose it */
    cancelSubMenuSwitch() {
      clearTimeout(this._subMenuTimer);
    },

    /** The pointer has arrived in the sub menu, which is the end of any journey across the rows */
    enterSubMenu() {
      clearTimeout(this._subMenuTimer);
      this.subMenuHovered = true;
    },

    closeSubMenu(key, open) {
      if (!open && this.subMenu === key) {
        this.subMenu = null;
        this.$nextTick(() => this.$refs.viewMenu?.querySelector(`[data-testid="table-views-view-${ key }"]`)?.focus());
      }
    },

    /**
     * The tab a menu belongs to, for the menu to line itself up against.
     */
    tabWrap(tab) {
      // A ref inside a v-for collects into an array, so this is a list of one
      const held = this.$refs[`tab-wrap-${ tab.id }`];

      return Array.isArray(held) ? held[0] : held;
    },

    /** The tab's own button, by the same one-element-array rule as `tabWrap` */
    tabButton(tab) {
      const held = this.$refs[`tab-btn-${ tab.id }`];

      return Array.isArray(held) ? held[0] : held;
    },

    /** The chevron that opens the tab's menu - a component, so its element is one step down */
    tabCaret(tab) {
      const held = this.$refs[`tab-caret-${ tab.id }`];
      const cmp = Array.isArray(held) ? held[0] : held;

      return cmp?.$el || cmp;
    },

    /**
     * Arrow along the strip. Moving the focus picks the view as it goes, the way the tabs
     * elsewhere in the product behave - a tab that has focus but is not the one in force would
     * leave the underline and the table disagreeing about which view is shown.
     */
    stepTab(delta) {
      const tabs = this.tabs || [];

      if (tabs.length < 2) {
        return;
      }

      // From wherever the focus actually is. It is normally on the tab in force, but a view just
      // deleted leaves it on the one before, which is not the one showing.
      const focused = tabs.findIndex((t) => this.tabButton(t) === document.activeElement);
      const at = focused >= 0 ? focused : tabs.findIndex((t) => t.id === this.focusableTabId);
      const next = tabs[((at < 0 ? 0 : at) + delta + tabs.length) % tabs.length];

      this.goToTab(next);
    },

    /** Home and End, to either end of the strip */
    edgeTab(which) {
      const tabs = this.tabs || [];
      const next = which === 'first' ? tabs[0] : tabs[tabs.length - 1];

      if (next) {
        this.goToTab(next);
      }
    },

    /**
     * Show a tab and put the focus on it. The focus has to follow, because the strip is a roving
     * tabindex - the tab left behind stops being reachable the moment another takes the view.
     */
    goToTab(tab) {
      this.applyView(tab.view || null);
      this.focusTab(tab.id);
    },

    /**
     * Put the keyboard on a view's tab once it exists, and bring the tab into sight with it: a
     * view you just made or just copied should be the one in front of you.
     *
     * `toEnd` is for those two. A new view goes on the end of the strip, so rather than working
     * out where its tab has landed - which the strip has not finished laying out at the moment it
     * is asked - the strip is simply run to its far end, where the tab must be.
     */
    focusTab(id, toEnd = false) {
      this.$nextTick(() => {
        const tab = (this.tabs || []).find((t) => t.id === id);
        const btn = tab && this.tabButton(tab);

        if (!btn) {
          return;
        }

        // Focus scrolls the strip by itself, which would fight the run to the end below
        btn.focus({ preventScroll: !!toEnd });

        if (!toEnd) {
          btn.scrollIntoView({ block: 'nearest', inline: 'nearest' });

          return;
        }

        // A frame later, so the tab that has just been added is in the strip's width
        requestAnimationFrame(() => {
          const strip = this.$refs.tabStrip;

          if (strip) {
            strip.scrollLeft = strip.scrollWidth;
          }
        });
      });
    },

    /**
     * Down arrow opens the focused tab's menu, the way it opens any menu button. The chevron is
     * out of the tab sequence, so this is the keyboard's way in.
     *
     * The menu is told a key opened it before it is opened: that is what has it hand the focus to
     * its first row rather than leaving it on the chevron, which is how it tells a key press from
     * a click.
     */
    openTabMenu(tab) {
      const caret = this.tabCaret(tab);

      if (!caret) {
        return;
      }

      caret.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      caret.click();
    },

    /**
     * Closing the menu hands the focus back to the chevron, which is not in the tab sequence and
     * answers no arrows. Put it back on the tab it belongs to, so the strip still works - but
     * only when the keyboard is where it was left, or a click elsewhere would be dragged back.
     */
    onTabMenuToggle(tab, open) {
      this.openTabMenuId = open ? tabKey(tab) : null;

      if (open) {
        return;
      }

      this.$nextTick(() => {
        if (document.activeElement === this.tabCaret(tab)) {
          this.tabButton(tab)?.focus();
        }
      });
    },

    /**
     * Mark a tab once the strip has actually arrived at the start.
     *
     * Waiting on the scroll rather than on a guess at how long it takes: a fixed delay fired
     * while the strip was still moving, which is the one moment the mark is no use - it is there
     * to answer "why did that just move", and it has to land after the moving has stopped. The
     * cap is for a scroll that never finishes, so nothing is left waiting on it.
     */
    flashTabWhenScrolled(strip, key) {
      clearTimeout(this._flashTimer);
      cancelAnimationFrame(this._flashFrame);

      const deadline = Date.now() + TAB_SCROLL_SETTLE_MAX_MS;

      const settle = () => {
        if (strip.scrollLeft > 1 && Date.now() < deadline) {
          this._flashFrame = requestAnimationFrame(settle);

          return;
        }

        this.flashTabId = key;
        this._flashTimer = setTimeout(() => {
          this.flashTabId = null;
        }, TAB_FLASH_MS);
      };

      settle();
    },

    /**
     * Shut whichever tab's menu is open.
     *
     * The menu is positioned against its tab, so anything that moves the tab out from under it -
     * the strip scrolling, or the tab itself being picked up - leaves the menu pointing at
     * nothing. Closing it is the honest answer.
     */
    closeTabMenus() {
      this.openTabMenuId = null;
    },

    /**
     * Rename in place. The name lives on the tab, so that is where it is edited - a modal to
     * change one word puts the thing being renamed behind the thing renaming it.
     */
    openRename(saved) {
      if (!saved?.id) {
        return;
      }

      this.renamingId = saved.id;
      this.renameDraft = saved.name;

      this.$nextTick(() => {
        // A ref inside a v-for collects into an array, so this is a list of one
        const held = this.$refs[`rename-${ saved.id }`];
        const input = Array.isArray(held) ? held[0] : held;

        input?.focus();
        input?.select();
      });
    },

    /**
     * Keep the typed name. Blank, or unchanged, simply closes - there is nothing to record.
     */
    commitRename() {
      const id = this.renamingId;
      const name = (this.renameDraft || '').trim();
      const saved = this.savedViews.find((v) => v.id === id);

      this.renamingId = null;
      this.renameDraft = '';

      if (!name || !saved || name === saved.name) {
        return;
      }

      this.persist(this.savedViews.map((v) => (v.id === id ? { ...v, name } : v)));
    },

    cancelRename() {
      this.renamingId = null;
      this.renameDraft = '';
    },

    /**
     * The modal's name field either creates a view or renames one
     */
    /**
     * Export needs a format, which is more than belongs in a menu - ask in a modal.
     * `view` is only used to label it, the rows exported are whatever the view matches.
     */
    openExport(saved) {
      this.modal = { kind: 'export', view: saved || null };
    },

    closeModal() {
      this.modal = null;
    },

    /**
     * Copy any tab, the default one included - copying it is how you start a view from the table
     * as it comes, since the default tab itself can never be saved over.
     */
    duplicateTab(tab) {
      this.duplicateView(tab.view || {
        name:         this.t('tableViews.tabs.all'),
        query:        '',
        columns:      null,
        columnOrder:  null,
        labelColumns: [],
        groupBy:      null,
      });
    },

    /**
     * Copy a saved view, so a variation can be built without losing the original
     */
    duplicateView(saved) {
      const name = this.unusedViewName(`${ saved.name } ${ this.t('tableViews.tab.copySuffix') }`, 2);
      const copy = {
        ...saved, id: randomStr(8), name
      };

      this.persist(this.savedViews.concat([copy]));
      this.applyView(copy);
      this.focusTab(copy.id, true);
      // A copy is named after the thing it was copied from, which is never what you wanted it
      // called - so the name is already open for typing by the time the tab is in front of you
      this.$nextTick(() => this.openRename(copy));
    },

    duplicateCurrent() {
      const tab = this.tabs.find((t) => t.id === this.selectedViewId);

      if (tab) {
        this.duplicateTab(tab);
      }
    },

    /**
     * The view this list opens on. No toggle: choosing the default tab is itself how you go back
     * to opening on the table as it comes, which is what an empty default means.
     */
    setDefaultView(tab) {
      this.persistAll(this.savedViews, tab.isDefaultTab ? null : tab.view?.id || null);

      // The tab has just been moved to the head of the strip, which is no use if the strip is
      // scrolled somewhere else - so the strip goes back to the start to show it happening,
      // whether or not the tab that moved is the one being looked at.
      //
      // And then the tab itself is flashed, once the strip has stopped: a strip that jumps to its
      // start on its own says nothing about why, and the mark is the one a dragged tab wears, so
      // it reads as "this one" rather than as something new to learn.
      const key = tabKey(tab.isDefaultTab ? { id: null } : { id: tab.view?.id });

      this.$nextTick(() => {
        const strip = this.$refs.tabStrip;

        if (!strip) {
          return;
        }

        strip.scrollTo({ left: 0, behavior: 'smooth' });
        this.flashTabWhenScrolled(strip, key);
      });
    },

    /** Is this the tab the list opens on? With nothing set, that is the default tab */
    isDefaultTab(tab) {
      return tab.isDefaultTab ? !this.defaultViewId : this.defaultViewId === tab.view?.id;
    },

    persist(views) {
      this.persistAll(views, this.defaultViewId);
    },

    persistAll(views, defaultViewId, allIndex = this.allTabIndex) {
      // A view that no longer exists can't be the default one
      const validDefault = views.find((v) => v.id === defaultViewId) ? defaultViewId : null;

      this.allSavedViews = {
        ...(this.allSavedViews || {}),
        [this.resourceType]: {
          views,
          defaultViewId: validDefault,
          allIndex:      Math.min(Math.max(allIndex, 0), views.length)
        }
      };
    },

    updateView(saved) {
      this.persist(this.savedViews.map((v) => (v.id === saved.id ? { ...v, ...this.viewToSave } : v)));
    },

    deleteView(saved) {
      const wasSelected = this.selectedViewId === saved.id;
      // The tab the keyboard falls back to. Taken before the view goes, because afterwards there
      // is nothing left to measure from - and it is the one in front of the gap, not the one
      // that slides into it, that the user was last looking at.
      const tabs = this.tabs || [];
      const before = tabs[Math.max(tabs.findIndex((t) => t.id === saved.id) - 1, 0)];

      this.persist(this.savedViews.filter((v) => v.id !== saved.id));
      this.forgetDraft(saved.id);

      if (wasSelected) {
        this.applyView(null);
      }

      if (before) {
        this.focusTab(before.id);
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

      // Only for the list the keyboard is actually in - its toolbar, its filter box or its rows.
      // A page can carry two of these, each with its own views, and a shortcut has to name one of
      // them; the focus is what names it. It also keeps ⌘S out of whatever else on the page the
      // user might be writing in, which is what the old check was for.
      if (!this.ownsTarget(event.target)) {
        return;
      }

      const match = SHORTCUTS.find((s) => s.key === event.key.toLowerCase() && s.shift === event.shiftKey);

      if (!match) {
        return;
      }

      event.preventDefault();
      this[match.method]();
    },

    doExport(format) {
      // The name goes with it: the export is watched in the notification centre, and by the time
      // it finishes the modal that knew which view was picked is long gone
      const name = this.modal?.view?.name || this.t('tableViews.tabs.all');

      this.$emit('export', { format, name });
      this.closeModal();
    },
  }
};
</script>

<template>
  <div
    ref="root"
    class="table-views"
    :class="{ 'part-controls': part === 'controls', 'part-tabs': part === 'tabs' }"
    data-testid="table-views-bar"
  >
    <!-- The rule under the tabs belongs to the row rather than to the strip that scrolls, so it
         spans the width however far along the tabs have been pushed. -->
    <div
      v-if="part !== 'controls'"
      class="view-tabs-row"
    >
      <div
        ref="tabStrip"
        class="view-tabs"
        @scroll="closeTabMenus"
      >
        <!-- One tab stop for the whole strip, the way the product's own tabs work: the arrows walk
             it, Tab leaves it for Add View. -->
        <!-- The tabs reorder under the pointer on the TransitionGroup's own FLIP move, the same
             way the column picker's rows do. -->
        <TransitionGroup
          tag="div"
          name="view-tab"
          class="view-tabs-list"
          :class="{ 'is-reordering': tabDragId !== null }"
          role="tablist"
          :aria-label="t('tableViews.tabs.label')"
        >
          <div
            v-for="tab in tabs"
            :key="tab.id || 'all'"
            :ref="`tab-wrap-${ tab.id }`"
            class="view-tab-wrap"
            :class="{
              active: selectedViewId === tab.id,
              held: tabDragId === (tab.id || 'all'),
              flash: flashTabId === (tab.id || 'all'),
            }"
            @mousedown="startTabDrag(tab, $event)"
          >
            <!-- Renaming happens on the tab itself, so the name is edited where it is read. The
                 default tab is excluded outright: it has no name of its own to change, and its id is
                 null, which is also what "nothing is being renamed" looks like. -->
            <input
              v-if="!tab.isDefaultTab && renamingId === tab.id"
              :ref="`rename-${ tab.id }`"
              v-model="renameDraft"
              type="text"
              class="view-tab rename-input"
              :size="Math.max(renameDraft.length, 4)"
              :aria-label="t('tableViews.tab.rename')"
              :data-testid="`table-views-rename-input-${ tab.id }`"
              @keydown.enter.prevent="commitRename"
              @keydown.esc.prevent="cancelRename"
              @blur="commitRename"
              @click.stop
            >
            <button
              v-else
              :ref="`tab-btn-${ tab.id }`"
              type="button"
              role="tab"
              class="view-tab"
              :aria-selected="selectedViewId === tab.id"
              :tabindex="tab.id === focusableTabId ? 0 : -1"
              :data-testid="tab.isDefaultTab ? 'table-views-tab-all' : `table-views-tab-${ tab.id }`"
              @click="applyView(tab.view || null)"
              @keydown.left.prevent="stepTab(-1)"
              @keydown.right.prevent="stepTab(1)"
              @keydown.home.prevent="edgeTab('first')"
              @keydown.end.prevent="edgeTab('last')"
              @keydown.down.prevent="openTabMenu(tab)"
            >
              {{ tabLabel(tab) }}
              <span
                v-if="isTabDirty(tab)"
                v-clean-tooltip="t('tableViews.view.unsavedShort')"
                class="unsaved-dot"
                data-testid="table-views-unsaved"
              />
            </button>

            <!-- The menu belongs to the whole tab, not to the chevron that opens it, so it is
                 positioned against the tab: flush with the start of the name and 9 below the line the
                 tab draws under itself. -->
            <rc-dropdown
              :open="openTabMenuId === (tab.id || 'all')"
              :placement="'bottom-start'"
              :distance="9"
              :reference-node="() => tabWrap(tab)"
              @update:open="onTabMenuToggle(tab, $event)"
            >
              <!-- Out of the tab sequence: the strip is one stop, and the down arrow on the tab is
                   what opens this. The mouse still has the chevron to click. -->
              <rc-dropdown-trigger
                :ref="`tab-caret-${ tab.id }`"
                variant="link"
                class="view-tab-caret"
                tabindex="-1"
                :aria-label="t('tableViews.tab.menu')"
                :data-testid="tab.isDefaultTab ? 'table-views-tab-menu-all' : `table-views-tab-menu-${ tab.id }`"
              >
                <i class="icon icon-chevron-down" />
              </rc-dropdown-trigger>
              <template #dropdownCollection>
                <div :class="['menu-panel', { 'has-notice': isTabDirty(tab) }]">
                  <!-- Unsaved changes, and the three ways out of them -->
                  <template v-if="isTabDirty(tab)">
                    <div class="menu-notice">
                      <span class="unsaved-dot" />
                      {{ t('tableViews.view.unsaved') }}
                    </div>
                    <rc-dropdown-item
                      v-if="!tab.isDefaultTab"
                      data-testid="table-views-save-changes"
                      @click="saveChanges()"
                    >
                      <template #before>
                        <i class="icon icon-download" />
                      </template>
                      {{ t('tableViews.view.saveChanges') }}
                      <template #after>
                        <span class="menu-shortcut">{{ shortcuts.save }}</span>
                      </template>
                    </rc-dropdown-item>
                    <rc-dropdown-item
                      data-testid="table-views-save-as-new"
                      @click="openSaveAsNew()"
                    >
                      <template #before>
                        <i class="menu-gutter" />
                      </template>
                      {{ t('tableViews.view.saveAsNew') }}
                      <template #after>
                        <span class="menu-shortcut">{{ shortcuts.saveAsNew }}</span>
                      </template>
                    </rc-dropdown-item>
                    <rc-dropdown-item
                      data-testid="table-views-discard"
                      @click="discardChanges()"
                    >
                      <template #before>
                        <i class="menu-gutter" />
                      </template>
                      {{ t('tableViews.view.discard') }}
                    </rc-dropdown-item>
                    <rc-dropdown-separator />
                  </template>

                  <!-- The default tab is the table as it comes: it can't be renamed, saved over or
                       deleted. Copying it is how you start a view from what it holds. -->
                  <rc-dropdown-item
                    v-if="!tab.isDefaultTab"
                    :data-testid="`table-views-rename-${ tab.id }`"
                    @click="openRename(tab.view)"
                  >
                    <template #before>
                      <i class="icon icon-edit" />
                    </template>
                    {{ t('tableViews.tab.rename') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    :data-testid="tab.isDefaultTab ? 'table-views-duplicate-all' : `table-views-duplicate-${ tab.id }`"
                    @click="duplicateTab(tab)"
                  >
                    <template #before>
                      <i class="icon icon-copy" />
                    </template>
                    {{ t('tableViews.tab.duplicate') }}
                    <template #after>
                      <span class="menu-shortcut">{{ shortcuts.duplicate }}</span>
                    </template>
                  </rc-dropdown-item>

                  <rc-dropdown-item
                    :data-testid="tab.isDefaultTab ? 'table-views-export-all' : `table-views-export-${ tab.id }`"
                    @click="openExport(tab.view)"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.export.label') }}
                  </rc-dropdown-item>

                  <rc-dropdown-item
                    :class="{ selected: isDefaultTab(tab) }"
                    :data-testid="tab.isDefaultTab ? 'table-views-set-default-all' : `table-views-set-default-${ tab.id }`"
                    @click="setDefaultView(tab)"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.tab.setDefault') }}
                    <template
                      v-if="isDefaultTab(tab)"
                      #after
                    >
                      <i class="icon icon-checkmark" />
                    </template>
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
        </TransitionGroup>

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
    </div>

    <div
      v-if="part !== 'tabs'"
      class="view-controls"
    >
      <div class="query-grow query-column">
        <TableViewQueryInput
          :value="view.query"
          :fields="fields"
          :filter-fields="filterFields"
          :rows="rows"
          :field-values="fieldValues"
          @update:value="update({ query: $event })"
          @update:focused="queryFocused = $event"
          @request-values="$emit('request-values', $event)"
        />
        <!-- What the box has to say about what is in it, under the box the way the product puts
             a field's validation message under its field. `alert` rather than a `Banner`: it
             belongs to the box, not to the page.

             A query that cannot be read as written comes first and on its own - saying a field is
             unfilterable while the query also ends in `and` answers a question nobody asked yet. -->
        <p
          v-if="queryStatusMessage"
          :class="['query-notice', queryStatus]"
          role="alert"
          :data-testid="queryStatus === 'error' ? 'table-views-query-problem' : 'table-views-unsupported'"
        >
          <!-- Both marks come from the same drawn-outline set, so the two things the box can
               say about itself read as one kind of message - `icon-info` is a filled bubble and
               stood out as something else entirely beside the warning. -->
          <i
            class="icon"
            :class="queryStatus === 'error' ? 'icon-notify-warning' : 'icon-notify-info'"
          />
          <span v-clean-html="queryStatusMessage" />
        </p>
      </div>

      <!-- Single "View" popup - Group by and Columns each open their own nested dropdown
           beside the row, GitHub style.

           `shift` off, here and on both sub menus. Left on, the menus slide sideways to stay
           inside the window, so narrowing it walked them out from under the button that opened
           them while the button itself stayed put on the toolbar's own minimum. They belong to
           the button: if the window is too narrow for them, the page scrolls to them. -->
      <rc-dropdown
        :placement="'bottom-end'"
        :shift="false"
      >
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
          <div
            ref="viewMenu"
            class="menu-panel view-menu"
          >
            <!-- The View button sits at the right hand end of the toolbar, so the sub menus
                 open to the left of it rather than off screen. They are positioned against this
                 menu rather than the row that opens them: the rows are inset from its edges, and
                 a sub menu belongs alongside the menu, top with top. -->
            <rc-dropdown-item
              :close-on-click="false"
              :class="{ 'owns-sub-menu': subMenu === 'group' && subMenuHovered }"
              data-testid="table-views-view-group"
              @mouseenter="hoverSubMenu('group')"
              @mouseleave="cancelSubMenuSwitch()"
              @click="openSubMenu('group')"
            >
              {{ t('tableViews.view.groupBy') }}
              <template #after>
                <span class="menu-nav-value">{{ groupLabel }}</span>
                <i class="icon icon-chevron-right" />
              </template>
            </rc-dropdown-item>
            <rc-dropdown
              :open="subMenu === 'group'"
              :placement="'left-start'"
              :distance="-1"
              :skidding="-11"
              :flip="false"
              :shift="false"
              :reference-node="() => $refs.viewMenu"
              @update:open="(open) => closeSubMenu('group', open)"
            >
              <template #dropdownCollection>
                <div
                  class="menu-panel"
                  @mouseenter="enterSubMenu()"
                  @mouseleave="subMenuHovered = false"
                >
                  <rc-dropdown-item
                    v-for="option in groupOptions"
                    :key="option.id || 'none'"
                    :class="{ selected: option.id === view.groupBy }"
                    :close-on-click="false"
                    :data-testid="`table-views-group-${ option.id || 'none' }`"
                    @click="toggleGroupBy(option.id)"
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
                    :close-on-click="false"
                    data-testid="table-views-group-reset"
                    @click="setGroupBy(null)"
                  >
                    {{ t('tableViews.view.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown>

            <rc-dropdown-item
              :close-on-click="false"
              :class="{ 'owns-sub-menu': subMenu === 'columns' && subMenuHovered }"
              data-testid="table-views-view-columns"
              @mouseenter="hoverSubMenu('columns')"
              @mouseleave="cancelSubMenuSwitch()"
              @click="openSubMenu('columns')"
            >
              {{ t('tableViews.view.columnsConfiguration') }}
              <template #after>
                <span class="menu-nav-value">{{ columnsSummary }}</span>
                <i class="icon icon-chevron-right" />
              </template>
            </rc-dropdown-item>
            <rc-dropdown
              :open="subMenu === 'columns'"
              :placement="'left-start'"
              :distance="-1"
              :skidding="-11"
              :flip="false"
              :shift="false"
              :reference-node="() => $refs.viewMenu"
              @update:open="(open) => closeSubMenu('columns', open)"
            >
              <template #dropdownCollection>
                <div
                  ref="columnsPanel"
                  class="menu-panel columns-panel"
                  @mouseenter="enterSubMenu()"
                  @mouseleave="subMenuHovered = false"
                >
                  <!-- The list reorders live under the cursor and the rows shuffle on the
                       TransitionGroup's own FLIP move, the same way the pinned shelf does -->
                  <TransitionGroup
                    name="column-row"
                    tag="div"
                    :class="{ 'is-reordering': dragId !== null }"
                  >
                    <rc-dropdown-item
                      v-for="field in orderedColumnFields"
                      :key="field.id"
                      :class="{ 'column-row': true, locked: isCoreColumn(field), shown: isColumnVisible(field), held: dragId === field.id }"
                      :disabled="isCoreColumn(field)"
                      :close-on-click="false"
                      :data-col-id="field.id"
                      :data-testid="`table-views-col-${ field.id }`"
                      @click="toggleColumn(field)"
                    >
                      <template #before>
                        <i
                          v-if="isCoreColumn(field)"
                          v-clean-tooltip="lockedTip"
                          class="icon icon-lock column-handle"
                        />
                        <span
                          v-else
                          v-clean-tooltip="reorderTip"
                          class="column-handle grip"
                          :data-testid="`table-views-col-handle-${ field.id }`"
                          @mousedown="startColumnDrag(field.id, $event)"
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
                  </TransitionGroup>

                  <rc-dropdown-separator />
                  <rc-dropdown-item
                    :close-on-click="false"
                    data-testid="table-views-columns-select-all"
                    @click="selectAllColumns"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.columns.selectAll') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    class="menu-reset"
                    :close-on-click="false"
                    data-testid="table-views-columns-reset"
                    @click="resetColumns"
                  >
                    <template #before>
                      <i class="menu-gutter" />
                    </template>
                    {{ t('tableViews.columns.reset') }}
                  </rc-dropdown-item>
                </div>
              </template>
            </rc-dropdown>

            <rc-dropdown-separator />
            <rc-dropdown-item
              class="menu-reset"
              :close-on-click="false"
              data-testid="table-views-reset"
              @mouseenter="hoverSubMenu(null)"
              @mouseleave="cancelSubMenuSwitch()"
              @click="resetView"
            >
              {{ t('tableViews.view.reset') }}
            </rc-dropdown-item>
          </div>
        </template>
      </rc-dropdown>
    </div>
  </div>

  <!-- The same modal a resource's own Export As... action opens, which is why it no longer brings
       its own frame: there it is put up by the modal manager. -->
  <app-modal
    v-if="modal && modal.kind === 'export'"
    name="tableViewsExportModal"
    :width="640"
    height="auto"
    :trigger-focus-trap="true"
    @close="closeModal"
  >
    <TableViewExportModal
      :count="matchCount"
      :view-name="modal.view ? modal.view.name : t('tableViews.tabs.all')"
      @close="closeModal"
      @export="doExport"
    />
  </app-modal>
</template>

<style lang="scss" scoped>
// Lifting and settling, and the shuffle of whatever is going past - the same curves and timings
// the pinned shelf in the side nav uses, so a drag feels the same wherever it is done. At the top
// of the sheet because both the column rows and the view tabs are dragged, and a variable declared
// inside one selector's block cannot be seen from another's.
$drag-displace-curve: cubic-bezier(0.2, 0, 0, 1);
$drag-drop-curve: cubic-bezier(0.2, 1, 0.1, 1);

// An icon beside a label is drawn smaller than the square it occupies, so the labels sit in the
// same place whichever icon they are next to. The glyph is centred in that square both ways
// rather than left to the line box, whose metrics are the icon font's own.
@mixin toolbar-icon($box, $glyph) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: $box;
  height: $box;
  font-size: $glyph;
  line-height: 1;
}

// How narrow the toolbar is allowed to get.
//
// Two things want room, and the wider of them wins. The row itself needs the filter box at its
// own minimum (240), the gap (16) and the View button (80) - 336, without which the box carried
// on shrinking until it ran underneath the button. And the View menu needs to be able to open:
// it hangs off the button's right edge, 300 wide, with its sub menus opening another 240 to the
// left of it, and it does not flip to the other side when it runs out of room - it just goes
// under the nav, which is where the Group By list went on a narrow window.
//
// So the floor is that pair - 540, plus the 1px the menu sits inside the button's right edge,
// rounded up to the 8 the rest of the spacing works on. The table beside it already scrolls
// sideways, so there is somewhere for this to go.
//
// Written out rather than measured because the two rows of the toolbar are separate rows of the
// masthead grid, and a grid row cannot take its width from a sibling. The row that holds the box
// carries `min-content` as well, so a language with a longer word than "View" still gets a row
// wide enough - it just grows past this.
$toolbar-min-width: 544px;

.table-views {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: $toolbar-min-width;

  // Both parts are grid items in the table masthead, so they own neither the gap nor the margin
  &.part-controls,
  &.part-tabs {
    gap: 0;
    margin: 0;
    width: 100%;
  }

  // The floor for the whole toolbar. `min-content` rather than a number: it comes out as the
  // filter box at its own minimum, the gap, and the View button at whatever its label needs -
  // so it is right in every language rather than right in this one.
  //
  // Both parts are `width: 100%` of the same masthead column, so the tabs strip above takes the
  // same floor from this without being told. Without it the row kept shrinking after the box had
  // stopped, and the box carried on underneath the View button instead of the page admitting it
  // had run out of room. The table beside it already scrolls sideways, so there is somewhere for
  // this to go.
  &.part-controls .view-controls {
    flex-wrap: nowrap;
    width: 100%;
    min-width: min-content;
  }

  // Holds the rule the tabs sit on, so it runs the full width whatever the strip inside is doing
  .view-tabs-row {
    width: 100%;
    border-bottom: 1px solid var(--border);
  }

  .view-tabs {
    display: flex;
    align-items: stretch;
    gap: 24px;
    // More tabs than fit: they scroll sideways rather than running on under whatever is beside
    // them. Naming one axis leaves the other computing to `auto`, hence the explicit hidden.
    overflow-x: auto;
    overflow-y: hidden;
    // A scroll box clips whatever a tab draws outside itself, and a focus ring is drawn outside.
    // Three of room on every side, taken straight back off the outside, so the ring comes out
    // whole and the tabs sit where they always did - the bottom takes the extra 3 as well as the
    // 1 that puts an active tab's underline over the row's rule rather than a pixel above it.
    padding: 3px;
    margin: -3px -3px -4px;

    // A tab keeps its width - the strip scrolls instead of the tabs being squeezed
    > * {
      flex: none;
    }

    // A thin scrollbar rather than the platform's full width one, which would otherwise take a
    // bite out of a 33px row
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      height: 4px;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 2px;
      background: var(--scrollbar-thumb, var(--border));
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }
  }

  // The tabs themselves, inside the strip that scrolls. A box of their own so the row that
  // holds them can carry Add View too without it counting as a tab.
  .view-tabs-list {
    display: flex;
    align-items: stretch;
    gap: 24px;

    > * {
      flex: none;
    }
  }

  // Only while a tab is actually being carried. TransitionGroup's FLIP writes a transform
  // whenever the tabs look to have moved - which they do every time the strip is rebuilt, a view
  // is renamed or a count changes - so easing it the rest of the time slid the whole strip about
  // for reasons that had nothing to do with dragging.
  .view-tabs-list.is-reordering {
    cursor: grabbing;

    .view-tab-move {
      transition: transform 0.2s $drag-displace-curve;
    }

    .view-tab,
    .view-tab-caret,
    .view-tab-wrap {
      cursor: grabbing;
    }

    // The one under the pointer leads: it travels over the tabs it is passing rather than through
    // them. Lifted the same way the column picker lifts a held row - the product's own tint, a
    // little bigger, and a shadow under it - so a drag looks the same wherever it is done.
    // The same lift the app bar's pinned shelf and the column list both use, so a drag looks the
    // same wherever it is done.
    //
    // The one addition is room around the name, given back as margin so the strip does not have
    // to re-lay itself out around a tab that has grown. Those rows sit in a list and carry their
    // own padding; a tab is only as wide as its own text, and a tint drawn to that edge reads as
    // the text being selected rather than as the tab being carried.
    .view-tab-wrap.held {
      position: relative;
      z-index: 1;
      transform: scale(1.02);
      transition: transform 0.2s $drag-displace-curve;

      // The active tab's rule would otherwise run across the bottom of the tint it is now sitting in
      border-bottom-color: transparent;

      // Painted behind the tab rather than given to it as padding. Padding and a negative margin
      // leave the strip's layout alone but not the tab's own box, which started 12px further
      // left the instant it was picked up - and the move transition eased it there, which is the
      // flick you saw on grabbing. Nothing here changes the box, so there is nothing to ease.
      &::before {
        content: '';
        position: absolute;
        inset: 0 -12px;
        z-index: -1;
        border-radius: var(--border-radius);
        background: color-mix(in srgb, var(--primary) 14%, transparent);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
      }
    }
  }

  // Saying "this one, here" after the strip has run back to its start on its own. The same card a
  // dragged tab wears, pulsed once - a mark already learned rather than a new one to read.
  // Arriving at the head of the strip, drawn the way the app bar draws a cluster arriving on the
  // pinned shelf: in from the left, with a wash of the same colour draining off it. Same curves,
  // same timings, same tint - a strip that has just run back to its start is saying "this one",
  // which is the thing the shelf says when something lands on it.
  @keyframes view-tab-arrive {
    0%   { opacity: 0; transform: translateX(-6px) scale(0.985); }
    100% { opacity: 1; transform: none; }
  }

  @keyframes view-tab-wash {
    0%   { background: color-mix(in srgb, var(--primary) 15%, transparent); }
    100% { background: transparent; }
  }

  .view-tab-wrap.flash {
    position: relative;
    animation: view-tab-arrive 0.16s ease-out;

    // Behind the tab, for the same reason the held one is - a mark that moved the tab as it
    // landed would be answering "why did this move" by moving it again
    &::before {
      content: '';
      position: absolute;
      inset: 0 -12px;
      z-index: -1;
      border-radius: var(--border-radius);
      animation: view-tab-wash 0.6s ease-out;
    }
  }

  // Someone who has asked not to be moved about keeps the wash and loses the travel
  @media (prefers-reduced-motion: reduce) {
    .view-tab-wrap.flash {
      animation: none;
    }
  }

  // A tab and its caret menu, sharing one active underline
  .view-tab-wrap {
    // Dragging one would otherwise select the names it passes over
    user-select: none;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    border-bottom: 2px solid transparent;

    // The tab is the name and the chevron together - one thing to the eye, and one thing to the
    // keyboard now that the strip is a single tab stop. So the ring goes round the pair rather
    // than round whichever of them happens to hold the focus.
    //
    // Two exceptions, and both are about what the ring is for - saying where the keyboard is.
    //
    // The chevron is `tabindex="-1"`, so the keyboard never arrives on it: anything that focuses
    // it is its own menu handing focus back on the way out, which is not somewhere the user has
    // navigated to. Ringing the tab then drew a keyboard mark around a tab that had been clicked.
    //
    // And renaming: the field is its own control with a border of its own, so ringing the whole
    // tab around it drew attention to the tab rather than to the thing being typed into.
    &:has(> .view-tab:focus-visible):not(:has(.rename-input)) {
      @include focus-outline;
      outline-offset: 1px;
      border-radius: var(--border-radius);
    }

    // The wrap draws the ring for the pair, so neither half draws one of its own. Only the halves
    // inside a wrap: Add View wears the same class and has no wrap, so it keeps its own ring.
    //
    // `!important`, and `:focus` as well as `:focus-visible`: the chevron is an RcButton, whose
    // own rule (`&:focus-visible { @include focus-outline; outline-offset: 2px; }`) carries the
    // component's scope attribute and so outranks anything reachable from out here - which is
    // what put a blue ring around the chevron alone when it was clicked.
    .view-tab:focus,
    .view-tab:focus-visible,
    .view-tab-caret:focus,
    .view-tab-caret:focus-visible {
      outline: none !important;
    }

    // The same colours the tabs elsewhere in the product use: every tab reads as a link, and the
    // active one is told apart by the rule under it rather than by a colour of its own
    &.active {
      border-bottom-color: var(--active, var(--primary));

      .view-tab,
      .view-tab-caret {
        color: var(--active, var(--primary));
      }
    }
  }

  .view-tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;

    // The unsaved mark is a superscript on the name, not a bullet beside it: it sits clear above
    // the capitals rather than on the middle of the word. The 2 puts its underside a couple of
    // pixels over the cap line, which measures 10.6 down from the top of a 32 tab.
    //
    // Out of the flow, so a view with changes in it is the same width as one without - carried
    // as a flex item it took its own width plus a gap either side, and pushed the chevron 14
    // along the moment anything was typed. It sits in the gap the chevron already stands off by.
    > .unsaved-dot {
      position: absolute;
      top: 2px;
      left: 100%;
      margin-left: 1px;
    }
    // The global button rule carries a 40px min-height, which `height` alone can't get under -
    // it was making the tabs row 8px taller than the tabs in it
    min-height: 32px;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--link);
    font-size: 14px;
    line-height: 20px;
    white-space: nowrap;

    // Sits where the label was, but as a field rather than a label: it takes the spacing an input
    // has inside it, so the name being typed is not run up against its own border.
    &.rename-input {
      min-width: 60px;
      max-width: 220px;
      height: 28px;
      min-height: 28px;
      padding: 0 8px;
      border: 1px solid var(--primary);
      border-radius: var(--border-radius);
      background: var(--input-bg);
      color: var(--input-text);
      font: inherit;
      outline: none;

      // It is the thing being typed into, so it carries its own ring rather than borrowing the
      // tab's - which put a second, larger outline around a field that already has a border.
      //
      // `!important`, and written out rather than taken from the mixin, for the same reason the
      // cluster switcher's search box does it: the app's rule for text inputs
      // (`input[type="text"]:focus:not(…):not(…):not(…)`) sets `outline: none` at a specificity
      // nothing reachable from in here can beat, and the mixin no longer carries one - so the
      // ring was being declared and then thrown away. Inset by a pixel so it sits on the field's
      // own border rather than outside it.
      &:focus-visible {
        outline: 2px solid var(--primary-keyboard-focus) !important;
        outline-offset: -1px;
      }
    }

    // Standing in the tab row, it reads as a link the way the tabs beside it do
    &.new-view-tab {
      gap: 8px;
      height: 32px;
      min-height: 32px;
      padding: 0;
      color: var(--link);

      // No wrap to draw one for it, so it wears the same ring the tabs beside it wear rather
      // than the one the browser would draw by itself
      &:focus-visible {
        @include focus-outline;
        outline-offset: 1px;
        border-radius: var(--border-radius);
      }

      .icon {
        @include toolbar-icon(14px, 14px);
      }
    }
  }

  // Two classes deep on purpose: the caret is an RcButton, and `.btn-medium` sets its own
  // horizontal padding. Left alone it pads the chevron by 12 either side, which both widens the
  // gap after the name and runs the active underline past the icon.
  .view-tab-wrap .view-tab-caret {
    display: flex;
    align-items: center;
    background: transparent;
    border: none;
    cursor: pointer;
    color: var(--link);
    height: 100%;
    min-height: 32px;
    padding: 0;

    .icon {
      font-size: 12px;
    }
  }

  .view-controls {
    display: flex;
    flex-wrap: wrap;
    // To the top, not the middle. The filter box can grow a line under it, and centring had the
    // View button drift down with it - the button belongs on the box's own line, which is the
    // top of this row whether the box has anything to say or not.
    align-items: flex-start;
    gap: 16px;
  }

  .query-grow {
    flex: 1 1 auto;
  }

  // The box and anything it has to say about itself, stacked - so the notice sits under the box
  // rather than beside it in the toolbar's own row
  .query-column {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }

  // Under the box, the way the product writes a field's validation message under its field:
  // words in the colour that says how to take them, and no box of its own - a tint and a rule
  // would make one line about what was typed read like a notice about the page.
  //
  // One colour for both things the box can say, because both are the same news: what you typed
  // is not what is being answered. Written in body text the ignored-field line read as a caption
  // about the list rather than as something about the query.
  //
  // `--error` and not one of the warning colours. The warm ones the product already holds are
  // each built for a background rather than for words: `--warning` is the yellow a warning is
  // drawn on (1.26:1 over the toolbar) and `--rc-warning` is the brown written on that yellow,
  // which is the same brown in the dark theme and comes out at 1.3:1 there. This is the colour
  // the product's own validation message under a field is written in.
  .query-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--error);
    font-size: 12px;
    line-height: 16px;

    .icon {
      flex: none;
      font-size: 14px;
    }
  }

  .view-control-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    padding: 0 12px;
    white-space: nowrap;

    .icon {
      @include toolbar-icon(14px, 12px);
    }
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

// A menu is 8 clear at the top and bottom, and that 8 is the panel's own. RcDropdown's target
// gives up its own 3 and its scrolling with it: the panel scrolls itself, and the 10 the popper
// keeps is pulled back below, which leaves the panel hanging outside the target - a scroller
// there turns that into a scrollbar with 10 to travel.
.table-views :deep(.dropdownTarget) {
  padding: 0;
  overflow: visible;
}

// Content of an RcDropdown menu. RcDropdown owns the popper, this is the list inside it.
.menu-panel {
  display: flex;
  flex-direction: column;
  min-width: 240px;

  // The View menu carries a value beside each row - the field grouped by, the columns preset -
  // so it is given more room than a menu of plain commands before those values start crowding
  // the labels they sit against.
  &.view-menu {
    min-width: 300px;
  }

  // As tall as the window allows rather than a fraction of it. The popper slides a panel that
  // would hang off the bottom back up, so a cap well short of the viewport only made a panel
  // scroll while there was still room above it to move into. The 48 leaves room for the popper's
  // own padding either side of this.
  max-height: 100%;
  // Only ever downwards. Naming one axis leaves the other computing to `auto`, and a panel whose
  // width lands on a fraction is enough to raise a scrollbar along the bottom with nothing to
  // scroll to.
  overflow-x: hidden;
  overflow-y: auto;
  text-align: left;
  // The popper's own padding is the spacing. This used to cancel it with a negative margin and
  // supply its own, which made the panel render taller than the box the popper had measured - so
  // a panel pinned to the bottom of the screen bled its last 20px straight off it.
  //
  // The 3 up and down is the one exception: the panel scrolls, and a scroll box clips what a row
  // draws outside itself, which is where a focus ring goes - the top row's came out with its top
  // stroke shaved off. The margin gives the 3 straight back, so the rows stay exactly where the
  // popper's padding put them.
  margin: -3px 0;
  padding: 3px 0;

  // Nothing here restyles a menu row. Their height, padding, spacing and hover all come from
  // RcDropdownItem, so these menus are the same as the row action menu and each other - only the
  // width below is ours, so the labels have room beside the values they sit against.

  // The one exception, and it is about where you are rather than how a row looks: while the
  // pointer is inside a sub menu it is over none of the rows here, so the row that opened it
  // would go dark and the menu would stop saying which of them you are in. It keeps the same
  // highlight hovering gives, so the hand back is invisible.
  :deep([dropdown-menu-item].owns-sub-menu) {
    background-color: var(--dropdown-hover-bg);
  }

  // A row with no icon still holds the space one would take, so every label in a menu starts in
  // the same place. Not called anything with `icon-` in it: the icon font claims
  // `[class*=" icon-"]` with an !important and would set the whole row in it.
  .menu-gutter {
    display: inline-block;
    flex: none;
    width: 14px;
  }

  // The "you have unsaved changes" banner at the top of a dirty view's menu. A quiet tint, not a
  // solid block - it is telling the user where they stand, not asking them to act.
  // The dropdown pads its panel 10 top and bottom, which left the banner floating below a white
  // strip with its rounded corners nowhere near the menu's own. The panel is a scroll container,
  // so the banner can't be dragged up out of it - it is the whole panel that moves instead, which
  // costs the padding above without disturbing the padding below or anything inside.
  &.has-notice {
    // The 10 the popper pads by, plus the 3 this panel now holds for the focus rings
    margin-top: -13px;
  }

  .menu-notice {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 40px;
    margin: 0 0 8px;
    // Sitting in the menu's top corners, it takes their rounding with them
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
    padding: 0 17px;
    // Mixed from the live token rather than `--accent-btn`: that is compiled from the scss
    // palette, so it stayed Rancher blue on a Prime install where everything around it is green.
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    color: var(--body-text);
    font-size: 13px;

    // The dot stands in the icons' column, so the notice reads off the same left edge as the
    // rows below it. A transparent border widens the box without growing the dot itself.
    .unsaved-dot {
      box-sizing: content-box;
      border: 5px solid transparent;
      background-clip: content-box;
    }
  }

  .menu-shortcut {
    margin-left: auto;
    padding-left: 24px;
    color: var(--dropdown-secondary-text);
    font-size: 12px;
    white-space: nowrap;
  }

  // A focus ring is drawn on the row's own box, so anything painted after it covers its edge -
  // the tint the row below takes under the cursor, most visibly. The focused row rises over them.
  [dropdown-menu-item]:focus-visible {
    position: relative;
    z-index: 1;
  }

  // What a row that opens a sub menu carries at its end: where that sub menu stands, and the
  // arrow into it. The row itself is an ordinary menu item and is left to the component.
  // The value a sub menu row shows at its end. Styled on itself rather than on the slot holding
  // it, so nothing the dropdown owns is redefined here.
  .menu-nav-value {
    color: var(--muted);
    max-width: 150px;
    margin-right: 8px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  // What is currently in force, marked the way the selected tab is. `--active` rather than
  // `--info`: an alert severity does not follow the brand, so it stayed Rancher blue on a Prime
  // install where everything around it had gone green - and it has no dark theme value of its own.
  [dropdown-menu-item].selected {
    color: var(--active, var(--primary));
  }


  // TransitionGroup's own FLIP move. Re-timed only while a drag is actually in progress, so the
  // rows travel with the held one rather than teleporting into their new slots.
  // Only while a row is actually being carried.
  //
  // TransitionGroup's move is FLIP: it compares where a row was with where it is and animates the
  // difference. The popper is positioned after its contents have mounted, so on opening every row
  // had "moved" by the width of the panel and slid in from the right - an animation of the menu
  // arriving, which is not what the reordering is for. Nothing is being reordered then, so there
  // is nothing to animate.
  .is-reordering .column-row-move {
    transition: transform 0.2s $drag-displace-curve;
  }

  // A row is being carried, so the pointer says so over the whole list - the rows' own `pointer`
  // would otherwise take over the moment the cursor crossed one
  .is-reordering {
    cursor: grabbing;

    [dropdown-menu-item],
    [dropdown-menu-item]:hover,
    .column-handle {
      cursor: grabbing;
    }
  }

  // A row's transform is worth easing only while one is actually being carried. TransitionGroup's
  // FLIP writes a transform whenever the rows look to have moved, and the popper being positioned
  // after its contents mount looks exactly like that - so easing it here slid every row in from the
  // right each time the menu opened. Held rows keep their own timing, set below.
  .is-reordering .column-row {
    transition: background-color 0.1s ease-in-out, transform 0.33s $drag-drop-curve, box-shadow 0.33s $drag-drop-curve;
  }

  // Column rows carry a drag handle (or a lock) and tick only what is shown
  .column-row {
    transition: background-color 0.1s ease-in-out;
    user-select: none;
    .column-handle {
      font-size: 14px;
      cursor: grab;
    }

    // The grip is furniture, so it stays neutral. The lock is not - it belongs to the column it
    // is locking, and takes that row's colour.
    .grip {
      color: var(--muted);
    }

    // Two short bars - the handle that says a row can be dragged. Drawn rather than taken from
    // the icon font, which has no grip glyph.
    .grip {
      position: relative;
      display: inline-block;
      // The width the lock icon beside it takes, so a draggable row and a locked one start their
      // label in the same place. The bars keep their own width inside it.
      width: 14px;
      height: 12px;

      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 1px;
        right: 1px;
        height: 1.5px;
        border-radius: 1px;
        background: currentColor;
      }

      &::before { top: 3.5px; }
      &::after { top: 7px; }
    }

    &.shown {
      color: var(--active, var(--primary));
    }

    // A locked column is shown and cannot be turned off, so it reads as the same colour the other
    // shown ones do, only fainter. Grey said "off", when the column is very much on - it is the
    // switch that is unavailable, not the column. Mixed from the same token so it follows the
    // brand with the rest of them, at the half strength the design draws the whole row in - lock,
    // name and tick together, all off one inherited colour.
    &.locked {
      color: color-mix(in srgb, var(--active, var(--primary)) 50%, transparent);
      cursor: default;

      .column-handle { cursor: default; }
    }

    // The row being carried, lifted off the list the way a dragged shelf row is
    // Lifted exactly the way the app bar's pinned shelf lifts a row it is carrying - the same
    // tint, scale, shadow and timings - so a drag looks the same everywhere in the product.
    &.held {
      position: relative;
      z-index: 1;
      background: color-mix(in srgb, var(--primary) 14%, transparent);
      transform: scale(1.02);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
      transition: transform 0.2s $drag-displace-curve, box-shadow 0.2s $drag-displace-curve, background-color 0.2s $drag-displace-curve;
    }
  }
}
</style>

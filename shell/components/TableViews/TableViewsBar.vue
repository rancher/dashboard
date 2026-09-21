<script>
import { mapPref, TABLE_VIEWS } from '@shell/store/prefs';
import { randomStr } from '@shell/utils/string';
import { isCoreField } from '@shell/utils/table-views';
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
      pickedViewId:   undefined,
      /**
       * Unsaved edits, per tab, for as long as the page is open. Leaving a tab with changes on it
       * holds on to them so coming back finds them where they were, and the tab keeps its mark
       * while you are elsewhere. A reload is where they end - nothing here is written down.
       */
      drafts:         {},
      /** Which modal is open, if any: { kind: 'new' | 'export', view } */
      modal:          null,
      /**
       * Which sub menu of the View menu is open - 'group', 'columns', or null. A menu item has
       * no trigger of its own, so the row that opens one says so here and the menu takes its
       * open state from it.
       */
      subMenu:        null,
      /** Name being typed in the new view modal */
      modalName:      '',
      /** id of the view being renamed in place, and the name being typed for it */
      renamingId:     null,
      renameDraft:    '',
      /**
       * Column picker drag. `dragId` is the row being held; `dragOrder` is the ids in the order
       * the list is showing them mid-drag, which is what lets the rows shuffle under the cursor
       * instead of waiting for the drop. `dragSlots` are the places the rows sat when the drag
       * began - see captureColumnSlots for why they are taken once rather than read live.
       */
      dragId:         null,
      dragOrder:      null,
      dragMoved:      false,
      dragFrom:       null,
      dragPointerY:   0,
      dragSlots:      null,
      dragStartOrder: null,
    };
  },

  watch: {
    tabQueries: {
      handler(queries) {
        this.$emit('tab-queries', queries);
      },
      immediate: true,
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
    this.endColumnDrag(false);
  },

  computed: {
    allSavedViews: mapPref(TABLE_VIEWS),

    /** What the toolbar says about the part of the query that could not be run */
    unsupportedNotice() {
      return this.t('tableViews.query.unsupported', {
        count:  this.unsupportedFields.length,
        fields: this.unsupportedFields.join(', '),
      }, true);
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
      const masthead = this.$refs.root?.closest?.('.fixed-header-actions');

      if (!masthead || !target?.closest) {
        return false;
      }

      return target.closest('.fixed-header-actions') === masthead;
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

    selectAllColumns() {
      this.update({ columns: this.columnFields.map((f) => f.id) });
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

      while (i < order.length && isCoreField(order[i])) {
        i++;
      }

      return i;
    },

    /** Put the held row where the pointer is, so the rest shuffle around it as it travels */
    placeDraggedColumn() {
      const order = [...this.dragOrder];
      const from = order.indexOf(this.dragId);
      const at = this.columnIndexAt(this.dragPointerY);

      if (from === -1 || at === -1) {
        return;
      }

      const to = Math.max(at, this.firstMovableIndex(order));

      if (from === to) {
        return;
      }

      order.splice(to, 0, ...order.splice(from, 1));
      this.dragOrder = order;
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
        // The click that follows this mouseup would land on whichever row the pointer ended over,
        // toggling it. A drag is not a click, so it is swallowed.
        const swallow = (event) => {
          event.stopPropagation();
          event.preventDefault();
        };

        window.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', swallow, true), 0);
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
    },

    /** The first is just the name; the ones after it are numbered from one */
    nextNewViewName() {
      const base = this.t('tableViews.tab.newViewName');
      let name = base;
      let n = 1;

      while (this.savedViews.find((v) => v.name === name)) {
        name = `${ base } ${ n++ }`;
      }

      return name;
    },

    /**
     * A sub menu closing itself - a click outside it, Escape, picking something - is what takes
     * the row out of the open state the click put it in.
     *
     * A menu normally hands focus back to the button that opened it, and this one has no button:
     * it is opened by a row of the menu above. So the row takes focus back, leaving the keyboard
     * where it was rather than at the top of the page.
     */
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
    confirmName() {
      this.saveView();
      this.closeModal();
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
    },

    /** Is this the tab the list opens on? With nothing set, that is the default tab */
    isDefaultTab(tab) {
      return tab.isDefaultTab ? !this.defaultViewId : this.defaultViewId === tab.view?.id;
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
        id: randomStr(8),
        name,
        ...this.viewToSave,
      };

      this.persist(this.savedViews.filter((v) => v.name !== name).concat([view]));
      this.pickedViewId = view.id;
    },

    updateView(saved) {
      this.persist(this.savedViews.map((v) => (v.id === saved.id ? { ...v, ...this.viewToSave } : v)));
    },

    deleteView(saved) {
      const wasSelected = this.selectedViewId === saved.id;

      this.persist(this.savedViews.filter((v) => v.id !== saved.id));
      this.forgetDraft(saved.id);

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

      // Anywhere in this table's toolbar counts, the filter box included - saving the view is
      // what ⌘S means while you are working on one, whether you are typing its query or not.
      // Somewhere else on the page that takes text does not: ⌘S there belongs to whatever the
      // user is writing in.
      if (!this.ownsTarget(event.target)) {
        const tag = (event.target?.tagName || '').toLowerCase();

        if (tag === 'input' || tag === 'textarea' || event.target?.isContentEditable) {
          return;
        }
      }

      const match = SHORTCUTS.find((s) => s.key === event.key.toLowerCase() && s.shift === event.shiftKey);

      if (!match) {
        return;
      }

      event.preventDefault();
      this[match.method]();
    },

    doExport(format) {
      this.$emit('export', { format });
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
      <div class="view-tabs">
        <div
          v-for="tab in tabs"
          :key="tab.id || 'all'"
          :ref="`tab-wrap-${ tab.id }`"
          class="view-tab-wrap"
          :class="{ active: selectedViewId === tab.id }"
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

          <!-- The menu belongs to the whole tab, not to the chevron that opens it, so it is
               positioned against the tab: flush with the start of the name and 9 below the line the
               tab draws under itself. -->
          <rc-dropdown
            :placement="'bottom-start'"
            :distance="9"
            :reference-node="() => tabWrap(tab)"
          >
            <rc-dropdown-trigger
              variant="link"
              class="view-tab-caret"
              :aria-label="t('tableViews.tab.menu')"
              :data-testid="tab.isDefaultTab ? 'table-views-tab-menu-all' : `table-views-tab-menu-${ tab.id }`"
            >
              <i class="icon icon-chevron-down" />
            </rc-dropdown-trigger>
            <template #dropdownCollection>
              <div :class="['menu-panel', 'has-icons', { 'has-notice': isTabDirty(tab) }]">
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
                      <span class="menu-shortcut">{{ t('tableViews.shortcut.save') }}</span>
                    </template>
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    data-testid="table-views-save-as-new"
                    @click="openSaveAsNew()"
                  >
                    <template #before>
                      <i class="icon" />
                    </template>
                    {{ t('tableViews.view.saveAsNew') }}
                    <template #after>
                      <span class="menu-shortcut">{{ t('tableViews.shortcut.saveAsNew') }}</span>
                    </template>
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    data-testid="table-views-discard"
                    @click="discardChanges()"
                  >
                    <template #before>
                      <i class="icon" />
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
                    <span class="menu-shortcut">{{ t('tableViews.shortcut.duplicate') }}</span>
                  </template>
                </rc-dropdown-item>

                <rc-dropdown-item
                  :data-testid="tab.isDefaultTab ? 'table-views-export-all' : `table-views-export-${ tab.id }`"
                  @click="openExport(tab.view)"
                >
                  <template #before>
                    <i class="icon" />
                  </template>
                  {{ t('tableViews.export.label') }}
                </rc-dropdown-item>

                <rc-dropdown-item
                  :class="{ selected: isDefaultTab(tab) }"
                  :data-testid="tab.isDefaultTab ? 'table-views-set-default-all' : `table-views-set-default-${ tab.id }`"
                  @click="setDefaultView(tab)"
                >
                  <template #before>
                    <i class="icon" />
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
          :rows="rows"
          :field-values="fieldValues"
          @update:value="update({ query: $event })"
          @request-values="$emit('request-values', $event)"
        />
        <!-- A query that names something this list cannot be filtered by is answered without
             that part of it. Saying so beats a table that quietly disagrees with what is in the
             box. `alert` rather than a `Banner`: it belongs to the box, under it, not to the page. -->
        <p
          v-if="unsupportedFields.length"
          v-clean-html="unsupportedNotice"
          class="query-unsupported"
          role="alert"
          data-testid="table-views-unsupported"
        />
      </div>

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
              data-testid="table-views-view-group"
              @mouseenter="subMenu = 'group'"
              @click="subMenu = 'group'"
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
              :skidding="-1"
              :shift="false"
              :flip="false"
              :reference-node="() => $refs.viewMenu"
              @update:open="(open) => closeSubMenu('group', open)"
            >
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

            <rc-dropdown-item
              :close-on-click="false"
              data-testid="table-views-view-columns"
              @mouseenter="subMenu = 'columns'"
              @click="subMenu = 'columns'"
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
              :skidding="-1"
              :shift="false"
              :flip="false"
              :reference-node="() => $refs.viewMenu"
              @update:open="(open) => closeSubMenu('columns', open)"
            >
              <template #dropdownCollection>
                <div
                  ref="columnsPanel"
                  class="menu-panel columns-panel"
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
                    {{ t('tableViews.columns.selectAll') }}
                  </rc-dropdown-item>
                  <rc-dropdown-item
                    class="menu-reset"
                    :close-on-click="false"
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
              @mouseenter="subMenu = null"
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
    v-if="modal && modal.kind === 'new'"
    name="tableViewsModal"
    :width="420"
    height="auto"
    :trigger-focus-trap="true"
    data-testid="table-views-modal"
    @close="closeModal"
  >
    <div class="view-modal">
      <h4>
        {{ t('tableViews.save.newView') }}
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
    // Takes the strip down over the row's rule, so an active tab's underline covers it rather
    // than sitting a pixel above it
    margin-bottom: -1px;

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

  // A tab and its caret menu, sharing one active underline
  .view-tab-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 32px;
    border-bottom: 2px solid transparent;

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
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;
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
    }

    // Standing in the tab row, it reads as a link the way the tabs beside it do
    &.new-view-tab {
      gap: 8px;
      height: 32px;
      min-height: 32px;
      padding: 0;
      color: var(--link);

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
    align-items: center;
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

  // Coloured the way the product's warning banner is: the warning is carried by the tint and the
  // rule beside it, and the words stay body text. `--warning` is a pale background yellow - set on
  // 12px text over white it came out at 1.26:1, which is not readable.
  .query-unsupported {
    margin: 0;
    padding: 4px 8px;
    border-left: 2px solid var(--warning);
    background: var(--warning-banner-bg);
    color: var(--warning-banner-text, var(--body-text));
    font-size: 12px;
    line-height: 16px;
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

  max-height: 60vh;
  // Only ever downwards. Naming one axis leaves the other computing to `auto`, and a panel whose
  // width lands on a fraction is enough to raise a scrollbar along the bottom with nothing to
  // scroll to.
  overflow-x: hidden;
  overflow-y: auto;
  text-align: left;
  // Takes back the padding the popper keeps, so the panel's own 8 is what shows
  margin: -10px 0;
  padding: 8px 0;

  [dropdown-menu-item] {
    height: 33px;
    padding-top: 0;
    padding-bottom: 0;

    // The row under the cursor takes the tint a row of the table takes, rather than the heavier
    // one dropdowns use elsewhere: these menus read as a list of rows like the table below them.
    &:hover {
      background-color: var(--sortable-table-hover-bg);
    }
  }

  // The icons in this menu get a column to themselves, so every label starts in the same place.
  // A row with nothing to show there carries a blank `.icon` to hold it rather than the rule
  // picking those rows out, so the column does not depend on `:has`. The columns panel is left
  // out: its handles already hold that column.
  // The class cannot be called `icon-column`: the icon font claims `[class*=" icon-"]` with an
  // !important, and would set the whole menu in it.
  &.has-icons [dropdown-menu-item] {
    > .icon {
      @include toolbar-icon(16px, 14px);
    }

  }

  hr {
    margin: 8px 0;
  }

  .menu-title {
    padding: 6px 17px 2px 17px;
    font-size: 11px;
    text-transform: uppercase;
    opacity: 0.6;
  }

  // The "you have unsaved changes" banner at the top of a dirty view's menu. A quiet tint, not a
  // solid block - it is telling the user where they stand, not asking them to act.
  // It runs to the very top of the menu, so the menu gives up its own 8 above rather than the
  // banner pulling itself up over it: the panel scrolls, and a scroll container clips whatever is
  // dragged above its top padding edge.
  &.has-notice {
    padding-top: 0;
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
    background: var(--accent-btn);
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
  .dropdown-item-after {
    gap: 8px;

    .menu-nav-value {
      color: var(--muted);
      max-width: 150px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // Blue marks what is currently in force, the same way the shown columns are marked
  [dropdown-menu-item].selected {
    color: var(--info);
  }


  // Lifting and settling, and the shuffle of the rows going past - the same curves and timings the
  // pinned shelf in the side nav uses, so a drag feels the same wherever it is done
  $drag-displace-curve: cubic-bezier(0.2, 0, 0, 1);
  $drag-drop-curve: cubic-bezier(0.2, 1, 0.1, 1);

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
      color: var(--info);
    }

    &.locked {
      color: var(--muted);
      cursor: default;

      .column-handle { cursor: default; }
    }

    // The row being carried, lifted off the list the way a dragged shelf row is
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

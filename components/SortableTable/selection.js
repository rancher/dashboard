import $ from 'jquery';
import { isMore, isRange } from '@/utils/platform';
import { get } from '@/utils/object';

export const ALL = 'all';
export const SOME = 'some';
export const NONE = 'none';

export default {
  created() {
    this.$store.commit('selection/setTable', {
      table:          this.pagedRows,
      clearSelection: true,
    });
  },

  mounted() {
    const $table = $('> TABLE', this.$el);

    this._onRowClickBound = this.onRowClick.bind(this);
    this._onRowMousedownBound = this.onRowMousedown.bind(this);
    this._onRowContextBound = this.onRowContext.bind(this);

    $table.on('click', '> TBODY > TR', this._onRowClickBound);
    $table.on('mousedown', '> TBODY > TR', this._onRowMousedownBound);
    $table.on('contextmenu', '> TBODY > TR', this._onRowContextBound);
  },

  beforeDestroy() {
    const $table = $('> TABLE', this.$el);

    $table.off('click', '> TBODY > TR', this._onRowClickBound);
    $table.off('mousedown', '> TBODY > TR', this._onRowMousedownBound);
    $table.off('contextmenu', '> TBODY > TR', this._onRowContextBound);
  },

  computed: {
    selectedNodes() {
      return this.$store.getters['selection/tableSelected'];
    },

    howMuchSelected() {
      const total = this.pagedRows.length;
      const selected = this.selectedNodes.length;

      if ( selected >= total ) {
        return ALL;
      } else if ( selected > 0 ) {
        return SOME;
      }

      return NONE;
    },
  },

  data: () => ({ prevNode: null }),

  methods: {
    onToggleAll(value) {
      if ( value ) {
        this.toggleMulti(this.pagedRows, []);

        return true;
      } else {
        this.toggleMulti([], this.pagedRows);

        return false;
      }
    },

    onRowMousedown(e) {
      if ( isRange(e) || e.target.tagName === 'INPUT' ) {
        e.preventDefault();
      }
    },

    nodeForEvent(e) {
      const tagName = e.target.tagName;
      const tgt = $(e.target);
      const actionElement = tgt.closest('.actions')[0];
      const content = this.pagedRows;

      if ( !actionElement ) {
        if (
          tagName === 'A' ||
          tagName === 'BUTTON' ||
          tgt.parents('.btn').length
        ) {
          return;
        }
      }

      let tgtRow = $(e.currentTarget);

      if ( tgtRow.hasClass('separator-row') || tgt.hasClass('select-all-check')) {
        return;
      }

      while ( tgtRow && tgtRow.length && !tgtRow.hasClass('main-row') ) {
        tgtRow = tgtRow.prev();
      }

      if ( !tgtRow || !tgtRow.length ) {
        return;
      }

      const check = tgtRow.find('input[type="checkbox"]');
      const nodeId = check.data('node-id');

      if ( !nodeId || !check || !check.length || check[0].disabled ) {
        return;
      }

      const node = content.find( x => get(x, this.keyField) === nodeId );

      return node;
    },

    onRowClick(e) {
      const node = this.nodeForEvent(e);
      const tgt = $(e.target);
      const tagName = e.target.tagName;
      const selection = this.selectedNodes;
      const isCheckbox = tagName === 'INPUT' || tgt.hasClass('row-check');
      const content = this.pagedRows;

      if ( !node ) {
        return;
      }

      const actionElement = $(e.target).closest('.actions')[0];

      if ( actionElement ) {
        this.$store.commit('selection/show', {
          resources: node,
          elem:      actionElement
        });

        return;
      }

      const isSelected = selection.includes(node);
      let prevNode = this.prevNode;

      // PrevNode is only valid if it's in the current content
      if ( !prevNode || !content.includes(prevNode) ) {
        prevNode = node;
      }

      if ( isMore(e) ) {
        this.toggleSingle(node);
      } else if ( isRange(e) ) {
        const toToggle = this.nodesBetween(prevNode, node);

        if ( isSelected ) {
          this.toggleMulti([], toToggle);
        } else {
          this.toggleMulti(toToggle, []);
        }
      } else if ( isCheckbox ) {
        this.toggleSingle(node);
      } else {
        this.toggleMulti([node], content);
      }

      this.prevNode = node;
    },

    onRowContext(e) {
      const node = this.nodeForEvent(e);

      if ( !node ) {
        return;
      }

      e.preventDefault();

      this.prevNode = node;
      const isSelected = this.selectedNodes.includes(node);

      if ( !isSelected ) {
        this.toggleMulti([node], this.selectedNodes.slice());
      }

      this.$store.commit('selection/show', {
        resources: this.selectedNodes,
        event:     e.originalEvent,
      });
    },

    nodesBetween(a, b) {
      let toToggle = [];
      const key = this.groupBy;

      if ( key ) {
        // Grouped has 2 levels to look through
        const grouped = this.groupedRows;

        let from = this.groupIdx(a);
        let to = this.groupIdx(b);

        if ( !from || !to ) {
          return [];
        }

        // From has to come before To
        if ( (from.group > to.group) || ((from.group === to.group) && (from.item > to.item)) ) {
          [from, to] = [to, from];
        }

        for ( let i = from.group ; i <= to.group ; i++ ) {
          const items = grouped[i].rows;
          let j = (from.group === i ? from.item : 0);

          while ( items[j] && ( i < to.group || j <= to.item )) {
            toToggle.push(items[j]);
            j++;
          }
        }
      } else {
        // Ungrouped is much simpler
        const content = this.pagedRows;
        let from = content.indexOf(a);
        let to = content.indexOf(b);

        [from, to] = [Math.min(from, to), Math.max(from, to)];
        toToggle = content.slice(from, to + 1);
      }

      return toToggle;
    },

    groupIdx(node) {
      const grouped = this.groupedRows;

      for ( let i = 0 ; i < grouped.length ; i++ ) {
        const rows = grouped[i].rows;

        for ( let j = 0 ; j < rows.length ; j++ ) {
          if ( rows[j] === node ) {
            return {
              group: i,
              item:  j
            };
          }
        }
      }

      return null;
    },

    toggleSingle(node) {
      this.$store.commit('selection/toggleSingle', node);
    },

    toggleMulti(toAdd, toRemove) {
      this.$store.commit('selection/toggleMulti', { toAdd, toRemove });

      if (toRemove.length) {
        this.$nextTick(() => {
          for ( let i = 0 ; i < toRemove.length ; i++ ) {
            this.toggleInput(toRemove[i], false, this.keyField);
          }
        });
      }

      if (toAdd.length) {
        this.$nextTick(() => {
          for ( let i = 0 ; i < toAdd.length ; i++ ) {
            this.toggleInput(toAdd[i], true, this.keyField);
          }
        });
      }
    },

    toggleInput(node, on, idField) {
      const id = get(node, idField);

      if ( id ) {
        const input = $(`input[data-node-id="${ id }"]`);

        if ( input && input.length && !input[0].disabled ) {
          // can't reuse the input ref here because the table has rerenderd and the ref is no longer good
          $(`input[data-node-id="${ id }"]`).prop('checked', on);

          let tr = $(`input[data-node-id="${ id }"]`).closest('tr');
          let first = true;

          while ( tr && (first || tr.hasClass('sub-row') ) ) {
            tr.toggleClass('row-selected', on);
            tr = tr.next();
            first = false;
          }
        }
      }
    },

    applyTableAction(action, args) {
      this.$store.dispatch('selection/executeTable', { action, args });
    }
  },

  watch: {
    pagedRows: {
      handler(nowNodes, beforeNodes) {
        this.$store.commit('selection/setTable', { table: this.pagedRows });
      },
    }
  }
};

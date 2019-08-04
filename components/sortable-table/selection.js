import $ from 'jquery';
import { isMore, isRange } from '@/utils/platform';
import { addObjects, removeObjects } from '@/utils/array';
import { get } from '@/utils/object';

export const ALL = 'all';
export const SOME = 'some';
export const NONE = 'none';

export default {
  mounted() {
    const $table = $('> TABLE', this.$el);

    this._onRowClickBound = this.onRowClick.bind(this);
    this._onRowMousedownBound = this.onRowMousedown.bind(this);

    $table.on('click', '> TBODY > TR', this._onRowClickBound);
    $table.on('mousedown', '> TBODY > TR', this._onRowMousedownBound);
  },

  beforeDestroy() {
    const $table = $('> TABLE', this.$el);

    $table.off('click', '> TBODY > TR', this._onRowClickBound);
    $table.off('mousedown', '> TBODY > TR', this._onRowMousedownBound);
  },

  computed: {
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

  data: () => ({
    selectedNodes: [],
    prevNode:      null,
  }),

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

    onRowClick(e) {
      const tagName = e.target.tagName;
      const tgt = $(e.target);

      if ( tagName === 'A' ||
           tagName === 'BUTTON' ||
           tgt.parents('.btn').length
      ) {
        return;
      }

      const content = this.pagedRows;
      const selection = this.selectedNodes;
      const isCheckbox = tagName === 'INPUT' || tgt.hasClass('row-check');
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

      const nodeId = tgtRow.find('input[type="checkbox"]').data('node-id');

      if ( !nodeId ) {
        return;
      }

      const node = content.find( x => get(x, this.keyField) === nodeId );

      if ( !node ) {
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
          const items = grouped[i].items;
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
        const items = grouped[i].items;

        for ( let j = 0 ; j < items.length ; j++ ) {
          if ( items[j] === node ) {
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
      if ( this.selectedNodes.includes(node) ) {
        this.toggleMulti([], [node]);
      } else {
        this.toggleMulti([node], []);
      }
    },

    toggleMulti(nodesToAdd, nodesToRemove) {
      const selectedNodes = this.selectedNodes;

      if (nodesToRemove.length) {
        removeObjects(selectedNodes, nodesToRemove);
        this.$nextTick(() => {
          for ( let i = 0 ; i < nodesToRemove.length ; i++ ) {
            this.toggleInput(nodesToRemove[i], false, this.keyField);
          }
        });
      }

      if (nodesToAdd.length) {
        addObjects(selectedNodes, nodesToAdd);
        this.$nextTick(() => {
          for ( let i = 0 ; i < nodesToAdd.length ; i++ ) {
            this.toggleInput(nodesToAdd[i], true, this.keyField);
          }
        });
      }
    },

    toggleInput(node, on, idField) {
      const id = get(node, idField);

      if ( id ) {
        const input = $(`input[data-node-id="${ id }"]`);

        if ( input && input.length ) {
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
  },

  watch: {
    pagedRows: {
      handler(nowNodes, beforeNodes) {
        const toRemove = [];
        const selectedNodes = this.selectedNodes;

        for ( let i = 0 ; i < selectedNodes.length ; i++ ) {
          const cur = selectedNodes[i];

          if ( !nowNodes.includes(cur) ) {
            toRemove.push(cur);
          }
        }

        this.toggleMulti([], toRemove);
      },
    }
  }
};

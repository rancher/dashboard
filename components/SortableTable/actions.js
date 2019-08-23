import { filterBy } from '@/utils/array';

export default {
  computed: {
    availableActions() {
      if ( !this.tableActions ) {
        return;
      }

      let selected = this.selectedNodes;
      let disableAll = false;

      if ( !selected.length ) {
        const firstNode = this.pagedRows[0];

        if ( firstNode ) {
          selected = [firstNode];
        }

        disableAll = true;
      }

      const map = {};

      for ( const node of this.pagedRows ) {
        for ( const act of node.availableActions ) {
          add(act, false);
        }
      }

      for ( const node of selected ) {
        for ( const act of node.availableActions ) {
          add(act);
        }
      }

      const out = filterBy(Object.values(map), 'anyEnabled', true);

      for ( const act of out ) {
        if ( disableAll ) {
          act.enabled = false;
        } else {
          act.enabled = ( act.available >= act.total );
        }
      }

      return out;

      function add(act, incrementCounts = true) {
        if ( !act.bulkable ) {
          return;
        }

        let obj = map[act.action];

        if ( !obj ) {
          obj = Object.assign({}, act);
          map[act.action] = obj;
        }

        if ( act.enabled !== false ) {
          obj.anyEnabled = true;
        }

        if ( incrementCounts ) {
          obj.available = (obj.available || 0) + (act.enabled === false ? 0 : 1 );
          obj.total = (obj.total || 0) + 1;
        }

        return obj;
      }
    },
  },

  methods: {
    applyTableAction(act, ...args) {
      const nodes = this.selectedNodes;

      if ( nodes.length > 1 && act.bulkAction ) {
        const fn = nodes[0][act.bulkAction];

        if ( fn ) {
          return fn.call(nodes[0], nodes, ...args);
        }
      }

      for ( const node of nodes ) {
        const fn = node[act.action];

        if ( fn ) {
          return fn.apply(node, args);
        }
      }

      throw new Error(`Unknown action: ${ act }`);
    }
  }
};

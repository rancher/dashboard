/* eslint-disable no-console */

// =========================================================================================
// Debug helper
// Adds a bunch of watches to help dignose computed properties bring re-evaluated
// =========================================================================================

export default {
  watch: {
    sortFields(neu, old) {
      debug.log('sortFields changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    descending(neu, old) {
      debug.log('descending changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    rows(neu, old) {
      debug.log('rows changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);

      // debug.log('Checking rows');

      // let diff = 0;

      // for (let i=0;i<neu.length;i++) {
      //   const a = JSON.stringify(neu[i]);
      //   const b = JSON.stringify(old[i]);

      //   if (a !== b) {
      //     debug.log('rows differ ' + i);
      //     diff++;
      //   }
      // }

      // debug.log(diff + ' rows changed');
    },

    pagingDisplay(neu, old) {
      debug.log('pagingDisplay changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    totalPages(neu, old) {
      debug.log('totalPages changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    pagedRows(neu, old) {
      debug.log('pagedRows changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    arrangedRows(neu, old) {
      debug.log('arrangedRows changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    searchFields(neu, old) {
      debug.log('searchFields changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    filteredRows(neu, old) {
      debug.log('filteredRows changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    groupedRows(neu, old) {
      debug.log('groupedRows changed ------------------------------------------------');
      debug.log(neu.length);
      debug.log(old.length);
    },

    headers(neu, old) {
      debug.log('headers changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    displayRows(neu, old) {
      debug.log('displayRows changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    groupBy(neu, old) {
      debug.log('groupBy changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    groupSort(neu, old) {
      debug.log('groupSort changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },

    columns(neu, old) {
      debug.log('columns changed ------------------------------------------------');
      debug.log(neu);
      debug.log(old);
    },
  }
};
/* eslint-enable no-console */

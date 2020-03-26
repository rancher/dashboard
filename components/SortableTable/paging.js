import { mapPref, ROWS_PER_PAGE } from '@/store/prefs';

export default {
  computed: {
    perPage: mapPref(ROWS_PER_PAGE),

    indexFrom() {
      return Math.max(0, 1 + this.perPage * (this.page - 1));
    },

    indexTo() {
      return Math.min(this.arrangedRows.length, this.indexFrom + this.perPage - 1);
    },

    totalPages() {
      return Math.ceil(this.arrangedRows.length / this.perPage );
    },

    showPaging() {
      return this.paging && this.totalPages > 1;
    },

    pagingDisplay() {
      const opt = {
        ...(this.pagingParams || {}),

        count: this.arrangedRows.length,
        pages: this.totalPages,
        from:  this.indexFrom,
        to:    this.indexTo,
      };

      return this.$store.getters['i18n/t'](this.pagingLabel, opt);
    },

    pagedRows() {
      if ( this.paging ) {
        return this.arrangedRows.slice(this.indexFrom, this.indexTo);
      } else {
        return this.arrangedRows;
      }
    }
  },

  data: () => ({ page: 1 }),

  methods: {
    goToPage(which) {
      switch (which) {
      case 'first':
        this.page = 1;
        break;
      case 'prev':
        this.page = Math.max(1, this.page - 1 );
        break;
      case 'next':
        this.page = Math.min(this.totalPages, this.page + 1 );
        break;
      case 'last':
        this.page = this.totalPages;
        break;
      }
    }
  }
};

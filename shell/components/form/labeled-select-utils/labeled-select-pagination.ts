import { debounce } from 'lodash';
import { PropType, defineComponent } from 'vue';
import { LabelSelectPaginateFn, LABEL_SELECT_NOT_OPTION_KINDS, LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';

/**
 * 'mixin' to provide pagination support to LabeledSelect
 */
export default defineComponent({
  props: {
    paginate: {
      default: null,
      type:    Function as PropType<LabelSelectPaginateFn>,
    },

    inStore: {
      type:    String,
      default: 'cluster',
    },

    /**
     * Resource to show
     */
    resourceType: {
      type:    String,
      default: null,
    },
  },

  data() {
    return {
      // Internal
      currentPage: 1,
      search:      '',
      pageSize:    10,
      pages:       0,

      debouncedRequestPagination: debounce(this.requestPagination, 700),

      // External
      page:         [] as any[],
      totalResults: 0,
      paginating:   false,
    };
  },

  async mounted() {
    if (this.canPaginate) {
      await this.requestPagination();
    }
  },

  computed: {
    canPaginate() {
      return !!this.paginate && !!this.resourceType && this.$store.getters[`${ this.inStore }/paginationEnabled`](this.resourceType);
    },

    canLoadMore() {
      return this.pages > this.currentPage;
    },

    optionsInPage() {
      // Number of genuine options (not groups, dividers, etc)
      return this.canPaginate ? this._options.filter((o: any) => {
        return o.kind !== LABEL_SELECT_KINDS.NONE && !LABEL_SELECT_NOT_OPTION_KINDS.includes(o.kind);
      }).length : 0;
    },

    optionCounts() {
      if (!this.canPaginate || this.optionsInPage === this.totalResults) {
        return '';
      }

      return this.$store.getters['i18n/t']('labelSelect.pagination.counts', {
        count:      this.optionsInPage,
        totalCount: this.totalResults
      });
    },
  },

  methods: {
    loadMore() {
      this.currentPage++;
      this.requestPagination();
    },

    setPaginationFilter(filter: string) {
      this.paginating = true; // Do this before debounce
      this.currentPage = 1;
      this.search = filter;
      this.debouncedRequestPagination(true);
    },

    async requestPagination(resetPage = false) {
      this.paginating = true;
      const paginate: LabelSelectPaginateFn = this.paginate as LabelSelectPaginateFn; // Checking is done via prop

      const {
        page,
        pages,
        total
      } = await paginate({
        resetPage,
        pageContent: this.page || [],
        page:        this.currentPage,
        filter:      this.search,
        pageSize:    this.pageSize,
      });

      this.page = page;
      this.pages = pages || 0;
      this.totalResults = total || 0;

      this.paginating = false;
    }
  }
});

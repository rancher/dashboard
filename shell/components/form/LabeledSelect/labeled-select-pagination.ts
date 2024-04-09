import { LABEL_SELECT_NOT_OPTION_KINDS } from './LabeledSelect.utils';
import { debounce } from 'lodash';
import Vue, { PropType, defineComponent } from 'vue';
import { ComputedOptions, MethodOptions } from 'vue/types/v3-component-options';

interface Data {
  currentPage: number,
  search: string,
  pageSize: number,

  page: any[],
  pages: number,
  totalResults: number,

  paginating: boolean,

  debouncedRequestPagination: Function
}

interface Computed extends ComputedOptions {
  // _options: () => any,

  canLoadMore: () => boolean,

  optionsInPage: () => number,

  optionCounts: () => string,
}

interface Methods extends MethodOptions {
  loadMore: () => void
  setPaginationFilter: (filter: string) => void
  requestPagination: () => Promise<any>;
}

/**
 * Make a http request to fetch paginated results
 *
 * @param [array] pageContent Current page
 * @param [number] page page number to fetch
 * @param [number] pageSize number of items in the page to fetch
 * @param [string] filter pagination filter. this is just a text string associated with user entered text
 * @param [boolean] resetPage true if the result should only contain the fetched page, false if the result should be added to the pageContent
 */
type PaginateFn<T = any> = (opts: {
  pageContent: T[],
  page: number,
  pageSize: number,
  filter: string,
  resetPage: boolean,
}) => Promise<{
  page: T[],
  pages: number,
  total: number
}>

interface Props {
  paginate?: PaginateFn
}

export default defineComponent<Props, any, Data, Computed, Methods>({
  props: {
    paginate: {
      default: null,
      type:    Function as PropType<PaginateFn>,
    }
  },

  data(): Data {
    return {
      // Internal
      currentPage: 1,
      search:      '',
      pageSize:    10,
      pages:       0,

      debouncedRequestPagination: debounce(this.requestPagination, 700),

      // External
      page:         [],
      totalResults: 0,
      paginating:   false,
    };
  },

  async mounted() {
    if (this.paginate) {
      await this.requestPagination();
    }
  },

  computed: {
    canLoadMore() {
      return this.pages > this.currentPage;
    },

    optionsInPage() {
      // Number of genuine options (not groups, dividers, etc)
      return this.paginate ? this._options.filter((o: any) => !LABEL_SELECT_NOT_OPTION_KINDS.includes(o.kind)).length : 0;
    },

    optionCounts() {
      if (!this.paginate || this.optionsInPage === this.totalResults) {
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
      const paginate: PaginateFn = this.paginate as PaginateFn; // Checking is done via prop

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

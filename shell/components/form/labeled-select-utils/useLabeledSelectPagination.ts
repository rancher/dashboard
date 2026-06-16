/**
 * composable to provide pagination support to LabeledSelect
 */
import {
  ref, computed, onMounted, ComputedRef, Ref, PropType
} from 'vue';
import { useStore } from 'vuex';
import { debounce } from 'lodash';
import { LabelSelectPaginateFn, LABEL_SELECT_NOT_OPTION_KINDS, LABEL_SELECT_KINDS } from '@shell/types/components/labeledSelect';

interface LabeledSelectPaginationProps {
  paginate?: LabelSelectPaginateFn | null;
  inStore?: string;
  resourceType?: string | null;
  options?: Array<any>;
}

interface UseLabeledSelectPagination {
  canPaginate: ComputedRef<boolean>;
  canLoadMore: ComputedRef<boolean>;
  optionCounts: ComputedRef<string>;
  _options: ComputedRef<any[]>;
  pages: Ref<number>;
  totalResults: Ref<number>;
  paginating: Ref<boolean>;
  loadMore: () => void;
  setPaginationFilter: (filter: string) => void;
}

export const labeledSelectPaginationProps = {
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
};

export const useLabeledSelectPagination = (props: LabeledSelectPaginationProps): UseLabeledSelectPagination => {
  const store = useStore();

  // Internal
  const currentPage = ref(1);
  const search = ref('');
  const pageSize = ref(10);
  const pages = ref(0);

  // External
  const page = ref<any[]>([]);
  const totalResults = ref(0);
  const paginating = ref(false);

  const canPaginate = computed(() => {
    return !!props.paginate && !!props.resourceType && store.getters[`${ props.inStore }/paginationEnabled`](props.resourceType);
  });

  const _options = computed(() => canPaginate.value ? page.value : (props.options || []));

  const canLoadMore = computed(() => pages.value > currentPage.value);

  const optionsInPage = computed(() => {
    // Number of genuine options (not groups, dividers, etc)
    return canPaginate.value ? _options.value.filter((o: any) => {
      return o.kind !== LABEL_SELECT_KINDS.NONE && !LABEL_SELECT_NOT_OPTION_KINDS.includes(o.kind);
    }).length : 0;
  });

  const optionCounts = computed(() => {
    if (!canPaginate.value || optionsInPage.value === totalResults.value) {
      return '';
    }

    return store.getters['i18n/t']('labelSelect.pagination.counts', {
      count:      optionsInPage.value,
      totalCount: totalResults.value
    });
  });

  const requestPagination = async(resetPage = false) => {
    paginating.value = true;

    const { page: p, pages: pg, total } = await (props.paginate as LabelSelectPaginateFn)({
      resetPage,
      pageContent: page.value || [],
      page:        currentPage.value,
      filter:      search.value,
      pageSize:    pageSize.value,
    });

    page.value = p;
    pages.value = pg || 0;
    totalResults.value = total || 0;
    paginating.value = false;
  };

  const debouncedRequestPagination = debounce(requestPagination, 700);

  const setPaginationFilter = (filter: string) => {
    paginating.value = true; // Do this before debounce
    currentPage.value = 1;
    search.value = filter;
    debouncedRequestPagination(true);
  };

  const loadMore = () => {
    currentPage.value++;
    requestPagination();
  };

  onMounted(async() => {
    if (canPaginate.value) {
      await requestPagination();
    }
  });

  return {
    canPaginate,
    canLoadMore,
    optionCounts,
    _options,
    pages,
    totalResults,
    paginating,
    loadMore,
    setPaginationFilter,
  };
};

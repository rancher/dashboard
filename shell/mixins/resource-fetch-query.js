import { mapGetters } from 'vuex';
import { hashObj } from '@shell/utils/crypto/browserHashUtils';
import { cloneDeep, get, isArray } from 'lodash';
import { addObject, addObjects } from '@shell/utils/array';
import { mapPref, GROUP_RESOURCES, ROWS_PER_PAGE } from '@shell/store/prefs';

export const groupOptions = (that) => {
  const standard = [
    {
      tooltipKey: 'resourceTable.groupBy.none',
      icon:       'icon-list-flat',
      value:      'none',
    },
    {
      tooltipKey: that.groupTooltip,
      icon:       'icon-folder',
      value:      'namespace',
    },
  ];

  return standard.concat(that.listGroups);
};

export const computeGroupBy = ({
  listGroups = [],
  groupable = null,
  groupToolTip = 'resourceTable.groupBy.namespace',
  selectedGroupBy,
  _group,
  isMultipleNamespaces,
  isNamespaced
}) => {
  let group;
  const computedGroupOptions = groupOptions({ listGroups, groupToolTip });
  const groupSelection = selectedGroupBy || _group;
  const exists = computedGroupOptions.find(groupOption => groupOption?.value === groupSelection);

  if (!exists) {
    group = 'namespace';
  } else {
    group = groupSelection;
  }

  let showGrouping;

  if ( groupable === null ) {
    const namespaceGroupable = isMultipleNamespaces && isNamespaced;
    const customGroupable = listGroups.length > 0;

    showGrouping = namespaceGroupable || customGroupable;
  } else {
    showGrouping = groupable || false;
  }

  if (group === 'namespace' && showGrouping) {
    return 'groupByLabel';
  }

  const listGroupsMapped = listGroups.reduce((acc, grp) => {
    acc[grp.value] = grp;

    return acc;
  }, {});
  const custom = listGroupsMapped[group];

  return custom?.field || null;
};

export const correctSort = (sort) => {
  let correctedSort = sort;

  if (sort === 'creationTimestamp:desc' || sort === 'namespace') {
    correctedSort = `metadata.${ sort.replace(':desc', '') }`;
  }

  if (isArray(sort)) {
    correctedSort = sort[0].replace('$.', '').replace('[', '.').replace(']', '');
  }

  return correctedSort;
};

export const defaultSortBy = ({ headers }) => {
  const markedColumn = headers.find(header => !!header.defaultSort);
  const nameColumn = headers.find( header => header.name === 'name');
  const firstColumn = headers.filter( header => header.name !== 'state' )[0];

  const sortName = markedColumn?.name || nameColumn?.name || firstColumn?.name || 'id';

  return sortName;
};

export const groupAndSort = ({
  groupBy, groupSort, columns, headers, sortBy, sortDesc
}) => {
  let fromGroup = ( groupBy ? groupSort || groupBy : null) || [];
  let fromColumn = [];

  const column = (columns || headers).find(x => x && x.name && x.name.toLowerCase() === sortBy.toLowerCase());

  if ( sortBy && column?.sort ) {
    fromColumn = column.sort;
  }

  // ToDo: SM keeping this around for the PR just in case we want sortDesc to apply to all sortFields
  // if ( !Array.isArray(fromGroup) ) {
  //   fromGroup = [`${ sortDesc ? '-' : '' }${ fromGroup }`];
  // } else {
  //   fromGroup = fromColumn.map(column => `${ sortDesc ? '-' : '' }${ column }`);
  // }

  if ( !Array.isArray(fromGroup) ) {
    fromGroup = [fromGroup];
  }

  if ( !Array.isArray(fromColumn) ) {
    fromColumn = [`${ sortDesc ? '-' : '' }${ fromColumn }`];
  } else {
    fromColumn = fromColumn.map(column => `${ sortDesc ? '-' : '' }${ column }`);
  }

  const out = [...fromGroup, ...fromColumn];

  // ToDo: SM keeping this around for the PR just in case we want sortDesc to apply to all sortFields
  // addObject(out, `${ sortDesc ? '-' : '' }${ nameSort }`);
  // addObject(out, `${ sortDesc ? '-' : '' }${ id }`);

  if (fromColumn.some(column => column.substring(1) !== 'nameSort')) {
    addObject(out, 'nameSort');
  }
  if (fromColumn.some(column => column.substring(1) !== 'id')) {
    addObject(out, 'id');
  }

  return out;
};

export function columnsToSearchFields(columns, valueProp) {
  const out = [];

  (columns || []).forEach((column) => {
    const field = column.search;

    if ( field ) {
      if ( typeof field === 'string' ) {
        addObject(out, field);
      } else if ( isArray(field) ) {
        addObjects(out, field);
      }
    } else if ( field === false ) {
      // Don't add the name
    } else {
      // Use value/name as the default
      const columnValue = valueProp ? column.valueProp : column.value;

      addObject(out, columnValue || column.name);
    }
  });

  return out.filter(x => !!x);
}

export function searchObject(searchFields = [], search = '') {
  if (search === '') {
    return;
  }
  const searchValueArray = (search) => {
    if (typeof search === 'string') {
      return search.split(',')
        .map(searchString => searchString.trim())
        .filter(searchString => searchString);
    } else if (Array.isArray(search)) {
      return search;
    }

    return [];
  };

  const searchValues = searchValueArray(search);

  if (searchValues.length > 0) {
    return {
      fields: searchFields, operator: 'partial', values: searchValues
    };
  }
}

export const searchFilters = ({ searches }) => {
  const operators = {
    exact:   (value, searchTerms) => searchTerms.some(searchTerm => !searchTerm || value === searchTerm),
    prefix:  (value, searchTerms) => searchTerms.some(searchTerm => !searchTerm || value?.startsWith(searchTerm)),
    suffix:  (value, searchTerms) => searchTerms.some(searchTerm => !searchTerm || value?.endsWith(searchTerm)),
    partial: (value, searchTerms) => searchTerms.some(searchTerm => !searchTerm || value?.includes(searchTerm)),
  };
  const fieldSearches = (fieldSearch) => {
    const operatorKeys = Object.keys(fieldSearch);

    return (value) => {
      return operatorKeys.some((operatorKey) => {
        const searchesTermsList = fieldSearch[operatorKey];

        return searchesTermsList.every((searchTerms) => {
          return operators[operatorKey](value, searchTerms);
        });
      });
    };
  };

  const fieldFilters = searches.reduce((acc, search) => {
    if (!search.subSearch) {
      return {
        ...acc,
        [search.field]: fieldSearches({
          ...(acc[search.field] || []),
          [search.operator]: [...(acc?.[search.field]?.[search.operator] || []), search.values]
        })
      };
    } else {
      return { ...acc };
    }
  }, {});

  return fieldFilters;
};

export const processSearches = ({ resources, searches }) => {
  const filters = searchFilters({ searches });
  const fieldKeys = Object.keys(filters);

  if (fieldKeys.length === 0) {
    return resources;
  }

  return resources.filter((resource) => {
    return fieldKeys.some((fieldKey) => {
      const fieldValue = fieldKey.includes('.') ? get(resource, fieldKey) : resource[fieldKey];

      return filters[fieldKey](fieldValue);
    });
  });
};

export const searchRows = ({
  resources,
  searchQuery,
  headers,
  valueProp,
  extraSearchFields
}) => {
  const searchFields = columnsToSearchFields(headers, valueProp);

  if (extraSearchFields) {
    addObjects(searchFields, extraSearchFields);
  }

  const searches = searchObject(searchFields, searchQuery);

  return processSearches({ resources, searches });
};

/**
 * ToDo: SM description goes here...
 */
export default {
  data() {
    const { q: search } = { ...this.$route.query };
    const pageSize = this.$store.getters['prefs/get'](ROWS_PER_PAGE);

    return {
      resourceParams: {
        page:     1,
        pageSize,
        search,
        sortBy:   undefined,
        sortDesc: false
      }
    };
  },
  computed: {
    ...mapGetters(['isAllNamespaces', 'namespaces', 'isMultipleNamespaces']),
    pageSize:        mapPref(ROWS_PER_PAGE),
    // TODO: comment needs to be jsoc
    // selectedGroupBy is the value that controls "computedGroupBy" so it doesn't make sense to throw it into resourceParams
    selectedGroupBy: mapPref(GROUP_RESOURCES),
    selectedNamespaces() {
      const namespacesMap = this.isAllNamespaces ? {} : this.namespaces();

      return Object.keys(namespacesMap).filter(key => namespacesMap[key]);
    },
    resourceQueryMethods() {
      if (!this.advancedWorker) {
        return {};
      }

      return {
        setPage: (num) => {
          if (this.resourceParams.page !== num) {
            this.resourceParams.page = num;
          }
        },
        setSearch: (rawSearch) => {
          const search = (rawSearch || '').trim().toLowerCase();
          const currentSearchHash = hashObj(this.resourceParams.search || '');

          const newSearchHash = hashObj(search);

          if (currentSearchHash !== newSearchHash) {
            this.resourceParams = {
              ...this.resourceParams,
              search,
              page: 1
            };
          }

          return search;
        },
        setSort: (sortBy, sortDesc) => {
          if (
            this.resourceParams.sortBy !== sortBy ||
            this.resourceParams.sortDesc !== sortDesc
          ) {
            this.resourceParams = {
              ...this.resourceParams,
              page: 1,
              sortBy,
              sortDesc
            };
          }

          return [sortBy, sortDesc];
        },
        setGroup: (groupBy) => {
          const currentResourceQueryHash = hashObj(this.resourceQuery);
          let resourceQueryClone = cloneDeep(this.resourceQuery);
          const sortField = this.resourceQuery.sortBy[1];
          const sortBy = groupBy ? [groupBy, sortField] : [sortField];

          resourceQueryClone = {
            ...resourceQueryClone,
            page: 1,
            sortBy
          };
          if (currentResourceQueryHash !== hashObj(resourceQueryClone)) {
            this.resourceQuery = { ...resourceQueryClone };
          }
        }
      };
    }
  },
  methods: {
    searches(resourceHeaders) {
      const searches = [];
      const searchFields = columnsToSearchFields(resourceHeaders, true);
      const fieldSearch = searchObject(searchFields, this.resourceParams.search, 'partial');

      if (fieldSearch) {
        searches.push(fieldSearch);
      }
      const namespaceSearch = searchObject(['metadata.namespace'], this.selectedNamespaces, 'exact');

      if (namespaceSearch) {
        searches.push(namespaceSearch);
      }

      return searches;
    },
    groupAndSort(schema, resourceHeaders) {
      const options = this.$store.getters[`type-map/optionsFor`](schema);
      const isNamespaced = !!get( schema, 'attributes.namespaced');
      const listGroups = options?.listGroups;
      const computedGroupBy = computeGroupBy({
        listGroups,
        selectedGroupBy:      this.selectedGroupBy,
        isMultipleNamespaces: this.isMultipleNamespaces,
        isNamespaced
      });

      return groupAndSort({
        groupBy:   computedGroupBy,
        groupSort: this.groupSort,
        columns:   this.columns,
        headers:   resourceHeaders,
        sortBy:    this.resourceParams.sortBy || defaultSortBy({ headers: resourceHeaders }),
        sortDesc:  this.resourceParams.sortDesc
      });
    },
    resourceQuery(schema) {
      if (this.advancedWorker) {
        const resourceHeaders = this.$store.getters['type-map/headersFor'](schema);
        const resourceQuery = {
          page:     this.resourceParams.page,
          pageSize: this.resourceParams.pageSize,
          sortBy:   this.groupAndSort(schema, resourceHeaders)
        };

        const searches = this.searches(resourceHeaders);

        if (searches.length > 0) {
          resourceQuery.searches = searches;
        }

        if (!this.isAllNamespaces) {
          resourceQuery.namespaces = this.selectedNamespaces;
        }

        return resourceQuery;
      }
    }
  },
  watch: {
    resourceParams: {
      deep: true,
      handler(neu) {
      // this is where the data assignment will trigger the update of the list view...
        if (this.init && neu) {
          this.$fetch();
        }
      },
    }
  }
};

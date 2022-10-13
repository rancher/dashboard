import { ADV_FILTER_ALL_COLS_VALUE, ADV_FILTER_ALL_COLS_LABEL } from '@shell/components/SortableTable/filtering';

const DEFAULT_ADV_FILTER_COLS_VALUE = ADV_FILTER_ALL_COLS_VALUE;

export default {
  props: {
    /**
     * Group value
     * To be used on the THead component when adv filtering is present
     */
    group: {
      type:    String,
      default: () => ''
    },
    /**
     * Group options
     * All of the grouping options available to be used on the THead component when adv filtering is present
     */
    groupOptions: {
      type:    Array,
      default: () => []
    },
    /**
     * Flag that controls visibility of advanced filtering feature
     */
    hasAdvancedFiltering: {
      type:    Boolean,
      default: false
    },
    /**
     * Flag that controls visibility of labels as possibe toggable cols to be displayed on the Sortable Table
     */
    advFilterHideLabelsAsCols: {
      type:    Boolean,
      default: false
    },
    /**
     * Flag that prevents filtering by labels
     */
    advFilterPreventFilteringLabels: {
      type:    Boolean,
      default: false
    },
  },
  data() {
    return {
      columnOptions:               [],
      colOptionsWatcher:           null,
      advancedFilteringVisibility: false,
      advancedFilteringValues:     [],
      advFilterSearchTerm:         null,
      advFilterSelectedProp:       DEFAULT_ADV_FILTER_COLS_VALUE,
      advFilterSelectedLabel:      ADV_FILTER_ALL_COLS_LABEL,
      column:                      null,
    };
  },

  mounted() {
    // register watcher to watch rows for columnOptions
    if (this.hasAdvancedFiltering) {
      // check if user clicked outside the advanced filter box
      window.addEventListener('click', this.onClickOutside);

      this.columnOptions = this.setColsOptions();
      this.colOptionsWatcher = this.$watch('rows', function() {
        this.columnOptions = this.setColsOptions();
      });
    }
  },

  beforeDestroy() {
    if (this.hasAdvancedFiltering) {
      // unregister click event
      window.removeEventListener('click', this.onClickOutside);
      // unregister watcher for rows
      this.colOptionsWatcher();
    }
  },

  watch: {
    advancedFilteringValues() {
      // passing different dummy args to make sure update is triggered
      this.watcherUpdateLiveAndDelayed(true, false);
    },
  },

  computed: {
    advFilterSelectOptions() {
      return this.columnOptions.filter(c => c.isFilter && !c.preventFiltering);
    },

    advGroupOptions() {
      return this.groupOptions.map((item) => {
        return {
          label: this.t(item.tooltipKey),
          value: item.value
        };
      });
    },
  },

  methods: {
    handleColsVisibilyAndFiltering(cols) {
      const allCols = cols;

      this.columnOptions.forEach((advCol) => {
        if (advCol.isTableOption) {
          const index = allCols.findIndex(col => col.name === advCol.name);

          if (index !== -1) {
            allCols[index].isColVisible = advCol.isColVisible;
            allCols[index].isFilter = advCol.isFilter;
          } else {
            allCols.push(advCol);
          }
        }
      });

      return allCols;
    },
    // advanced filtering methods
    setColsOptions() {
      let opts = [];
      const rowLabels = [];
      const headerProps = [];

      // Filter out any columns that are too heavy to show for large page sizes
      const filteredHeaders = this.headers.slice().filter(c => (!c.maxPageSize || (c.maxPageSize && c.maxPageSize >= this.perPage)));

      // add table cols from config (headers)
      filteredHeaders.forEach((prop) => {
        const name = prop.name;
        const label = prop.labelKey ? this.t(`${ prop.labelKey }`) : prop.label;
        const isFilter = !!((!Object.keys(prop).includes('search') || prop.search));
        let sortVal = prop.sort;
        const valueProp = prop.valueProp || prop.value;
        let value = null;

        if (prop.sort && valueProp) {
          if (typeof prop.sort === 'string') {
            sortVal = prop.sort.includes(':') ? [prop.sort.split(':')[0]] : [prop.sort];
          }

          if (!sortVal.includes(valueProp)) {
            value = JSON.stringify(sortVal.concat([valueProp]));
          } else {
            value = JSON.stringify([valueProp]);
          }
        } else if (valueProp) {
          value = JSON.stringify([valueProp]);
        } else {
          value = null;
        }

        headerProps.push({
          name,
          label,
          value,
          isFilter,
          isTableOption: true,
          isColVisible:  true
        });
      });

      // add labels as table cols
      if (this.rows.length) {
        this.rows.forEach((row) => {
          if (row.metadata?.labels && Object.keys(row.metadata?.labels).length) {
            Object.keys(row.metadata?.labels).forEach((label) => {
              const res = {
                name:             label,
                label,
                value:            `metadata.labels.${ label }`,
                isFilter:         true,
                isTableOption:    true,
                isColVisible:     false,
                isLabel:          true,
                preventFiltering: this.advFilterPreventFilteringLabels,
                preventColToggle: this.advFilterHideLabelsAsCols
              };

              if (!rowLabels.filter(row => row.label === label).length) {
                rowLabels.push(res);
              }
            });
          }
        });
      }

      opts = headerProps.concat(rowLabels);

      // add find on all cols option...
      if (opts.length) {
        opts.unshift({
          name:          ADV_FILTER_ALL_COLS_LABEL,
          label:         ADV_FILTER_ALL_COLS_LABEL,
          value:         ADV_FILTER_ALL_COLS_VALUE,
          isFilter:      true,
          isTableOption: false
        });
      }

      return opts;
    },
    addAdvancedFilter() {
      // set new advanced filter
      if (this.advFilterSelectedProp && this.advFilterSearchTerm) {
        this.advancedFilteringValues.push({
          prop:  this.advFilterSelectedProp,
          value: this.advFilterSearchTerm,
          label: this.advFilterSelectedLabel
        });

        this.eventualSearchQuery = this.advancedFilteringValues;

        this.advancedFilteringVisibility = false;
        this.advFilterSelectedProp = DEFAULT_ADV_FILTER_COLS_VALUE;
        this.advFilterSelectedLabel = ADV_FILTER_ALL_COLS_LABEL;
        this.advFilterSearchTerm = null;
      }
    },
    clearAllAdvancedFilters() {
      this.advancedFilteringValues = [];
      this.eventualSearchQuery = this.advancedFilteringValues;

      this.advancedFilteringVisibility = false;
      this.advFilterSelectedProp = DEFAULT_ADV_FILTER_COLS_VALUE;
      this.advFilterSelectedLabel = ADV_FILTER_ALL_COLS_LABEL;
      this.advFilterSearchTerm = null;
    },
    clearAdvancedFilter(index) {
      this.advancedFilteringValues.splice(index, 1);
      this.eventualSearchQuery = this.advancedFilteringValues;
    },
    onClickOutside(event) {
      const advFilterBox = this.$refs['advanced-filter-group'];

      if (!advFilterBox || advFilterBox.contains(event.target)) {
        return;
      }
      this.advancedFilteringVisibility = false;
    },

    // cols visibility
    changeColVisibility(colData) {
      const index = this.columnOptions.findIndex(col => col.label === colData.label);

      if (index !== -1) {
        this.columnOptions[index].isColVisible = colData.value;
      }
    },
  },
};

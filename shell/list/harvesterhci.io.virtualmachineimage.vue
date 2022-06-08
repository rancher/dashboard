<script>
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import FilterLabel from '@shell/components/FilterLabel';
import { defaultTableSortGenerationFn } from '@shell/components/ResourceTable.vue';

export default {
  name: 'ListHarvesterImage',

  components: {
    ResourceTable,
    Banner,
    FilterLabel
  },

  props:      {
    schema: {
      type:     Object,
      required: true,
    },
    rows: {
      type:     Array,
      required: true,
    },
  },

  data() {
    return {
      searchLabels: [],
      filterRows:   []
    };
  },

  computed: {
    uploadingImages() {
      return this.$store.getters['harvester-common/uploadingImages'] || [];
    },

    optionLabels() {
      const labels = this.rows.map((row) => {
        return Object.keys(row.labels);
      });

      return Array.from(new Set(labels.flat()));
    },
  },

  methods: {
    update() {
      const map = {};

      this.searchLabels.map((v) => {
        map[`${ v.key }`] = v.value;
      });
    },

    calcValueOptions(key) {
      const valueOptions = [];

      this.rows.map((row) => {
        const isExistValue = valueOptions.find(value => value.label === row.labels[key]);

        if (Object.keys(row.labels).includes(key) && key && row.labels[key] && !isExistValue) {
          valueOptions.push({
            value: row.labels[key],
            label: row.labels[key]
          });
        }
      });

      return valueOptions;
    },

    changeRows(filterRows, searchLabels) {
      this.$set(this, 'filterRows', filterRows);
      this.$set(this, 'searchLabels', searchLabels);
    },

    removeAll() {
      this.$set(this, 'searchLabels', []);
    },

    sortGenerationFn() {
      let base = defaultTableSortGenerationFn(this.schema, this.$store);

      this.searchLabels.map((label) => {
        base += label.key;
        base += label.value;
      });

      return base;
    },
  }
};
</script>

<template>
  <div>
    <Banner
      v-if="uploadingImages.length > 0"
      color="warning"
      :label="t('harvester.image.warning.uploading', {count: uploadingImages.length} )"
    />
    <ResourceTable
      v-bind="$attrs"
      :rows="filterRows"
      :schema="schema"
      :sort-generation-fn="sortGenerationFn"
      key-field="_key"
      v-on="$listeners"
    >
      <template #more-header-middle>
        <FilterLabel ref="filterLabel" :rows="rows" @changeRows="changeRows" />
      </template>
    </ResourceTable>
  </div>
</template>

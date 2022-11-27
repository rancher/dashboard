<script>
import ResourceTable from '@shell/components/ResourceTable';
import { Banner } from '@components/Banner';
import FilterLabel from '../components/FilterLabel';
import { defaultTableSortGenerationFn } from '@shell/components/ResourceTable.vue';

export default {
  name: 'ListHarvesterImage',

  components: {
    ResourceTable,
    Banner,
    FilterLabel
  },

  props: {
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
  },

  methods: {
    changeRows(filterRows, searchLabels) {
      this.$set(this, 'filterRows', filterRows);
      this.$set(this, 'searchLabels', searchLabels);
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

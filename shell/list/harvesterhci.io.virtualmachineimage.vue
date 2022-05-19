<script>
import ResourceTable from '@shell/components/ResourceTable';
import Banner from '@shell/components/Banner';

export default {
  name: 'ListHarvesterImage',

  components: {
    ResourceTable,
    Banner,
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

  computed: {
    uploadingImages() {
      return this.$store.getters['harvester-common/uploadingImages'] || [];
    },
  },
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
      :rows="rows"
      :schema="schema"
      key-field="_key"
      v-on="$listeners"
    />
  </div>
</template>

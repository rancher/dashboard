<script>
import GenericPrompt from '@shell/dialog/GenericPrompt';
import Banner from '@components/Banner/Banner.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';

export default {
  name:       'ExportAppDialog',
  components: {
    GenericPrompt, Banner, Tabbed, Tab
  },

  props: {
    resources: {
      type:     Array,
      required: true
    }
  },
  data() {
    return {};
  },
};
</script>

<template>
  <GenericPrompt
    :resources="resources"
    @close="$emit('close')"
  >
    <h4
      slot="title"
      class="text-default-text export-app-dialog__title"
    >
      {{ t('epinio.applications.export.label') }}
    </h4>

    <template slot="body">
      <Tabbed>
        <Tab
          label-key="epinio.applications.export.manifest.title"
          name="manifest"
          :weight="3"
          class="export-app-dialog__tab"
        >
          <p>
            {{ t('epinio.applications.export.manifest.description') }}
          </p>
        </Tab>

        <Tab
          label-key="epinio.applications.export.chart.title"
          name="chart"
          :weight="2"
          class="export-app-dialog__tab"
        >
          <p>
            {{ t('epinio.applications.export.chart.description') }}
          </p>
          <Banner
            color="info"
          >
            {{ t('epinio.applications.export.chart.banner') }}
          </Banner>
        </Tab>
      </Tabbed>
    </template>
  </GenericPrompt>
</template>
<style lang='scss' scoped>
.export-app-dialog {
  &__title {
    margin-bottom: 0;
  }
  &__tab {
    min-height: 110px;
  }
}
</style>

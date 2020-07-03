<script>
import { get } from '@/utils/object';
import createEditView from '@/mixins/create-edit-view';
import DetailTop from '@/components/DetailTop';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import LiveDate from '@/components/formatter/LiveDate';
import { DESCRIPTION } from '@/config/labels-annotations';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';

export default {
  name: 'DetailNamespace',

  components: {
    ContainerResourceLimit,
    DetailTop,
    LiveDate,
    ResourceTabs,
    Tab
  },

  mixins: [createEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    let originalQuotaID = null;
    let description;

    if ( this.originalValue?.metadata?.name ) {
      originalQuotaID = `${ this.originalValue.metadata.name }/default-quota`;
      const originalAnnotations = get(this.originalValue, 'metadata.annotations');

      if (originalAnnotations) {
        description = originalAnnotations[DESCRIPTION];
      }

      this.value.metadata.annotations = this.originalValue.metadata.annotations ? JSON.parse(JSON.stringify(this.originalValue.metadata.annotations)) : {};
      this.value.metadata.labels = this.originalValue.metadata.labels ? JSON.parse(JSON.stringify(this.originalValue.metadata.labels)) : {};
    }
    if (!this.value.metadata) {
      this.value.metadata = {
        annotations: {},
        labels:      {},
        name:        ''
      };
    }

    if (!this.value.metadata.annotations) {
      this.value.metadata.annotations = {};
    }

    if (!this.value.metadata.labels) {
      this.value.metadata.labels = {};
    }

    return {
      originalQuotaID,
      description,
      name: this.value.metadata.name
    };
  },

  computed: {
    detailTopColumns() {
      return [
        {
          title: this.$store.getters['i18n/t']('generic.created'),
          name:  'created'
        },
      ];
    },
  },
};
</script>

<template>
  <div class="namespace-detail">
    <DetailTop :columns="detailTopColumns">
      <template v-slot:created>
        <LiveDate :value="value.metadata.creationTimestamp" :add-suffix="true" />
      </template>
    </DetailTop>

    <div class="spacer"></div>

    <ResourceTabs v-model="value" :mode="mode">
      <template #before>
        <Tab name="container-resource-limit" :label="t('containerResourceLimit.label')">
          <ContainerResourceLimit :mode="mode" :namespace="value" />
        </Tab>
      </template>
    </ResourceTabs>
  </div>
</template>

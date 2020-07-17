<script>
import { get } from '@/utils/object';
import createEditView from '@/mixins/create-edit-view';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import { DESCRIPTION } from '@/config/labels-annotations';
import ResourceTabs from '@/components/form/ResourceTabs';
import Tab from '@/components/Tabbed/Tab';

export default {
  name: 'DetailNamespace',

  components: {
    ContainerResourceLimit,
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
  }
};
</script>

<template>
  <div class="namespace-detail">
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

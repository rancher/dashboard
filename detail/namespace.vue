<script>
import { get } from '@/utils/object';

import createEditView from '@/mixins/create-edit-view';
import ResourceQuota from '@/edit/namespace/ResourceQuota';
// import LabelsAndAnnotationsTabs from '@/components/form/LabelsAndAnnotations';
import { DESCRIPTION } from '@/config/labels-annotations';

export default {
  name: 'DetailNamespace',

  components: {
    ResourceQuota,
    // LabelsAndAnnotationsTabs
  },

  mixins:     [createEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    let originalQuotaID = null;
    let description;

    if (!!this.originalValue) {
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
      originalQuotaID, description, name: this.value.metadata.name
    };
  },
};
</script>

<template>
  <div class="namespace-detail">
    <ResourceQuota
      :original-i-d="originalQuotaID"
      :register-after-hook="registerAfterHook"
      :mode="mode"
      :namespace="value"
      row-classes="detail-top"
    >
      <template v-slot:default="slotProps">
        <div>
          <label for="">CPU Limit</label>
          <span>
            {{ slotProps.limitsCPU }}
            <span class="addon">MCPUs</span>
          </span>
        </div>
        <div>
          <label for="">CPU Reservation</label>
          <span>
            {{ slotProps.limitsMem }}
            <span class="addon">MCPUs</span>
          </span>
        </div>
        <div>
          <label for="">Memory Limit</label>
          <span>
            {{ slotProps.reqCPU }}
            <span class="addon">MB</span>
          </span>
        </div>
        <div>
          <label for="">Memory Reservation</label>
          <span>
            {{ slotProps.reqMem }}
            <span class="addon">MB</span>
          </span>
        </div>
      </template>
    </ResourceQuota>
    <div class="spacer"></div>
    <LabelsAndAnnotationsTabs :labels="value.metadata.labels" :annotations="value.metadata.annotations" />
  </div>
</template>

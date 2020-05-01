<script>
import { get } from '@/utils/object';

import createEditView from '@/mixins/create-edit-view';
import ResourceQuota from '@/edit/namespace/ResourceQuota';
import DetailTop from '@/components/DetailTop';
// import UnitInput from '@/components/form/UnitInput';
import LiveDate from '@/components/formatter/LiveDate';
import { DESCRIPTION } from '@/config/labels-annotations';
import ResourceTabs from '@/components/form/ResourceTabs';

export default {
  name: 'DetailNamespace',

  components: {
    DetailTop,
    LiveDate,
    ResourceQuota,
    ResourceTabs,
    // UnitInput
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
    <ResourceQuota
      :original-id="originalQuotaID"
      :register-after-hook="registerAfterHook"
      :mode="mode"
      :namespace="value"
      row-classes="detail-top"
    />
    <div class="spacer"></div>

    <ResourceTabs v-model="value" :mode="mode" />
  </div>
  <!-- <template v-slot:default="slotProps">
       <div class="row">
       <div class="col span-6">
       <UnitInput
       v-model="slotProps.limitsCPU"
       mode="view"
       label="CPU Limit"
       :increment="1000"
       :input-exponent="-1"
       suffix="milli CPUs"
       placeholder="Default: None"
       />
       </div>
       <div class="col span-6">
       <UnitInput
       v-model="slotProps.limitsMem"
       mode="view"
       label="CPU Reservation"
       :increment="1000"
       :input-exponent="-1"
       suffix="milli CPUs"
       placeholder="Default: None"
       />
       </div>
       </div>
       <div class="row">
       <div class="col span-6">
       <UnitInput
       v-model="slotProps.reqCPU"
       mode="view"
       label="CPU Reservation"
       :increment="1000"
       :input-exponent="-1"
       suffix="MB"
       placeholder="Default: None"
       />
       </div>
       <div class="col span-6">
       <UnitInput
       v-model="slotProps.reqMem"
       mode="view"
       label="Memory Reservation"
       :increment="1000"
       :input-exponent="-1"
       suffix="MB"
       placeholder="Default: None"
       />
       </div>
       </div>
       </template> -->
</template>

<script>
import { get } from '@/utils/object';

import createEditView from '@/mixins/create-edit-view';
import { ANNOTATION } from '@/config/types';
import KeyValue from '@/components/form/KeyValue';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';

export default {
  name: 'DetailNamespace',

  components: {
    KeyValue,
    Tabbed,
    Tab,
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
      const orignalAnnotations = get(this.originalValue, 'metadata.annotations');

      if (orignalAnnotations) {
        description = orignalAnnotations[ANNOTATION.DESCRIPTION];
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
    <div class="detail-top">
      <div>
        <label for="">CPU Limit</label>
        <span>
          xxxx
          <span class="addon">MCPUs</span>
        </span>
      </div>
      <div>
        <label for="">CPU Reservation</label>
        <span>
          xxxx
          <span class="addon">MCPUs</span>
        </span>
      </div>
      <div>
        <label for="">Memory Limit</label>
        <span>
          xxxx
          <span class="addon">MB</span>
        </span>
      </div>
      <div>
        <label for="">Memory Reservation</label>
        <span>
          xxxx
          <span class="addon">MB</span>
        </span>
      </div>
    </div>
    <div class="spacer"></div>
    <Tabbed default-tab="labels">
      <Tab name="labels" label="Labels">
        <KeyValue
          key="labels"
          v-model="value.metadata.labels"
          :mode="mode"
          :add-allowed="false"
          :protip="false"
        />
      </Tab>
      <Tab name="annotations" label="Annotations">
        <KeyValue
          key="annotations"
          v-model="value.metadata.annotations"
          :mode="mode"
          :add-allowed="false"
          :protip="false"
        />
      </Tab>
    </Tabbed>
  </div>
</template>

<script>
import { _CREATE } from '@shell/config/query-params';

import KeyValue from '../../../components/form/KeyValue';

export default {
  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    }
  },

  components: { KeyValue }
};
</script>

<template>
  <div>
    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="labels"
          v-model="value.labels"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :title="t('labels.labels.title')"
          :read-allowed="false"
          :value-can-be-empty="true"
        />
      </div>
    </div>
    <div class="spacer"></div>
    <div class="row">
      <div class="col span-12">
        <KeyValue
          key="annotations"
          v-model="value.annotations"
          :add-label="t('labels.addAnnotation')"
          :mode="mode"
          :title="t('labels.annotations.title')"
          :read-allowed="false"
          :value-can-be-empty="true"
        />
      </div>
    </div>
  </div>
</template>

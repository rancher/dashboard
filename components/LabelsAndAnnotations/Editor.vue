<template>
  <div class="labels-and-annotations-editor row">
    <div class="col span-6">
      <h4 class="mb-10">
        Labels
      </h4>
      <KeyValue
        key="labels"
        v-model="localLabels"
        :mode="mode"
        :value-multiline="false"
        :pad-left="false"
        :read-allowed="false"
        add-label="Add Label"
        :protip="false"
      />
    </div>
    <div class="col span-6">
      <h4 class="mb-10">
        Annotations
      </h4>
      <KeyValue
        key="annotations"
        v-model="localAnnotations"
        :value-multiline="false"
        :mode="mode"
        :pad-left="false"
        :read-allowed="false"
        add-label="Add Annotation"
        :protip="false"
      />
    </div>
  </div>
</template>

<script>
import { _VIEW, _EDIT } from '../../config/query-params';
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue },
  props:      {
    /**
     * Determines if the editor is in edit or view mode. Can be {@link _VIEW} or {@link _EDIT}.
     */
    mode: {
      type:      String,
      required:  true,
      validator: (value) => {
        return [_VIEW, _EDIT].includes(value);
      }
    },
    /**
     * An object of key value pairs that represent labels.
     */
    labels: {
      type:     Object,
      required: true,
    },
    /**
     * An object of key value pairs that represent annotations.
     */
    annotations: {
      type:     Object,
      required: true,
    },
  },
  computed: {
    localLabels: {
      get() {
        return this.labels;
      },
      set(localLabels) {
        this.$emit('update:labels', localLabels);
      }
    },
    localAnnotations: {
      get() {
        return this.annotations;
      },
      set(localAnnotations) {
        this.$emit('update:annotations', localAnnotations);
      }
    },
  },
};
</script>

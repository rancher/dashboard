<script>
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue },

  props: {
    spec: {
      type:     Object,
      required: true,
    },
    mode: {
      type:     String,
      required: true,
    },
    displaySideBySide: {
      type:    Boolean,
      default: false,
    }
  },

  computed: {
    containerClass() {
      return this.displaySideBySide ? 'row' : '';
    },

    sectionClass() {
      return this.displaySideBySide ? 'col span-6' : 'row';
    }
  },

  created() {
    if ( !this.spec.metadata ) {
      this.$set(this.spec, 'metadata', {});
    }

    if ( !this.spec.annotations ) {
      this.$set(this.spec, 'annotations', {});
    }
  },
};
</script>
<template>
  <div :class="containerClass">
    <div :class="sectionClass">
      <KeyValue
        key="labels"
        v-model="spec.metadata.labels"
        :mode="mode"
        title="Labels"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </div>
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        v-model="spec.metadata.annotations"
        :mode="mode"
        title="Annotations"
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
      />
    </div>
  </div>
</template>

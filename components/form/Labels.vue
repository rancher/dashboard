<script>
import KeyValue from '@/components/form/KeyValue';

export default {
  components: { KeyValue },

  props: {
    value: {
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
    },

    defaultContainerClass: {
      type:    String,
      default: '',
    },

    defaultSectionClass: {
      type:    String,
      default: '',
    }
  },

  computed: {
    containerClass() {
      return `${ this.displaySideBySide ? 'row' : '' } ${ this.defaultContainerClass }`.trim();
    },

    sectionClass() {
      return `${ this.displaySideBySide ? 'col span-6' : 'row' } ${ this.defaultSectionClass }`.trim();
    }
  }
};
</script>
<template>
  <div :class="containerClass">
    <div :class="sectionClass">
      <KeyValue
        key="labels"
        :value="value.labels"
        :mode="mode"
        title="Labels"
        :pad-left="false"
        :read-allowed="false"
        @input="value.setLabels"
      />
    </div>
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        :value="value.annotations"
        :mode="mode"
        title="Annotations"
        :pad-left="false"
        :read-allowed="false"
        @input="value.setAnnotations"
      />
    </div>
  </div>
</template>

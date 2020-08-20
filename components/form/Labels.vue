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
    }
  },

  computed: {
    containerClass() {
      const { defaultContainerClass } = this;

      return this.displaySideBySide ? `row ${ defaultContainerClass }` : `${ defaultContainerClass }`;
    },

    sectionClass() {
      return this.displaySideBySide ? 'col span-6' : 'row';
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
        :initial-empty-row="true"
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
        :initial-empty-row="true"
        :pad-left="false"
        :read-allowed="false"
        @input="value.setAnnotations"
      />
    </div>
  </div>
</template>

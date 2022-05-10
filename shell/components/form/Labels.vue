<script>
import KeyValue from '@shell/components/form/KeyValue';

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
        :add-label="t('labels.addLabel')"
        :mode="mode"
        :title="t('labels.labels.title')"
        :read-allowed="false"
        :value-can-be-empty="true"
        @input="value.setLabels($event)"
      />
    </div>
    <div class="spacer"></div>
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        :value="value.annotations"
        :add-label="t('labels.addAnnotation')"
        :mode="mode"
        :title="t('labels.annotations.title')"
        :read-allowed="false"
        :value-can-be-empty="true"
        @input="value.setAnnotations($event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>

<script>
import KeyValue from '@shell/components/form/KeyValue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { getPSALabels } from '@shell/utils/pod-security-admission';

export default {
  components: {
    ToggleSwitch,
    KeyValue
  },

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
    },

    labelTitleTooltip: {
      type:    String,
      default: '',
    },

    annotationTitleTooltip: {
      type:    String,
      default: '',
    }
  },

  data() {
    return { toggler: true };
  },

  computed: {
    containerClass() {
      return `${ this.displaySideBySide ? 'row' : '' } ${ this.defaultContainerClass }`.trim();
    },

    sectionClass() {
      return `${ this.displaySideBySide ? 'col span-6' : 'row' } ${ this.defaultSectionClass }`.trim();
    },

    /**
     * Generate list of present keys which can be filtered based on existing label keys and system keys
     */
    protectedKeys() {
      return getPSALabels(this.value);
    },
  }
};
</script>
<template>
  <div :class="containerClass">
    <div class="labels">
      <div class="labels__header">
        <h2>
          <t k="labels.labels.title" />
        </h2>
        <ToggleSwitch
          v-if="protectedKeys.length"
          v-model="toggler"
          name="label-system-toggle"
          :on-label="t('labels.labels.show')"
        />
      </div>
      <p class="helper-text mt-20 mb-20">
        <t k="labels.labels.description" />
      </p>
      <div :class="sectionClass">
        <KeyValue
          key="labels"
          :value="value.labels"
          :protected-keys="protectedKeys"
          :toggle-filter="toggler"
          :add-label="t('labels.addLabel')"
          :mode="mode"
          :read-allowed="false"
          :value-can-be-empty="true"
          @input="value.setLabels($event)"
        />
      </div>
    </div>
    <div class="spacer" />
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        :value="value.annotations"
        :add-label="t('labels.addAnnotation')"
        :mode="mode"
        :title="t('labels.annotations.title')"
        :title-protip="annotationTitleTooltip"
        :read-allowed="false"
        :value-can-be-empty="true"
        @input="value.setAnnotations($event)"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.labels {
  &__header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
  }
}
</style>

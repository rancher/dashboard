<script>
import KeyValue from '@shell/components/Form/KeyValue';
import { ToggleSwitch } from '@components/form/ToggleSwitch';
import { filter, keys } from 'lodash';
import { systemKeys } from '@shell/config/system-keys';

export default {
  components: { KeyValue, ToggleSwitch },

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
    return {
      /**
       * Toggle system labels into the list
       */
      toggler: false
    };
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
      return filter(keys(this.value.labels), key => systemKeys.includes(key));
    }
  }
};
</script>
<template>
  <div
    class="labels"
    :class="containerClass"
  >
    <!-- Labels -->
    <div class="labels__label">
      <div class="labels__label__header">
        <h3>
          <t k="labels.labels.title" />
        </h3>
        <ToggleSwitch
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
          :title-protip="labelTitleTooltip"
          :read-allowed="false"
          :value-can-be-empty="true"
          @input="value.setLabels($event)"
        />
      </div>
    </div>
    <div class="spacer" />

    <!-- Annotations -->
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
  &__label {
    &__header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid var(--border);
      margin-bottom: 1em;
    }
  }
}
</style>

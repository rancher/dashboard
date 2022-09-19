<script>
// Added by Verrazzano
import KeyValue from '@shell/components/form/KeyValue';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  name:       'Labels',
  components: { KeyValue },
  mixins:     [VerrazzanoHelper],
  props:      {
    // parent object (e.g., Container)
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:     String,
      required: true,
    },
    suppressLabelsTitle: {
      type:    Boolean,
      default: false
    },
    suppressAnnotationsTitle: {
      type:    Boolean,
      default: false
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
    },
    annotationsTitle() {
      return this.suppressAnnotationsTitle ? undefined : this.t('verrazzano.common.titles.annotations');
    },
    labelsTitle() {
      return this.suppressLabelsTitle ? undefined : this.t('verrazzano.common.titles.labels');
    },
  }
};
</script>

<template>
  <div :class="containerClass">
    <div :class="sectionClass">
      <KeyValue
        key="labels"
        :value="getListField('labels')"
        :add-label="t('verrazzano.common.buttons.addLabel')"
        :mode="mode"
        :title="labelsTitle"
        :read-allowed="false"
        :value-can-be-empty="true"
        @input="setFieldIfNotEmpty('labels', $event)"
      />
    </div>
    <div class="spacer"></div>
    <div :class="sectionClass">
      <KeyValue
        key="annotations"
        :value="getListField('annotations')"
        :add-label="t('verrazzano.common.buttons.addAnnotation')"
        :mode="mode"
        :title="annotationsTitle"
        :read-allowed="false"
        :value-can-be-empty="true"
        @input="setFieldIfNotEmpty('annotations', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>

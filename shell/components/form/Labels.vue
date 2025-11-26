<script lang="ts">
import { pickBy, omitBy, mapValues } from 'lodash';
import { matchesSomeRegex } from '@shell/utils/string';
import { LABELS_TO_IGNORE_REGEX, ANNOTATIONS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { ToggleSwitch } from '@rc/Form/ToggleSwitch';
import { _VIEW } from '@shell/config/query-params';

export class Factory {
  private protectedKeys: string[] = [];
  private protectedRegexes: RegExp[] = [];
  private protectedWarning = '';

  private isProtected(key: string) {
    return this.protectedKeys.includes(key) || matchesSomeRegex(key, this.protectedRegexes);
  }

  private omitProtected(obj: object) {
    return omitBy(obj, (_, key) => this.isProtected(key));
  }

  private pickProtected(obj: object) {
    return pickBy(obj, (_, key) => this.isProtected(key));
  }

  private keyErrorMap(elems: object) {
    return mapValues(this.pickProtected(elems), () => this.protectedWarning);
  }

  constructor(protectedKeys: string[], protectedRegexes: RegExp[], msg: string, initValue: object) {
    // Init privates
    this.protectedKeys = protectedKeys || [];
    this.protectedRegexes = protectedRegexes || [];
    this.protectedWarning = msg || '';

    this.initValue = initValue || {};
    this.value = this.omitProtected(this.initValue);
    this.keyErrors = this.keyErrorMap(this.value);
    this.hasProtectedKeys = Object.keys(this.pickProtected(this.initValue)).length > 0;
  }

  initValue: object = {};
  value: object = {};
  keyErrors: object = {};
  hasProtectedKeys = false;

  /**
   * Updates resource's model and discard new protected keys
   * Old protected keys remain untouched on edit
   *
   * @param value edited labels/annotations
   * @param callbackFn function to set model's labels/annotations
   */
  update(value: Record<string, string>, callbackFn: (value: object) => void) {
    const neu = value || {};

    callbackFn({
      ...this.omitProtected(neu),
      ...this.pickProtected(this.initValue),
    });

    this.value = neu;
    this.keyErrors = this.keyErrorMap(neu);
  }
}

interface DataType {
  labels: Factory,
  annotations: Factory,
  toggler: boolean,
}

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
    },

    showAnnotations: {
      type:    Boolean,
      default: true,
    },

    showLabelTitle: {
      type:    Boolean,
      default: true,
    },

    addIcon: {
      type:    String,
      default: '',
    },
  },

  data(): DataType {
    const protectedWarning = this.t('labels.protectedWarning');

    return {
      labels:      new Factory(this.value.systemLabels, LABELS_TO_IGNORE_REGEX, protectedWarning, this.value.labels),
      annotations: new Factory(this.value.systemAnnotations, ANNOTATIONS_TO_IGNORE_REGEX, protectedWarning, this.value.annotations),
      toggler:     false
    };
  },

  computed: {
    containerClass() {
      return `${ this.displaySideBySide ? 'row' : '' } ${ this.defaultContainerClass }`.trim();
    },

    sectionClass() {
      return `${ this.displaySideBySide ? 'col span-6' : 'row' } ${ this.defaultSectionClass }`.trim();
    },

    columnsClass() {
      return `${ this.displaySideBySide ? 'col span-6' : 'row' }`.trim();
    },

    showToggler() {
      return this.mode === _VIEW && (this.labels.hasProtectedKeys || this.annotations.hasProtectedKeys);
    }
  }
};
</script>
<template>
  <div :class="containerClass">
    <div :class="defaultSectionClass">
      <div class="labels">
        <div class="labels__header">
          <h3 v-if="showLabelTitle">
            <t k="labels.labels.title" />
          </h3>
          <ToggleSwitch
            v-if="showToggler"
            v-model:value="toggler"
            name="label-system-toggle"
            :on-label="t('labels.labels.show')"
          />
        </div>
        <p class="mt-10 mb-10">
          <t k="labels.labels.description" />
        </p>
        <div :class="columnsClass">
          <slot name="labels">
            <KeyValue
              key="labels"
              :value="toggler ? labels.initValue : labels.value"
              :add-label="t('labels.addLabel')"
              :add-icon="addIcon"
              :mode="mode"
              :read-allowed="false"
              :value-can-be-empty="true"
              :key-errors="labels.keyErrors"
              @update:value="labels.update($event, (x) => value.setLabels(x))"
            />
          </slot>
        </div>
      </div>
    </div>
    <div class="spacer" />
    <div
      v-if="showAnnotations"
      :class="sectionClass"
    >
      <KeyValue
        key="annotations"
        :value="toggler ? annotations.initValue : annotations.value"
        :add-label="t('labels.addAnnotation')"
        :add-icon="addIcon"
        :mode="mode"
        :title="t('labels.annotations.title')"
        :title-protip="annotationTitleTooltip"
        :read-allowed="false"
        :value-can-be-empty="true"
        :key-errors="annotations.keyErrors"
        @update:value="annotations.update($event, (x) => value.setAnnotations(x))"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.labels {
  &__header {
    display: flex;
    justify-content: space-between;
  }
}
</style>

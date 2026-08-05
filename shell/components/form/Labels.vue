<script lang="ts">
import { pickBy, omitBy, mapValues } from 'lodash';
import { matchesSomeRegex } from '@shell/utils/string';
import { LABELS_TO_IGNORE_REGEX, ANNOTATIONS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import KeyValue from '@shell/components/form/KeyValue.vue';
import { ToggleSwitch } from '@components/Form/ToggleSwitch';
import { _VIEW } from '@shell/config/query-params';

export class Factory {
  private protectedKeys: string[] = [];
  private protectedRegexes: RegExp[] = [];
  private exceptedKeys: string[] = [];
  private readOnlyKeys: string[] = [];
  private protectedWarning = '';
  private readOnlyWarning = '';

  private isProtected(key: string) {
    // exceptions to ANNOTATIONS_TO_IGNORE_REGEX, as defined in resource models' allowedSystemAnnotationKeys
    if (this.exceptedKeys.includes(key)) {
      return false;
    }

    return this.protectedKeys.includes(key) || matchesSomeRegex(key, this.protectedRegexes);
  }

  // keys in this list are visible in forms but changes will not be persisted (a warning is shown communicating this)
  private isReadOnly(key: string) {
    return this.readOnlyKeys.includes(key);
  }

  private omitProtected(obj: object) {
    return omitBy(obj, (_, key) => this.isProtected(key));
  }

  private pickProtected(obj: object) {
    return pickBy(obj, (_, key) => this.isProtected(key));
  }

  private keyErrorMap(elems: object) {
    return {
      ...mapValues(this.pickProtected(elems), () => this.protectedWarning),
      ...mapValues(pickBy(elems, (_, key) => this.isReadOnly(key)), () => this.readOnlyWarning),
    };
  }

  constructor(protectedKeys: string[], protectedRegexes: RegExp[], msg: string, initValue: object, exceptedKeys: string[] = [], readOnlyKeys: string[] = [], readOnlyMsg = '') {
    // Init privates
    this.protectedKeys = protectedKeys || [];
    this.protectedRegexes = protectedRegexes || [];
    this.exceptedKeys = exceptedKeys || [];
    this.readOnlyKeys = readOnlyKeys || [];
    this.protectedWarning = msg || '';
    this.readOnlyWarning = readOnlyMsg || msg || '';

    this.initValue = initValue || {};
    this.value = this.omitProtected(this.initValue);

    // Read-only keys are visible in the value but shown with a warning and preserved on save
    const readOnlyFromInit = pickBy(this.initValue, (_, key) => this.isReadOnly(key));

    this.value = { ...this.value, ...readOnlyFromInit };
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
      ...omitBy(this.omitProtected(neu), (_, key) => this.isReadOnly(key)), // remove new labels/annotations that are readOnly
      ...this.pickProtected(this.initValue),
      ...pickBy(this.initValue, (_, key) => this.isReadOnly(key)), // add in initial labels/annotations that are readOnly
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

    showLabelDescription: {
      type:    Boolean,
      default: true,
    },

    addIcon: {
      type:    String,
      default: '',
    },

    compact: {
      type:    Boolean,
      default: false
    },

    useRcButton: {
      type:    Boolean,
      default: false
    }
  },

  data(): DataType {
    const protectedWarning = this.t('labels.protectedWarning');
    const readOnlyWarning = this.t('labels.readOnlyWarning');

    return {
      labels:      new Factory(this.value.systemLabels, LABELS_TO_IGNORE_REGEX, protectedWarning, this.value.labels),
      annotations: new Factory(
        this.value.systemAnnotations,
        ANNOTATIONS_TO_IGNORE_REGEX,
        protectedWarning,
        this.value.annotations,
        this.value.allowedSystemAnnotationKeys,
        this.value.readOnlyAnnotationKeys,
        readOnlyWarning
      ),
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
          <component
            :is="!compact ? 'h3' : 'h4'"
            v-if="showLabelTitle"
          >
            <t k="labels.labels.title" />
          </component>
          <ToggleSwitch
            v-if="showToggler"
            v-model:value="toggler"
            name="label-system-toggle"
            :on-label="t('labels.labels.show')"
          />
        </div>
        <p
          v-if="showLabelDescription"
          class="mt-10 mb-10"
        >
          <t k="labels.labels.description" />
        </p>
        <div :class="columnsClass">
          <slot name="labels">
            <KeyValue
              key="labels"
              data-testid="labels-keyvalue"
              :value="toggler ? labels.initValue : labels.value"
              :add-label="t('labels.addLabel')"
              :add-icon="addIcon"
              :mode="mode"
              :read-allowed="false"
              :value-can-be-empty="true"
              :key-errors="labels.keyErrors"
              :use-rc-button="useRcButton"
              @update:value="labels.update($event, (x) => value.setLabels(x))"
            />
          </slot>
        </div>
      </div>
    </div>
    <div :class="compact ? 'compact-spacer' : 'spacer'" />
    <div
      v-if="showAnnotations"
      :class="sectionClass"
    >
      <KeyValue
        key="annotations"
        data-testid="annotations-keyvalue"
        :value="toggler ? annotations.initValue : annotations.value"
        :add-label="t('labels.addAnnotation')"
        :add-icon="addIcon"
        :mode="mode"
        :title="t('labels.annotations.title')"
        :title-protip="annotationTitleTooltip"
        :read-allowed="false"
        :value-can-be-empty="true"
        :key-errors="annotations.keyErrors"
        :disabled-keys="value.readOnlyAnnotationKeys || []"
        :use-rc-button="useRcButton"
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

.compact-spacer {
  height: 24px;
}
</style>

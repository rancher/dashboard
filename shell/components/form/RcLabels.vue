<script setup lang="ts">
/**
 * A version of Labels laid out for use inside RcSection: the header,
 * description and key/value lists are stacked with RcContentGroup and the
 * lists use RcKeyValue, so everything sits 16px apart.
 *
 * Unlike Labels it has no "Show System Labels and Annotations" toggle; the
 * parent owns that toggle and passes its state in via showSystemKeys.
 */
import { reactive } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { LABELS_TO_IGNORE_REGEX, ANNOTATIONS_TO_IGNORE_REGEX } from '@shell/config/labels-annotations';
import { Factory } from '@shell/components/form/Labels.vue';
import RcKeyValue from '@shell/components/form/RcKeyValue.vue';
import { RcContentGroup } from '@components/Layout';

const props = withDefaults(defineProps<{
  value: any;
  mode: string;
  annotationTitleTooltip?: string;
  showLabels?: boolean;
  showAnnotations?: boolean;
  showLabelTitle?: boolean;
  showAnnotationTitle?: boolean;
  showLabelDescription?: boolean;
  addIcon?: string;
  compact?: boolean;
  useRcButton?: boolean;
  showSystemKeys?: boolean;
}>(), {
  annotationTitleTooltip: '',
  showLabels:             true,
  showAnnotations:        true,
  showLabelTitle:         true,
  showAnnotationTitle:    true,
  showLabelDescription:   true,
  addIcon:                '',
  compact:                false,
  useRcButton:            false,
  showSystemKeys:         false,
});

const store = useStore();
const { t } = useI18n(store);

const protectedWarning = t('labels.protectedWarning');
const readOnlyWarning = t('labels.readOnlyWarning');

const labels = reactive(new Factory(props.value.systemLabels, LABELS_TO_IGNORE_REGEX, protectedWarning, props.value.labels));
const annotations = reactive(new Factory(
  props.value.systemAnnotations,
  ANNOTATIONS_TO_IGNORE_REGEX,
  protectedWarning,
  props.value.annotations,
  props.value.allowedSystemAnnotationKeys,
  props.value.readOnlyAnnotationKeys,
  readOnlyWarning
));
</script>

<template>
  <RcContentGroup class="rc-labels">
    <RcContentGroup v-if="showLabels">
      <component
        :is="!compact ? 'h3' : 'h4'"
        v-if="showLabelTitle"
      >
        {{ t('labels.labels.title') }}
      </component>
      <p v-if="showLabelDescription">
        {{ t('labels.labels.description') }}
      </p>
      <slot name="labels">
        <RcKeyValue
          key="labels"
          data-testid="labels-keyvalue"
          :value="showSystemKeys ? labels.initValue : labels.value"
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
    </RcContentGroup>
    <RcKeyValue
      v-if="showAnnotations"
      key="annotations"
      data-testid="annotations-keyvalue"
      :value="showSystemKeys ? annotations.initValue : annotations.value"
      :add-label="t('labels.addAnnotation')"
      :add-icon="addIcon"
      :mode="mode"
      :title="showAnnotationTitle ? t('labels.annotations.title') : undefined"
      :title-protip="annotationTitleTooltip"
      :read-allowed="false"
      :value-can-be-empty="true"
      :key-errors="annotations.keyErrors"
      :disabled-keys="value.readOnlyAnnotationKeys || []"
      :use-rc-button="useRcButton"
      @update:value="annotations.update($event, (x) => value.setAnnotations(x))"
    />
  </RcContentGroup>
</template>

<style lang="scss" scoped>
.rc-labels {
  h3, h4, p {
    margin: 0;
  }
}
</style>

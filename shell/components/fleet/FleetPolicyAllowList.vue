<script setup lang="ts">
import { useStore } from 'vuex';
import { RcSection } from '@components/RcSection';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { useI18n } from '@shell/composables/useI18n';

/**
 * The nested panel a Fleet Policy section reveals once the user restricts a set of
 * names (service accounts, client secrets, Helm secrets) rather than allowing all.
 */
const props = withDefaults(defineProps<{
  value: string[];
  title: string;
  label: string;
  options?: string[];
  mode: string;
  dataTestid: string;
}>(), { options: () => [] });

const emit = defineEmits<{(e: 'update:value', value: string[]): void}>();

const { t } = useI18n(useStore());

const update = (value: string[]) => emit('update:value', value || []);
</script>

<template>
  <RcSection
    :title="props.title"
    mode="with-header"
    type="secondary"
    expandable
    :data-testid="`${ props.dataTestid }-section`"
  >
    <LabeledSelect
      :value="props.value"
      :options="props.options"
      :label="props.label"
      :placeholder="t('fleet.policy.placeholder.allowList')"
      :mode="props.mode"
      :multiple="true"
      :taggable="true"
      :searchable="true"
      :close-on-select="false"
      :required="true"
      :data-testid="props.dataTestid"
      @update:value="update"
    />
  </RcSection>
</template>

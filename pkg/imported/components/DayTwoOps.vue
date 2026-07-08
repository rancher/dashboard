<script setup>
import { computed } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import Banner from '@components/Banner/Banner.vue';
import { RadioGroup } from '@components/Form/Radio';
import { useStore } from 'vuex';
import { DEFAULT } from '@pkg/imported/util/shared.ts';

defineOptions({ name: 'DayTwoOps' });
const props = defineProps({
  mode: {
    type:    String,
    default: _EDIT
  },
  value: {
    type:    String,
    default: DEFAULT
  },
  globalSetting: {
    type:     Boolean,
    required: true,
  },
  oldValue: {
    type:    String,
    default: DEFAULT
  },
});

defineEmits(['update:value']);
const store = useStore();
const t = store.getters['i18n/t'];

const globalConfigurationText = computed(() => {
  return !props.globalSetting ? t('imported.basics.dayTwoOpsEnabled.globallyDisabled', {}, true) : t('imported.basics.dayTwoOpsEnabled.globallyEnabled', {}, true);
});
const isEdit = computed(() => props.mode === _EDIT);
const dayTwoOptions = computed(() => {
  const defaultLabel = props.globalSetting ? t('imported.basics.dayTwoOpsEnabled.globalEnabledDefault') : t('imported.basics.dayTwoOpsEnabled.globalDisabledDefault');

  return [
    { value: DEFAULT, label: defaultLabel },
    { value: 'true', label: t('imported.basics.dayTwoOpsEnabled.enabled') },
    { value: 'false', label: t('imported.basics.dayTwoOpsEnabled.disabled') },
  ];
});
const clusterConfigurationText = computed(() => {
  if (props.value === 'true') {
    return t('imported.basics.dayTwoOpsEnabled.summary.willEnable', {}, true);
  }
  if (props.value === 'false') {
    return t('imported.basics.dayTwoOpsEnabled.summary.willDisable', {}, true);
  }

  return !props.globalSetting ? t('imported.basics.dayTwoOpsEnabled.summary.canEnable', {}, true) : '';
});
const dayTwoOpsInfo = computed(() => {
  if (!isEdit.value) {
    return '';
  }
  if (props.oldValue === DEFAULT && props.value !== DEFAULT) {
    return t('imported.basics.dayTwoOpsEnabled.banner.edit.defaultToNonDefault', {}, true);
  } else if (props.oldValue !== DEFAULT && props.value === DEFAULT) {
    return t('imported.basics.dayTwoOpsEnabled.banner.edit.nonDefaultToDefault', {}, true);
  }

  return '';
});
const showBanner = computed(() => {
  const changedInvolvingDefault = (props.oldValue === DEFAULT && props.value !== DEFAULT) || (props.oldValue !== DEFAULT && props.value === DEFAULT);

  return isEdit.value && changedInvolvingDefault;
});
</script>

<template>
  <div class="mt-10">
    <h3>{{ t('imported.basics.dayTwoOpsEnabled.title') }}</h3>
    <Banner
      v-if="showBanner"
      color="info"
      data-testid="day-two-ops-banner"
    >
      {{ dayTwoOpsInfo }}
    </Banner>
    <RadioGroup
      :value="value"
      :mode="mode"
      :options="dayTwoOptions"
      name="dayTwoOps"
      data-testid="imported-day-two-ops-radio"
      @update:value="$emit('update:value', $event)"
    />
    <div class="col mt-10">
      <label
        v-clean-html="globalConfigurationText"
        class="summary"
      /><br>
      <label
        v-clean-html="clusterConfigurationText"
        class="summary mb-10"
      />
    </div>
  </div>
</template>

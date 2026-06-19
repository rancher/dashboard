<script setup>
import { computed } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import { Checkbox } from '@components/Form/Checkbox';
import { useStore } from 'vuex';

defineOptions({ name: 'DayTwoOps' });

const props = defineProps({
  mode: {
    type:    String,
    default: _EDIT
  },
  value: {
    type:    Boolean,
    default: false
  },
  globalSetting: {
    type:     Boolean,
    required: true,
  }
});

const emit = defineEmits(['update:value']);
const store = useStore();
const t = store.getters['i18n/t'];

const globalConfigurationText = computed(() => {
  return !props.globalSetting ? t('imported.basics.dayTwoOpsEnabled.globallyDisabled', {}, true) : t('imported.basics.dayTwoOpsEnabled.globallyEnabled', {}, true);
});
</script>

<template>
  <div class="mt-10">
    <h3 v-t="'imported.basics.dayTwoOpsEnabled.title'" />
    <div class="col">
      <Checkbox
        :value="value"
        :mode="mode"
        :label="t('imported.basics.dayTwoOpsEnabled.label')"
        :tooltip="globalConfigurationText"
        @update:value="emit('update:value', $event)"
      />
    </div>
  </div>
</template>

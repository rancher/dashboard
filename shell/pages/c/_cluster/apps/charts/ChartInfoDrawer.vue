<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme.vue';
import { RcDrawer } from '@components/RcDrawer';
import RcButton from '@components/RcButton/RcButton.vue';
import { useI18n } from '@shell/composables/useI18n';

defineProps<{ versionInfo: Record<string, any> }>();
const emit = defineEmits(['close', 'dock']);

const store = useStore();
const i18n = useI18n(store);

const title = computed(() => i18n.t('catalog.install.steps.helmValues.chartInfo.label'));

const dock = () => {
  emit('dock');
  emit('close');
};
</script>

<template>
  <RcDrawer
    :title="title"
    @close="emit('close')"
  >
    <template #header-actions>
      <RcButton
        variant="secondary"
        left-icon="dock"
        data-testid="chart-info-dock"
        @click="dock"
      >
        {{ i18n.t('catalog.install.slideIn.dock') }}
      </RcButton>
    </template>
    <ChartReadme :version-info="versionInfo" />
  </RcDrawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import DrawerCard from '@shell/components/Drawer/DrawerCard.vue';
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
  <Drawer
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      {{ title }}
    </template>
    <template #body>
      <DrawerCard>
        <ChartReadme :version-info="versionInfo" />
      </DrawerCard>
    </template>
    <template #additional-actions>
      <RcButton
        variant="secondary"
        size="large"
        data-testid="chart-info-dock"
        @click="dock"
      >
        {{ i18n.t('catalog.install.slideIn.dock') }}
      </RcButton>
    </template>
  </Drawer>
</template>

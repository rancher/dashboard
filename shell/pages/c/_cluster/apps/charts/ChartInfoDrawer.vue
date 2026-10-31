<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import ChartReadme from '@shell/components/ChartReadme.vue';
import { RcDrawer, RcDrawerHeader } from '@components/RcDrawer';
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
    <template #header>
      <RcDrawerHeader>
        <template #actions>
          <button
            v-clean-tooltip="i18n.t('catalog.install.slideIn.dock')"
            type="button"
            class="btn role-link dock"
            :aria-label="i18n.t('catalog.install.slideIn.dock')"
            data-testid="chart-info-dock"
            @click="dock"
          >
            <i class="icon icon-dock" />
          </button>
        </template>
      </RcDrawerHeader>
    </template>
    <ChartReadme :version-info="versionInfo" />
  </RcDrawer>
</template>

<style lang="scss" scoped>
.dock {
  display: inline-flex;
  flex-shrink: 0;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--body-text);
}
</style>

<script lang="ts">
import Card from '@shell/components/Resource/Detail/Card/index.vue';
import PercentageBar from '@shell/components/Resource/Detail/PercentageBar.vue';
import { useI18n } from '@shell/composables/useI18n';
import { computed } from 'vue';
import { useStore } from 'vuex';

export interface Props {
    title: string;
    unit?: string;
    used: number;
    usedFormatter?: (n: number) => string;
    available: number;
    availableFormatter?: (n: number) => string
}
</script>
<script setup lang="ts">
const store = useStore();
const i18n = useI18n(store);

const props = withDefaults(
  defineProps<Props>(),
  {
    usedFormatter:      (n: number) => n.toString(),
    availableFormatter: (n: number) => n.toString(),
    unit:               undefined
  }
);

const percentage = computed(() => {
  const numerator = props.used || 0;
  const denominator = props.available || 0;

  return denominator === 0 ? 0 : Math.floor((numerator / denominator) * 100);
});

const used = computed(() => props.usedFormatter(props.used));
const available = computed(() => props.availableFormatter(props.available));
</script>

<template>
  <Card :title="props.title">
    <div class="numerical">
      <div class="used">
        {{ i18n.t('component.resource.detail.card.resourceUsage.used') }}
      </div>
      <div class="data">
        <span class="amount">{{ i18n.t('component.resource.detail.card.resourceUsage.amount', {used, available}) }}</span>
        <span
          v-if="props.unit"
          class="unit"
        >
          {{ props.unit }}
        </span>
        <span class="spacer">/</span>
        <span class="percentage">{{ percentage }}%</span>
      </div>
    </div>
    <PercentageBar :percent="percentage" />
  </Card>
</template>

<style lang="scss" scoped>
.numerical {
  display: flex;
  flex-direction: row;
  justify-content: space-between;

  margin-bottom: 8px;

  .spacer {
    margin: 0 8px;
  }

  .percentage {
    font-weight: bold;
  }
}
</style>

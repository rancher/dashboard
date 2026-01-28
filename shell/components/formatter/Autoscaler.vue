<script setup lang="ts">
import PopoverCard from '@shell/components/PopoverCard.vue';
import { computed } from 'vue';
import RcButton from '@components/RcButton/RcButton.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';
import AutoscalerCard from '@shell/components/AutoscalerCard.vue';

export interface Props {
  value: string | boolean;
  row: any;
}

export interface Detail {
  label: string;
  value?: string | { component: any; props: any };
}

const props = withDefaults(defineProps<Props>(), { value: true });
const store = useStore();
const i18n = useI18n(store);

const checked = computed(() => props.value === true || props.value === 'true');
const actionIcon = computed(() => props.row.isAutoscalerPaused ? 'icon-play' : 'icon-pause');
const actionText = computed(() => props.row.isAutoscalerPaused ? i18n.t('autoscaler.card.resume') : i18n.t('autoscaler.card.pause'));
const stopPropagation = (event: Event) => {
  // This is to prevent click events from getting to the table row which ends up selecting the row
  event.stopPropagation();
};
</script>

<template>
  <span
    v-if="checked"
    class="autoscaler"
    @click="stopPropagation"
  >
    <PopoverCard
      :card-title="i18n.t('autoscaler.card.title')"
      fallback-focus=".autoscaler .action"
    >
      <i class="icon icon-checkmark" />
      <template
        v-if="props.row.canExplore"
        #heading-action="{close}"
      >
        <RcButton
          v-if="row.canPauseResumeAutoscaler"
          variant="secondary"
          size="small"
          class="action"
          @click="() => {props.row.toggleAutoscalerRunner(); close()}"
        >
          <i :class="`icon ${actionIcon} icon-sm`" />
          {{ actionText }}
        </RcButton>
      </template>
      <template #card-body>
        <AutoscalerCard :value="props.row" />
      </template>
    </PopoverCard>
  </span>
  <span
    v-else
    class="text-muted autoscaler"
  >
    &mdash;
  </span>
</template>

<style lang="scss" scoped>
.autoscaler {
  &:deep() {
    .heading {
      height: 24px;

      .title {
        font-size: 16px;
        font-weight: 600;
        line-height: 24px;
      }
    }

    button.btn.action {
      line-height: 15px;
      font-size: 12px;
      height: 24px;
      min-height: initial;
      padding: 0 8px;

      i {
        margin-right: 8px;
      }
    }
  }
}
</style>

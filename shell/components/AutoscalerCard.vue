<script setup lang="ts">
import { computed, ComputedRef } from 'vue';
import { useFetch } from '@shell/components/Resource/Detail/FetchLoader/composables';
import { useInterval } from '@shell/composables/useInterval';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

export interface Props {
  value: any;
}

export interface Detail {
  label: string;
  value?: string | { component: any; props: any };
}

const props = defineProps<Props>();

const store = useStore();
const i18n = useI18n(store);

const fetch = useFetch(async() => {
  return await props.value.loadAutoscalerDetails();
});

// The backend only updates the configmap every 10 seconds and we don't cache the configmap in the stores
useInterval(() => fetch.value.refresh(), 10000);

const details: ComputedRef<Detail[]> = computed(() => fetch.value.data);
</script>

<template>
  <div class="autoscaler-card">
    <div
      v-if="fetch.loading && !fetch.refreshing"
      class="loading"
    >
      <i
        class="icon icon-lg icon-spinner icon-spin"
        :alt="i18n.t('autoscaler.card.loadingAlt')"
      />
    </div>

    <div
      v-else-if="fetch.data"
      class="details"
    >
      <div
        v-for="(detail) in details"
        :key="detail.label"
        class="detail"
      >
        <label
          v-if="detail.value"
          class="label text-deemphasized"
        >
          {{ detail.label }}
        </label>
        <h5 v-else-if="detail.label">
          {{ detail.label }}
        </h5>
        <div
          v-if="detail.value"
          class="value"
        >
          <component
            :is="detail.value.component"
            v-if="typeof detail.value === 'object'"
            v-bind="detail.value.props"
          />
          <span v-else>{{ detail.value }}</span>
        </div>
      </div>
    </div>
    <div
      v-else
      class="text-warning"
    >
      {{ i18n.t('autoscaler.card.loadingError') }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
.autoscaler-card {
width: 240px;

.loading {
    display: flex;
    justify-content: center;
}
.detail {
    display: flex;
    white-space: nowrap;
    width: 244px;

    &:not(:last-of-type) {
    margin-bottom: 8px;
    }

    label, .value {
    width: 50%;
    }
}

h5 {
    margin-bottom: 0;
    margin-top: 12px;
    font-size: 14px;
    font-weight: 600;
}
}
</style>

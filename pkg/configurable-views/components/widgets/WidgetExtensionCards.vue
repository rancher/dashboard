<script setup lang="ts">
import {
  computed, getCurrentInstance, watch, type Component, type ComponentOptionsMixin, type CSSProperties
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { useRouter } from 'vue-router';
import SimpleBox from '@shell/components/SimpleBox.vue';
import { MANAGEMENT } from '@shell/config/types';
import { ExtensionPoint, CardLocation } from '@shell/core/types';
import { getApplicableExtensionEnhancements } from '@shell/core/plugin-helpers';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import type { WidgetSpec } from '../../templating/types';

// EXTENSION CARDS — the cards extensions add to a cluster's dashboard, as the dashboard draws them.
//
// An extension adds one with `plugin.addCard(CardLocation.CLUSTER_DASHBOARD_CARD, …)`, optionally
// only for some clusters. The dashboard asks which apply to its own route and hands each card the
// cluster it is about; this asks the same question for the route of THIS widget's cluster's
// dashboard, hands the cards that cluster, and lays them out in the dashboard's own grid of boxes.

/** A card as the extension manager hands it back, with the label already translated. */
interface ExtensionCard {
  label?: string;
  component: Component;
  style?: CSSProperties;
}

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const { t } = useI18n(store);
const router = useRouter();
// The extension manager answers for a component - it reads `$extension` and `t` off it.
const self = getCurrentInstance()?.proxy as unknown as ComponentOptionsMixin | undefined;
const { cluster } = useWidgetCluster(() => props.widget);

const cards = computed<ExtensionCard[]>(() => {
  if (!cluster.value || !self) {
    return [];
  }

  const route = router.resolve({ name: 'c-cluster-explorer', params: { cluster: cluster.value } });

  return getApplicableExtensionEnhancements<ExtensionCard>(self, ExtensionPoint.CARD, CardLocation.CLUSTER_DASHBOARD_CARD, route);
});

// What each card is given: the management cluster, as the dashboard gives it `currentCluster`.
const resource = computed(() => store.getters['management/byId'](MANAGEMENT.CLUSTER, cluster.value));

watch(cluster, (id) => {
  if (id && !resource.value) {
    store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id }).catch(() => undefined);
  }
}, { immediate: true });
</script>

<template>
  <div class="wstock">
    <h3
      v-if="widget.title"
      class="wstock__title"
    >
      {{ widget.title }}
    </h3>

    <p
      v-if="!cluster"
      class="wstock__msg"
    >
      {{ t(NO_CLUSTER) }}
    </p>
    <p
      v-else-if="!cards.length"
      class="wstock__msg"
    >
      {{ t('configurableViews.widget.noExtensionCards') }}
    </p>

    <div
      v-else-if="resource"
      class="extension-card-container"
    >
      <SimpleBox
        v-for="(item, i) in cards"
        :key="`extensionCards${ i }`"
        class="extension-card"
        :style="item.style"
      >
        <h3>
          {{ item.label }}
        </h3>
        <component
          :is="item.component"
          :resource="resource"
        />
      </SimpleBox>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wstock {
  min-width: 0;

  &__title {
    font-size:   18px;
    font-weight: 600;
    line-height: 22px;
    margin:      0 0 12px;
  }

  &__msg {
    color:     var(--muted);
    font-size: 14px;
    margin:    0;
  }
}

// The dashboard's own grid of extension cards.
.extension-card-container {
  display:               grid;
  grid-column-gap:       15px;
  grid-row-gap:          20px;
  grid-template-columns: repeat(auto-fit, minmax(calc((100%/3) - 40px), 1fr));
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import WidgetCard from './WidgetCard.vue';
import { useWidgetCluster, NO_CLUSTER } from '../../composables/useWidgetCluster';
import { fetchComponentHealth, fetchAgentHealth, expectedAgents, type ServiceStatus } from '../../templating/widget-data';
import type { WidgetSpec } from '../../templating/types';

// COMPONENT STATUS — the row of chips under a cluster dashboard's cards: Etcd, Scheduler,
// Controller Manager, then the Rancher (Cattle) and Fleet agents, each healthy, warning or failing.
//
// The dashboard's own markup and styles, and its own rules for each chip (see widget-data), read
// from the cluster this widget names - so it follows the page on a dashboard, and works on the Home.
// A chip that is not healthy explains itself on hover; an agent chip then links to its deployment,
// in this widget's cluster.
//
// Like the dashboard, the agent chips spin while they are read and the rest do not wait for them:
// a cluster whose agent is down takes its time to say so.

const ICONS: Record<string, string> = {
  healthy:   'icon-checkmark',
  warning:   'icon-warning',
  unhealthy: 'icon-warning',
  loading:   'icon-spinner icon-spin',
};

const props = defineProps<{ widget: WidgetSpec }>();

const store = useStore();
const router = useRouter();
const { t } = useI18n(store);
const { cluster } = useWidgetCluster(() => props.widget);

const components = ref<ServiceStatus[] | null>(null);
// null = read and not there, so not shown.
const agents = ref<Record<string, ServiceStatus | null>>({});
const error = ref('');

const services = computed(() => [
  ...(components.value || []),
  ...Object.values(agents.value).filter((a): a is ServiceStatus => !!a),
]);

watch(cluster, async(id) => {
  components.value = null;
  agents.value = {};
  error.value = '';

  if (!id) {
    return;
  }

  // Each agent spins from the start and settles on its own.
  const expected = expectedAgents(id);

  agents.value = Object.fromEntries(expected.map((name) => [name, { name, state: 'loading' }]));
  expected.forEach((name) => {
    fetchAgentHealth(store, id, name).then((status) => {
      if (cluster.value === id) {
        agents.value = { ...agents.value, [name]: status };
      }
    });
  });

  try {
    const found = await fetchComponentHealth(store, id);

    if (cluster.value === id) {
      components.value = found;
    }
  } catch (e) {
    error.value = `Could not read the component status of cluster “${ id }”.`;
  }
}, { immediate: true });

function tooltip(s: ServiceStatus): string | undefined {
  return s.tooltip || (s.tooltipKey ? t(s.tooltipKey) : undefined);
}

function open(s: ServiceStatus): void {
  if (s.target) {
    router.push(s.target);
  }
}
</script>

<template>
  <WidgetCard
    v-if="!cluster || error"
    :title="widget.title"
    :error="error || NO_CLUSTER"
  />
  <div
    v-else
    class="wcs"
  >
    <div
      v-for="s in services"
      :key="s.name"
      v-clean-tooltip="tooltip(s)"
      class="k8s-service-status"
      :class="{ [s.state]: true }"
      @click="open(s)"
    >
      <i
        class="icon"
        :class="ICONS[s.state]"
      />
      <div class="label">
        {{ t(`clusterIndexPage.sections.componentStatus.component.${ s.name }.label`) }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// The dashboard's own chip styles (shell/pages/c/_cluster/explorer/index.vue), which are scoped to
// that page and so do not reach a widget. The first row's top margin is left to the grid's gap.
.k8s-service-status {
  align-items: center;
  border: 1px solid;
  border-color: var(--border);
  display: inline-flex;
  margin-bottom: 20px;

  .label {
    border-left: 1px solid var(--border);
  }

  &:not(:last-child) {
    margin-right: 20px;
  }

  > div {
    padding: 5px 20px;
  }

  > i {
    padding: 5px 10px;
    text-align: center;
  }

  &.unhealthy {
    border-color: var(--error-border);
    cursor: pointer;

    > i {
      color: var(--error);
    }
  }

  &.warning {
    cursor: pointer;

    > i {
      color: var(--warning);
    }
  }

  &.healthy > i {
    color: var(--success);
  }
}
</style>

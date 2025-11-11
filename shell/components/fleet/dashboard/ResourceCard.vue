<script lang="ts">
import { PropType } from 'vue';
import { clone } from '@shell/utils/object';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import { RcItemCard } from '@components/RcItemCard';
import ResourceCardSummary from '@shell/components/fleet/dashboard/ResourceCardSummary.vue';
import FleetUtils from '@shell/utils/fleet';
import { FleetDashboardState, FleetResourceState } from '@shell/types/fleet';

export default {

  name: 'FleetDashboardResourceCard',

  emits: ['click'],

  components: {
    ActionMenu,
    RcItemCard,
    ResourceCardSummary,
  },

  props: {
    value: {
      type:     Object,
      required: true
    },

    statePanel: {
      type:     Object as PropType<FleetDashboardState>,
      required: true
    },
  },

  computed: {
    resourcesDefaultStates(): FleetResourceState | object {
      try {
        return FleetUtils.getResourcesDefaultState(this.$store.getters['i18n/withFallback'], 'fleet.fleetSummary.state');
      } catch (error) {
        return {};
      }
    },

    statuses() {
      const state = this.statePanel;

      if (state.id === 'success') {
        if (this.noClusters) {
          return [{
            id:          state.id,
            icon:        'icon-warning',
            customColor: '#DAC342',
            tooltip:     {},
            handleClick: () => {},
          }];
        }

        return [];
      }

      return [{
        id:          state.id,
        icon:        state.icon,
        color:       '',
        customColor: state.color,
        tooltip:     {},
        handleClick: () => {},
      }];
    },

    /**
     * Returns the count of the status for each resource in the GitRepo
     */
    resourceCounts() {
      const out: Record<string, FleetResourceState> = clone(this.resourcesDefaultStates);

      const resourceStatuses: Record<string, number> = this.value.allResourceStatuses;

      Object.entries(resourceStatuses.states)
        .filter(([_, count]) => count > 0)
        .forEach(([state, count]) => {
          const k = state?.toLowerCase();

          if (out[k]) {
            out[k].count += count;
          } else {
            out.unknown.count += count;
          }
        });

      return Object.values(out).reduce((acc, { label, count }) => {
        if (count > 0) {
          return [...acc, { label, count }];
        }

        return acc;
      }, [] as FleetResourceState[]).reverse();
    },

    resourcesTooltip() {
      return this.resourceCounts.reduce((acc, state, i) => `${ acc }${ i > 0 ? '<br>' : '' }${ state.label }: ${ state.count }`, '');
    },

    noClusters() {
      return !this.value.status?.desiredReadyClusters;
    },

    nameTooltip() {
      if (this.value.nameDisplay?.length >= 15) {
        return this.value.nameDisplay;
      }

      return null;
    }
  },

  methods: {
    select(value: PointerEvent) {
      const elem = value?.target as HTMLElement;

      if (elem?.tagName === 'A' || elem?.tagName === 'BUTTON' || elem?.className.includes('icon icon-actions')) {
        return;
      }

      this.$emit('click');
    },
  }
};
</script>

<template>
  <RcItemCard
    :id="`${ value.metadata.namespace }-${ value.type }-${ value.id }`"
    class="dashboard-resource-card"
    variant="small"
    :header="{
      title: { text: value.nameDisplay },
      statuses,
    }"
    :content="{}"
    :value="value"
    @click="select"
    @keydown.self.enter.stop.prevent="select"
    @keydown.self.space.stop.prevent="$router.push(value.detailLocation)"
  >
    <template #item-card-image>
      <i
        class="icon-lg"
        :class="value.dashboardIcon"
      />
    </template>
    <template #item-card-actions>
      <ActionMenu
        :resource="value"
        :button-aria-label="t('sortableTable.tableActionsLabel', { resource: value?.id || '' })"
      />
    </template>
    <template #item-card-content>
      <ResourceCardSummary
        v-clean-tooltip="{content: resourcesTooltip, triggers: ['hover']}"
        :value="value"
        :no-clusters="noClusters"
      />
    </template>
  </RcItemCard>
</template>

<style lang="scss" scoped>
  .dashboard-resource-card {
    margin: 1px;
    height: 100%;
  }

  .icon-lg {
    font-size: 25px;
    margin-right: 8px;
  }

  // .item-card-body {
  //   width: -webkit-fill-available;
  // }
</style>

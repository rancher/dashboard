<script>
import { clone } from '@shell/utils/object';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import RcItemCard from '@shell/components/cards/RcItemCard';
import ResourceCardSummary from '@shell/components/fleet/dashboard/ResourceCardSummary.vue';
import FleetUtils from '@shell/utils/fleet';

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
      type:     Object,
      required: true
    },
  },

  data() {
    return { resourcesDefaultStates: FleetUtils.getResourcesDefaultState(this.$store.getters['i18n/withFallback'], 'fleet.fleetSummary.state') };
  },

  computed: {
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

    resourceCounts() {
      const out = clone(this.resourcesDefaultStates);

      const resourceStatuses = this.value.allResourceStatuses;

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
      }, []).reverse();
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
    select(value) {
      const elem = value?.srcElement;

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
      image: {},
      statuses,
    }"
    :content="{}"
    :value="value"
    :clickable="true"
    @click="select"
    @keydown.enter.stop.prevent="select"
    @keydown.space.stop.prevent="$router.push(value.detailLocation)"
  >
    <template #item-card-image>
      <i
        class="icon-lg"
        :class="value.dashboardIcon"
      />
    </template>
    <template #item-card-header-title>
      <router-link
        v-clean-tooltip="{content: nameTooltip, triggers: ['hover']}"
        class="resource-name ml-5"
        role="link"
        tabindex="-1"
        :aria-label="value.nameDisplay"
        :to="value.detailLocation"
      >
        {{ value.nameDisplay }}
      </router-link>
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

    :deep() .item-card-body {
      width: -webkit-fill-available;

      .item-card-header {
        font-size: medium;
        margin-bottom: 5px;
      }
    }

    .resource-name {
      max-width: 150px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 0px;
      line-height: 24px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }

  .icon-lg {
    font-size: 25px;
  }
</style>

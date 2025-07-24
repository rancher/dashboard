<script lang="ts">
import { PropType } from 'vue';
import { FLEET } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FleetResources from '@shell/components/fleet/FleetResources.vue';
import { FleetDashboardState } from '@shell/types/fleet';
import FleetApplicationSource from '@shell/components/formatter/FleetApplicationSource.vue';
import Drawer from '@shell/components/Drawer/Chrome.vue';

export default {
  name: 'FleetDashboardResourceDetails',

  components: {
    Drawer,
    LabeledSelect,
    FleetResources,
    FleetApplicationSource,
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

    workspace: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      FLEET,
      clusterId:      '',
      detailLocation: {
        ...this.value._detailLocation,
        name: 'c-cluster-fleet-application-resource-namespace-id'
      }
    };
  },

  mounted() {
    this.clusterId = this.clusters[0]?.value || '';
  },

  computed: {
    clusters() {
      return this.value.targetClusters.map((cluster: { id: string, nameDisplay: string }) => ({
        label: cluster.nameDisplay,
        value: cluster.id
      }));
    },

    noResources() {
      return !this.value.resourcesStatuses?.length;
    },
  },

  methods: {
    closePanel() {
      this.$store.commit('slideInPanel/close');
    }
  }
};
</script>

<template>
  <Drawer
    class="details-panel"
    :ariaTarget="value.id"
    @close="closePanel"
  >
    <template #title>
      <div
        class="header"
        :data-testid="'fleet-dashboard-resource-details-header'"
      >
        <h3 class="title">
          <i :class="value.dashboardIcon" />
          <router-link
            class="label"
            :to="detailLocation"
          >
            {{ value.id }}
          </router-link>
          <i
            v-if="statePanel.id !== 'success'"
            class="ml-5 state-icon"
            :class="statePanel.icon"
            :style="{ color: statePanel.color }"
          />
        </h3>
      </div>
    </template>
    <template #body>
      <h4>
        {{ t('fleet.dashboard.source') }}
      </h4>
      <div class="mb-15">
        <FleetApplicationSource
          v-if="value.source.value"
          :row="value"
        />
        <div
          v-else
          class="text-muted"
        >
          &mdash;
        </div>
      </div>

      <h4>
        {{ t('fleet.dashboard.resources') }}
      </h4>
      <FleetResources
        :rows="value.resourcesStatuses"
        :cluster-id="clusterId"
        :search="!noResources"
      >
        <template
          v-if="!noResources"
          #header-left
        >
          <div class="row">
            <div class="col span-10">
              <LabeledSelect
                v-model:value="clusterId"
                :label="t('fleet.cluster.label')"
                :options="clusters"
                :mode="'edit'"
                :disabled="workspace.id === 'fleet-local'"
              />
            </div>
          </div>
        </template>
      </FleetResources>
    </template>
  </Drawer>
</template>

<style lang="scss">
  .details-panel {

    .sortable-table-header {
      .fixed-header-actions {
        align-items: center;
      }
    }

    .header {
      display: flex;
      align-items: center;

      .title {
        display: flex;
        align-items: center;
        flex: 1;
        margin-bottom: 0;

        .icon {
          font-size: 2em;
          margin-right: 16px;
        }

        .label {
          margin-right: 8px;
        }

        .state-icon {
          font-size: 1.5em;
        }
      }
    }
  }

  .col {
    .labeled-select {
      min-width: 250px;
    }
  }
</style>

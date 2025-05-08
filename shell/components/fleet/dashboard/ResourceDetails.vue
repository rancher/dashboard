<script>
import { FLEET } from '@shell/config/types';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FleetResources from '@shell/components/fleet/FleetResources';
import FleetRepo from '@shell/components/formatter/FleetRepo.vue';

export default {
  name: 'FleetDashboardResourceDetails',

  components: {
    LabeledSelect,
    FleetRepo,
    FleetResources
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

    workspace: {
      type:     Object,
      required: true
    }
  },

  data() {
    return {
      FLEET,
      cluster: null
    };
  },

  mounted() {
    this.cluster = this.clusterOptions[0]?.value;
  },

  computed: {
    clusterOptions() {
      return this.value.targetClusters.map((cluster) => ({
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
  <div class="details-panel">
    <div
      class="header"
      :data-testid="'fleet-dashboard-resource-details-header'"
    >
      <div class="title">
        <i :class="value.dashboardIcon" />
        <router-link
          :to="value.detailLocation"
        >
          {{ value.id }}
        </router-link>
        <i
          v-if="statePanel.id !== 'success'"
          class="ml-5 state-icon"
          :class="statePanel.icon"
          :style="{ color: statePanel.color }"
        />
      </div>
      <i
        class="icon icon-close"
        data-testid="slide-in-close"
        :aria-label="'slide-in-close'"
        :trigger-focus-trap="true"
        tabindex="0"
        @click="closePanel"
        @keydown.space.enter.stop.prevent="closePanel"
      />
    </div>

    <template v-if="value.type === FLEET.GIT_REPO">
      <h3>
        {{ t('fleet.dashboard.source') }}
      </h3>
      <div class="mb-15">
        <FleetRepo :row="value" />
      </div>
    </template>

    <h3>
      {{ t('fleet.dashboard.resources') }}
    </h3>
    <FleetResources
      :rows="value.resourcesStatuses"
      :cluster-id="cluster"
      :search="!noResources"
    >
      <template
        v-if="!noResources"
        #header-left
      >
        <div class="row">
          <div class="col span-10">
            <LabeledSelect
              v-model:value="cluster"
              :label="'Cluster'"
              :options="clusterOptions"
              :mode="'edit'"
              :disabled="workspace.id === 'fleet-local'"
            />
          </div>
        </div>
      </template>
    </FleetResources>
  </div>
</template>

<style lang="scss">
  .details-panel {
    padding: 10px;

    .sortable-table-header {
      .fixed-header-actions {
        align-items: center;
      }
    }

    .header {
      display: flex;
      align-items: center;
      padding: 0;
      margin: 0 0 20px 0;

      .title {
        display: flex;
        align-items: center;
        flex: 1;
        font-style: normal;
        font-weight: 400;
        font-size: 18px;

        .icon {
          font-size: 2em;
          margin-right: 5px;
        }

        .state-icon {
          font-size: 1.5em;
        }
      }

      .icon-close {
        cursor: pointer;
      }
    }
  }

  .col {
    .labeled-select {
      min-width: 250px;
    }
  }
</style>

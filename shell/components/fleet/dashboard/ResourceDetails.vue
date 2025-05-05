<script>
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import FleetResources from '@shell/components/fleet/FleetResources';

export default {
  name: 'FleetDashboardResourceDetails',

  components: {
    FleetResources,
    LabeledSelect
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
    return { cluster: null };
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
  },

  methods: {
    closePanel() {
      this.$store.commit('slideInPanel/close');
    }
  }
};
</script>

<template>
  <div class="panel">
    <div class="header">
      <div class="title">
        <i :class="value.dashboardIcon" />
        <router-link
          :to="value.detailLocation"
        >
          {{ value.nameDisplay }}
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
        :trigger-focus-trap="true"
        tabindex="0"
        @click="closePanel"
      />
    </div>
    <FleetResources
      :rows=value.resourcesStatuses
      :cluster-id="cluster"
    >
      <template
        v-if="workspace.id !== 'fleet-local'"
        #header-left
      >
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model:value="cluster"
              :label="'Cluster'"
              :options="clusterOptions"
              :mode="'edit'"
            />
          </div>
        </div>
      </template>
    </FleetResources>
  </div>
</template>

<style lang="scss">
  .panel {
    .header {
      display: flex;
      align-items: center;
      padding: 4px 0;
      margin-bottom: 10px;

      .title {
        display: flex;
        align-items: center;
        flex: 1;
        margin: 10px 0;
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
</style>

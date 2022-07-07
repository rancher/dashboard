<script>
import VMState from '@shell/components/formatter/BadgeStateFormatter';
import HarvesterMigrationState from './HarvesterMigrationState';

export default {
  components: { VMState, HarvesterMigrationState },
  props:      {
    value: {
      type:     String,
      default: ''
    },

    row: {
      type:     Object,
      required: true
    },

    allNodeNetwork: {
      type:     Array,
      default: () => {
        return [];
      }
    },

    allClusterNetwork: {
      type:     Array,
      default: () => {
        return [];
      }
    }
  },

  data() {
    return { isMigrating: false };
  },

  computed: {
    networkImpassability() {
      const nodeName = this.row?.nodeName;
      const nn = this.allNodeNetwork.find( N => N.attachNodeName === nodeName);

      return (!!nn?.message || !this.enableClusterNetwork) && this.row?.attachNetwork && this?.row?.actualState === 'Running';
    },

    enableClusterNetwork() {
      const clusterNetwork = this.allClusterNetwork?.[0] || {};

      return clusterNetwork?.enable;
    },

    warningMessage() {
      const out = [];

      if (this.networkImpassability && this.allClusterNetwork.length) {
        out.push(this.t('harvester.network.message.vlanInactive', { name: this.row.realAttachNodeName }));
      }

      if (this.row.warningMessage?.pod) {
        const pod = this.row.warningMessage.pod;

        if (pod.metadata?.state?.error && !/pod has unbound immediate PersistentVolumeClaims/.test(pod.metadata?.state?.message)) {
          out.push(pod.metadata?.state?.message);
        }
      }

      if (this.row?.actualState === 'VM error' && this.row.warningMessage?.message) {
        out.push(this.row.warningMessage?.message);
      }

      if (this.row?.migrationMessage) {
        out.push(this.row?.migrationMessage.message);
      }

      return out;
    }
  },

  methods: {
    migrationStateChanged(neu) {
      if (neu === 'Failed') {
        this.isMigrating = false;
      } else {
        this.isMigrating = !!neu;
      }
    }
  },
};
</script>

<template>
  <span>
    <HarvesterMigrationState v-show="isMigrating" :vm-resource="row" @state-changed="migrationStateChanged" />
    <div v-show="!isMigrating" class="state">
      <VMState :row="row" />
      <v-popover
        v-if="warningMessage.length"
        trigger="hover"
        offset="16"
      >
        <span class="tooltip-target">
          <i class="icon icon-warning icon-lg text-warning" />
        </span>

        <template slot="popover">
          <p v-for="(message, index) in warningMessage" :key="message">
            {{ index + 1 }}. {{ message }}
          </p>
        </template>
      </v-popover>
    </div>
  </span>
</template>

<style lang="scss" scoped>
.state {
  display: flex;
  justify-content: space-between;

  .icon-warning {
    margin-top: 2px;
  }
}
</style>

<script>
import LabelValue from '@shell/components/LabelValue';

export default {
  name: 'VirtualMachineMigration',

  components: { LabelValue },

  props: {
    value: {
      type:     Object,
      required: true,
    },
    vmiResource: {
      type:     Object,
      required: true,
      default:  () => {
        return {};
      }
    }
  },

  data() {
    return { localResource: this.vmiResource };
  },

  computed: {
    migrationState() {
      return this.localResource?.status?.migrationState;
    },
    sourceNode() {
      return this.migrationState?.sourceNode || 'N/A';
    },
    targetNode() {
      return this.migrationState?.targetNode || 'N/A';
    },
    started() {
      return this.migrationState?.startTimestamp || 'N/A';
    },
    ended() {
      return this.migrationState?.endTimestamp || 'N/A';
    },
    message() {
      return 'N/A';
    }
  },

  watch: {
    vmiResource: {
      handler(neu) {
        this.localResource = neu;
      },
      deep: true
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.sourceNode')" :value="sourceNode" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.targetNode')" :value="targetNode" />
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.started')" :value="started" />
      </div>
      <div class="col span-6">
        <LabelValue :name="t('harvester.virtualMachine.detail.details.ended')" :value="ended" />
      </div>
    </div>
  </div>
</template>

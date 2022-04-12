<script>
import BadgeState from '@shell/components/BadgeState';
import { stateDisplay } from '@shell//plugins/core-store/resource-class';

const ACTIVE = 'healthy';
const WARNING = 'warning';

export default {
  components: { BadgeState },
  props:      {
    value: {
      type:     String,
      default: ''
    },
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    state() {
      const longhornDisks = this.row?.longhornDisks || [];
      const out = longhornDisks.reduce((state, disk) => {
        if (disk?.readyCondiction?.status !== 'True' || disk?.schedulableCondiction?.status !== 'True') {
          state = WARNING;
        }

        return state;
      }, ACTIVE);

      return out;
    },

    stateDisplay() {
      return stateDisplay(this.state);
    },

    stateBackground() {
      if ( this.state === ACTIVE ) {
        return 'bg-success';
      } else {
        return 'bg-warning';
      }
    },

    errorMessage() {
      if (this.state !== ACTIVE) {
        return this.t('harvester.host.disk.error');
      }

      return '';
    }
  },
};
</script>

<template>
  <div>
    <BadgeState
      v-tooltip="errorMessage"
      :color="stateBackground"
      :label="stateDisplay"
    />
  </div>
</template>

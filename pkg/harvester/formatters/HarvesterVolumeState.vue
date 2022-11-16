<script>
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';
import VolumeState from '@shell/components/formatter/BadgeStateFormatter';

export default {
  components: { VolumeState },
  props:      {
    row: {
      type:     Object,
      required: true
    },
  },

  computed: {
    warningMessage() {
      return this.row.relatedPV?.metadata?.annotations?.[HCI_ANNOTATIONS.VOLUME_ERROR];
    }
  },
};
</script>

<template>
  <span>
    <div class="state">
      <VolumeState :row="row" />
      <v-popover
        v-if="!!warningMessage"
        trigger="hover"
        offset="16"
      >
        <span class="tooltip-target">
          <i class="icon icon-warning icon-lg text-warning" />
        </span>

        <template slot="popover">
          <p>
            {{ warningMessage }}
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

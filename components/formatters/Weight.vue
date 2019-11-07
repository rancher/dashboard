<script>
import { RIO } from '@/config/types';
import { filterBy } from '@/utils/array';

export default {
  props: {
    value: {
      type:     Number,
      default: 0,
    },
    row: {
      type:     Object,
      required: true
    },
    col: {
      type:     Object,
      default: () => {}
    },
  },

  computed: {
    total() {
      const services = this.$store.getters['cluster/all'](RIO.SERVICE);
      const forThisApp = filterBy(services, 'app', this.row.app);

      let desired = 0;
      let current = 0;
      let count = 0;

      for ( const service of forThisApp ) {
        const weights = service.weights;

        desired += weights.desired || 0;
        current += weights.current || 0;
        count++;
      }

      desired = Math.max(1, desired);
      current = Math.max(1, current);

      return {
        desired,
        current,
        count
      };
    },

    desired() {
      const desired = this.row.weights.desired;
      const total = this.total.desired;

      return Math.round(desired / total * 1000) / 10;
    },

    current() {
      const current = this.row.weights.current;
      const total = this.total.current;

      if ( total === 0 ) {
        return 100;
      }

      return Math.round(current / total * 1000) / 10;
    },

    showDesired() {
      return this.current !== this.desired;
    },

  }
};
</script>

<template>
  <div>
    <span v-if="total.count === 1" class="text-muted">
      &mdash;
    </span>
    <span v-else v-trim-whitespace :class="{'text-muted': current === 0 && desired === 0}">
      {{ current }}%
    </span>
    <div v-if="showDesired">
      <i class="icon icon-chevron-right" />
      {{ desired }}%
    </div>
  </div>
</template>

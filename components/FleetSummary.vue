<script>
import CountBox from '@/components/CountBox';

const KEYS = {
  errApplied:    'error',
  modified:      'warning',
  notReady:      'warning',
  outOfSync:     'warning',
  pending:       'info',
  waitApplied:   'info',
  ready:         'success',
  other:         'unknown',
  desiredReady:  false,
  missing:      'warning',
  orphaned:     'info',
  unknown:      'unknown',
};

export default {
  components: { CountBox },

  props: {
    value: {
      type:     Object,
      required: true,
    }
  },

  computed: {
    counts() {
      const out = {
        success: 0,
        info:    0,
        warning: 0,
        error:   0,
        unknown: 0,
      };

      for ( const k in this.value ) {
        if ( k.startsWith('desired') ) {
          continue;
        }

        const mapped = KEYS[k] || KEYS['other'];

        if ( mapped === false ) {
          continue;
        }

        out[mapped] += this.value[k] || 0;
      }

      return out;
    },
  }
};
</script>

<template>
  <div class="row">
    <div v-for="(v, k) in counts" :key="k" class="col span-2-of-10">
      <CountBox :count="v" :name="t(`fleet.fleetSummary.state.${k}`)" :primary-color-var="'--sizzle-'+k" />
    </div>
  </div>
</template>

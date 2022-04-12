<script>
import capitalize from 'lodash/capitalize';
import CountBox from '@shell/components/CountBox';
import { STATES } from '@shell//plugins/core-store/resource-class';

export default {

  name: 'ResourcesSummary',

  components: { CountBox },

  props: {
    value: {
      type:     Object,
      required: true,
    },

    stateKey: {
      type:    String,
      default: 'fleet.fleetSummary.state'
    },

    requiredStates: {
      type:    Array,
      default: () => []
    }
  },

  computed: {
    counts() {
      const out = this.requiredStates.reduce((obj, state) => {
        obj[state] = {
          count: 0,
          color: state,
          label:  this.$store.getters['i18n/withFallback'](`${ this.stateKey }.${ state }`, null, state)
        };

        return obj;
      }, {});

      for (const k in this.value) {
        if (k.startsWith('desired')) {
          continue;
        }

        const mapped = STATES[k] || STATES['other'];

        if (out[k]) {
          out[k].count += this.value[k] || 0;
          out[k].color = mapped.color;
        } else {
          out[k] = {
            count: this.value[k] || 0,
            color: mapped.color,
            label: this.$store.getters['i18n/withFallback'](`${ this.stateKey }.${ k }`, null, capitalize(k))
          };
        }
      }

      return out;
    },
  },

  methods: { capitalize },
};
</script>

<template>
  <div class="row flexwrap">
    <div v-for="(v, k) in counts" :key="k" class="col countbox">
      <CountBox
        :compact="true"
        :count="v['count']"
        :name="v.label"
        :primary-color-var="'--sizzle-' + v.color"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
  .flexwrap {
    flex-wrap: wrap;
  }
  .countbox {
    min-width: 150px;
    width: 12.5%;
    margin-bottom: 10px;
  }
</style>

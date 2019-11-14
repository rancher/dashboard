<script>
import { RIO } from '@/config/types';
import { filterBy } from '@/utils/array';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: { LabeledInput },

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

  data() {
    return { newPercent: null };
  },

  computed: {
    servicesForApp() {
      const services = this.$store.getters['cluster/all'](RIO.SERVICE);

      return filterBy(services, 'app', this.row.app);
    },

    totalForApp() {
      let desired = 0;
      let current = 0;
      let count = 0;

      for ( const service of this.servicesForApp ) {
        const weights = service.weights;

        desired += weights.desired || 0;
        current += weights.current || 0;
        count++;
      }

      return {
        desired,
        current,
        count
      };
    },

    desired() {
      const desired = this.row.weights.desired;
      const total = this.totalForApp.desired;

      if ( total === 0 ) {
        return 0;
      }

      return Math.round(desired / total * 1000) / 10;
    },

    current() {
      const current = this.row.weights.current;
      const total = this.totalForApp.current;

      if ( total === 0 ) {
        return 0;
      }

      return Math.round(current / total * 1000) / 10;
    },

    showDesired() {
      return this.current !== this.desired;
    },

    canAdjust() {
      return this.totalForApp.count > 1;
    },

    newWeightValid() {
      const percent = this.newPercent;

      return percent >= 0 && percent <= 100;
    }
  },

  methods: {
    onShown() {
      this.$nextTick(() => {
        this.$refs.newPercent.focus();
      });
    },

    setWeight() {
      const currentPercent = this.desired || 0;
      const newPercent = this.newPercent || 0;
      const totalWeight = this.totalForApp.desired;
      const count = this.totalForApp.count;

      if ( currentPercent === 100 ) {
        if ( newPercent === 100 ) {
          return;
        } else if ( newPercent === 0 ) {
          this.row.saveWeight(0);

          return;
        }

        const weight = newWeight(100 - newPercent) / (count - 1);

        for ( const svc of this.servicesForApp ) {
          if ( svc === this.row ) {
            continue;
          }

          svc.saveWeight(weight);
        }
      } else if ( totalWeight === 0 || newPercent === 100 ) {
        this.row.saveWeight(10000);

        for ( const svc of this.servicesForApp ) {
          if ( svc === this.row ) {
            continue;
          }
          svc.saveWeight(0);
        }
      } else {
        const weight = newWeight(newPercent);

        this.row.saveWeight(weight);
      }

      function newWeight(percent) {
        if ( percent === 0 ) {
          return 0;
        }

        const out = Math.round(totalWeight / (1 - (percent / 100))) - totalWeight;

        return out;
      }
    },
  }
};
</script>

<template>
  <v-popover
    :class="{'hand': canAdjust}"
    placement="top"
    :open-group="row.id"
    :trigger="canAdjust ? 'click' : 'manual'"
    offset="1"
    @apply-show="onShown"
  >
    <div>
      <span v-if="totalForApp.count === 1" class="text-muted">
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

    <template #popover>
      <div v-if="canAdjust" class="text-center pb-5">
        <form>
          <LabeledInput
            ref="newPercent"
            v-model.number="newPercent"
            label="Target"
            size="4"
            min="0"
            max="100"
            class="text-left"
            style="width: 100px;"
          >
            <template #suffix>
              <div class="addon">
                %
              </div>
            </template>
          </LabeledInput>
          <button type="submit" class="btn bg-primary btn-sm mt-20" :disabled="!newWeightValid" @click.stop.prevent="setWeight">
            Set
          </button>
        </form>
      </div>
    </template>
  </v-popover>
</template>

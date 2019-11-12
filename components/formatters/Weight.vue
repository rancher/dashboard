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
      const total = this.totalForApp.desired;

      return Math.round(desired / total * 1000) / 10;
    },

    current() {
      const current = this.row.weights.current;
      const total = this.totalForApp.current;

      if ( total === 0 ) {
        return 100;
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
    setWeight() {
      const current = this.desired;
      const neu = this.newPercent;
      const total = this.totalForApp.desired;
      const count = this.totalForApp.count;

      if ( current === 100 ) {
        if ( neu === 100 ) {
          return;
        }

        const weight = newWeight(100 - neu) / (count - 1);

        for ( const svc of this.servicesForApp ) {
          if ( svc === this.crow ) {
            continue;
          }

          svc.setWeight(weight);
        }
      } else {
        const weight = newWeight(neu);

        this.row.saveWeight(weight);
      }

      function newWeight(percent) {
        return Math.ceil(total / (1 - (percent / 100))) - total;
      }
    },
  }
};
</script>

<template>
  <v-popover :class="{'hand': canAdjust}" placement="top" :open-group="row.id" :trigger="canAdjust ? 'click' : 'manual'" offset="1">
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
          <button type="button" class="btn bg-primary btn-sm mt-20" :disabled="!newWeightValid" @click="setWeight">
            Set
          </button>
        </form>
      </div>
    </template>
  </v-popover>
</template>

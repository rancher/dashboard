<script>
import { get } from '@/utils/object';
import RadioGroup from '@/components/form/RadioGroup';
import UnitInput from '@/components/form/UnitInput';

export default {
  components: { RadioGroup, UnitInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: { type: String, default: 'edit' }
  },
  data() {
    const { strategy:strategyObj = {}, minReadySeconds = 0, progressDeadlineSeconds = 600 } = this.value;
    const strategy = strategyObj.type;
    const maxUnavailable = get(strategyObj, `${ strategy }.maxUnavailable`) || 0;
    const maxSurge = get(strategyObj, `${ strategy }.maxSurge`) || 1;

    let actualStrategy = 'recreate';

    if (strategy === 'RollingUpdate') {
      if (maxUnavailable === 0 && maxSurge !== 0) {
        actualStrategy = 'newOld';
      } else if (maxSurge === 0 && maxUnavailable !== 0) {
        actualStrategy = 'oldNew';
      } else {
        actualStrategy = 'custom';
      }
    }

    const batchSize = Math.max(maxUnavailable, maxSurge) || 1;

    return {
      actualStrategy,
      strategy,
      batchSize,
      minReadySeconds,
      progressDeadlineSeconds,
      maxSurge,
      maxUnavailable
    };
  },
  watch: {
    actualStrategy(neu) {
      switch (neu) {
      case 'oldNew':
        this.maxSurge = 0;
        this.maxUnavailable = this.batchSize;
        this.strategy = 'RollingUpdate';
        break;
      case 'newOld':
        this.maxSurge = this.batchSize;
        this.maxUnavailable = 0;
        this.strategy = 'RollingUpdate';
        break;
      case 'recreate':
        this.maxSurge = null;
        this.maxUnavailable = null;
        this.strategy = 'recreate';
        break;
      default:
        this.strategy = 'RollingUpdate';
        break;
      }
      this.update();
    }
  },

  rendered() {
    this.update();
  },
  methods: {
    update() {
      const out = {
        ...this.value,
        progressDeadlineSeconds: this.progressDeadlineSeconds,
        minReadySeconds:         this.minReadySeconds
      };

      switch (this.actualStrategy) {
      case 'oldNew':
        out.strategy = {
          type:          'RollingUpdate',
          rollingUpdate: {
            maxSurge:       0,
            maxUnavailable: this.batchSize
          }
        };
        break;
      case 'newOld':
        out.strategy = {
          type:          'RollingUpdate',
          rollingUpdate: {
            maxSurge:       this.batchSize,
            maxUnavailable: 0
          }
        };
        break;
      case 'recreate':
        out.strategy = { type: 'Recreate' };
        break;
      default:
        out.strategy = {
          type:          'RollingUpdate',
          rollingUpdate: {
            maxSurge:       this.maxSurge,
            maxUnavailable: this.maxUnavailable
          }
        };
        break;
      }

      this.$emit('input', out);
    }
  }
};
</script>

<template>
  <div @input="update">
    <div class="row">
      <div class="col span-6">
        <RadioGroup
          v-model="actualStrategy"
          :options="['newOld', 'oldNew', 'recreate', 'custom']"
          :labels="['Rolling: start new pods, then stop old', 'Rolling: stop old pods, then start new', 'Kill ALL pods, then start new', 'Custom']"
          :mode="mode"
        />
      </div>
      <div v-if="actualStrategy !== 'recreate'" class="col span-6">
        <UnitInput v-if="actualStrategy !=='custom'" v-model="batchSize" :suffix="batchSize == 1 ? 'Pod' : 'Pods'" label="Batch Size" :mode="mode">
          <template v-slot:label>
            <span :style="{'color':'var(--input-label)'}">
              Batch Size
              <i v-tooltip="'Pods will be started and stopped this many at a time'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
        <template v-else>
          <div class="row">
            <div class="col span-6">
              <UnitInput v-model="maxSurge" :suffix="maxSurge == 1 ? 'Pod' : 'Pods'" label="Max Surge" :mode="mode">
                <template v-slot:label>
                  <span :style="{'color':'var(--input-label)'}">
                    Max Surge
                    <i v-tooltip="'The maximum number of pods allowed beyond the desired scale at any given time.'" class="icon icon-info" style="font-size: 14px" />
                  </span>
                </template>
              </UnitInput>
            </div>
            <div class="col span-6">
              <UnitInput v-model="maxUnavailable" :suffix="maxUnavailable == 1 ? 'Pod' : 'Pods'" label="Max Unavailable" :mode="mode">
                <template v-slot:label>
                  <span :style="{'color':'var(--input-label)'}">
                    Max Unavailable
                    <i v-tooltip="'The maximum number of pods which can be unavailable at any given time.'" class="icon icon-info" style="font-size: 14px" />
                  </span>
                </template>
              </UnitInput>
            </div>
          </div>
        </template>
      </div>
    </div>
    <div class="row">
      <div class="col span-6">
        <UnitInput v-model="minReadySeconds" :suffix="minReadySeconds == 1 ? 'Second' : 'Seconds'" label="Minimum Ready Time" :mode="mode">
          <template #label>
            <span :style="{'color':'var(--input-label)'}">
              Minimum Ready Time
              <i v-tooltip="'Containers in the pods must be up for at least this long before the pod is considered available.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
      <div class="col span-6">
        <UnitInput v-model="progressDeadlineSeconds" :suffix="progressDeadlineSeconds == 1 ? 'Second' : 'Seconds'" label="Progress Deadline" :mode="mode">
          <template #label>
            <span :style="{'color':'var(--input-label)'}">
              Progress Deadline
              <i v-tooltip="'How long to wait without seeing progress before marking the deployment as stalled.'" class="icon icon-info" style="font-size: 14px" />
            </span>
          </template>
        </UnitInput>
      </div>
    </div>
  </div>
</template>

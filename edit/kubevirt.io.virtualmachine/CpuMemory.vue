<script>
import { formatSi, parseSi } from '@/utils/units';
import UnitInput from '@/components/form/UnitInput';
import InputOrDisplay from '@/components/InputOrDisplay';

export default {
  name:       'CpuMemory',
  components: { UnitInput, InputOrDisplay },

  props:      {
    cpu: {
      type:    Number,
      default: null
    },
    memory: {
      type:    String,
      default: null
    },
    mode: {
      type:      String,
      default:  'create',
    },
    disabled: {
      type:    Boolean,
      default: false
    }
  },

  data() {
    return {
      localCpu:    this.cpu,
      localMemory: this.getSize(this.memory)
    };
  },

  watch: {
    cpu(neu) {
      this.localCpu = neu;
    },
    memory(neu) {
      if (neu && !neu.includes('null')) {
        this.localMemory = this.getSize(neu);
      }
    }
  },

  methods: {
    change() {
      let memory = '';

      if (String(this.localMemory).includes('Gi')) {
        memory = this.localMemory;
      } else {
        memory = `${ this.localMemory }Gi`;
      }
      this.$emit('updateCpuMemory', this.localCpu, memory);
    },

    getSize(storage) {
      if (!storage) {
        return null;
      }

      const kibUnitSize = parseSi(storage);

      return formatSi(kibUnitSize, {
        addSuffix:   false,
        increment:   1024,
        minExponent: 3,
        maxExponent: 3
      });
    },
  }
};
</script>

<template>
  <div class="row" @input="change">
    <div class="col span-6">
      <InputOrDisplay name="CPU" :value="localCpu" :mode="mode" class="mb-20">
        <UnitInput
          v-model="localCpu"
          v-int-number
          label="CPU"
          suffix="C"
          :increment="1"
          :input-exponent="0"
          required
          :disabled="disabled"
          :mode="mode"
          class="mb-20"
        />
      </InputOrDisplay>
    </div>

    <div class="col span-6">
      <InputOrDisplay :name="t('harvester.virtualMachine.input.memory')" :value="localMemory" :mode="mode" class="mb-20">
        <UnitInput
          v-model="localMemory"
          v-int-number
          :label="t('harvester.virtualMachine.input.memory')"
          suffix="iB"
          :mode="mode"
          :input-exponent="3"
          :output-exponent="3"
          :disabled="disabled"
          required
          class="mb-20"
        />
      </InputOrDisplay>
    </div>
  </div>
</template>

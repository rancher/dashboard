<script>
import Banner from '@/components/Banner';
import Loading from '@/components/Loading';
import UnitInput from '@/components/form/UnitInput';
import InputOrDisplay from '@/components/InputOrDisplay';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';

import { PVC } from '@/config/types';

export default {
  name:       'HarvesterEditVolume',
  components: {
    Banner, InputOrDisplay, Loading, LabeledInput, LabeledSelect, UnitInput,
  },

  props: {
    mode: {
      type:    String,
      default: 'create'
    },

    isEdit: {
      type:    Boolean,
      default: false
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    typeOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    interfaceOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    validateRequired: {
      type:     Boolean,
      required: true
    }
  },

  data() {
    return {
      loading: false,
      errors:  []
    };
  },

  computed: {
    pvcsResource() {
      const allPVCs = this.$store.getters['harvester/all'](PVC) || [];

      return allPVCs.find(P => P.metadata.name === this.value.volumeName);
    },

    isDisabled() {
      return !this.value.newCreateId && this.isEdit;
    },
  },

  watch: {
    'value.type'(neu) {
      if (neu === 'cd-rom') {
        this.$set(this.value, 'bus', 'sata');
        this.update();
      }
    },

    pvcsResource: {
      handler(pvc) {
        if (pvc?.spec?.resources?.requests?.storage) {
          this.value.size = pvc.spec.resources.requests.storage;
        }
      },
      deep:      true,
      immediate: true
    },
  },

  methods: {
    update() {
      this.$emit('update');
    },
  },
};
</script>

<template>
  <div @input="update">
    <Loading mode="relative" :loading="loading" />
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput
            v-model="value.name"
            :label="t('harvester.fields.name')"
            :mode="mode"
            required
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="typeOption"
            required
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput
            v-model="value.size"
            :output-modifier="true"
            :increment="1024"
            :input-exponent="3"
            :mode="mode"
            :required="validateRequired"
            :label="t('harvester.fields.size')"
            :disabled="isDisabled"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-3">
        <InputOrDisplay :name="t('harvester.virtualMachine.volume.bus')" :value="value.bus" :mode="mode">
          <LabeledSelect
            v-model="value.bus"
            :label="t('harvester.virtualMachine.volume.bus')"
            class="mb-20"
            :mode="mode"
            :options="interfaceOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div v-for="(err,idx) in errors" :key="idx">
      <Banner color="error" :label="err" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.action {
  display: flex;
  flex-direction: row-reverse;
}
</style>

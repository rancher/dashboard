<script>
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
// import { _EDIT } from '@/config/query-params';

export default {
  name:       'Volume',
  components: {
    UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
  },
  props: {
    mode: {
      type:    String,
      default: 'create'
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

    storageOption: {
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

    bootOrderOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    accessModeOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },
    volumeModeOption: {
      type:    Array,
      default: () => {
        return [];
      }
    },
  },

  data() {
    return {};
  },

  computed: {
    isDisabled() {
      // fix: https://github.com/harvester/harvester/issues/813
      // return !this.value.newCreateId && this.mode === _EDIT;
      return false;
    }
  },

  watch: {
    'value.type'(neu) {
      if (neu === 'cd-rom') {
        this.$set(this.value, 'bus', 'sata');
        this.update();
      }
    },
  },

  methods: {
    update() {
      this.$emit('update');
    }
  },
};
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput
            v-model="value.name"
            :label="t('harvester.fields.name')"
            :disabled="isDisabled"
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
            :disabled="isDisabled"
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput v-model="value.size" :mode="mode" :label="t('harvester.fields.size')" suffix="GiB" :disabled="isDisabled" />
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
            :disabled="isDisabled"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-3">
        <InputOrDisplay :name="t('harvester.virtualMachine.volume.bootOrder')" :value="value.bootOrder" :mode="mode">
          <LabeledSelect
            v-model="value.bootOrder"
            :label="t('harvester.virtualMachine.volume.bootOrder')"
            class="mb-20"
            :mode="mode"
            :clearable="true"
            :searchable="false"
            :disabled="isDisabled"
            :options="bootOrderOption"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
    <!--
    <div class="row">
      <div class="col span-6">
        <LabeledSelect
          v-model="value.volumeMode"
          :mode="mode"
          label="Volume Mode"
          class="mb-20"
          :options="volumeModeOption"
          @input="update"
        />
      </div>

      <div class="col span-3">
        <LabeledSelect
          v-model="value.accessMode"
          :mode="mode"
          label="Access Mode"
          class="mb-20"
          :options="accessModeOption"
          @input="update"
        />
      </div>

      <div class="col span-3">
        <LabeledSelect
          v-model="value.storageClassName"
          label="Storage Class"
          :options="storageOption"
          :mode="mode"
          required
          @input="update"
        />
      </div>
    </div> -->
  </div>
</template>

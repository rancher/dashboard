<script>
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { HCI } from '@/config/types';
import { _CREATE } from '@/config/query-params';

export default {
  name: 'VmImage',

  components: {
    UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
  },

  props:  {
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

    mode: {
      type:    String,
      default: 'create'
    },

    idx: {
      type:     Number,
      required: true
    },

    needRootDisk: {
      type:    Boolean,
      default: false
    },
  },

  computed: {
    isCreate() {
      return this.mode === _CREATE;
    },
    imagesOption() {
      const choise = this.$store.getters['virtual/all'](HCI.IMAGE);

      return choise.map( (I) => {
        return {
          label: `${ I.metadata.namespace }/${ I.spec.displayName }`,
          value: I.id
        };
      });
    },
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
    },

    onImageChange() {
      const imageResource = this.$store.getters['virtual/all'](HCI.IMAGE).find( I => this.value.image === I.id);
      const isIso = /.iso$/.test(imageResource?.spec?.url);

      if (this.idx === 0) {
        if (isIso) {
          this.$set(this.value, 'type', 'cd-rom');
          this.$set(this.value, 'bus', 'sata');
        } else {
          this.$set(this.value, 'type', 'disk');
          this.$set(this.value, 'bus', 'virtio');
        }
      }

      this.update();
    },

    setRootDisk() {
      this.$emit('setRootDisk', this.idx);
    }
  }
};
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput v-model="value.name" :label="t('harvester.fields.name')" required :mode="mode" :disabled="isDisabled" />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="typeOption"
            :mode="mode"
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.image')" :value="value.image" :mode="mode">
          <LabeledSelect
            v-model="value.image"
            :disabled="idx === 0 && !isCreate && !value.newCreateId"
            :label="t('harvester.fields.image')"
            :options="imagesOption"
            :mode="mode"
            @input="onImageChange"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput v-model="value.size" :label="t('harvester.fields.size')" :mode="mode" suffix="GiB" :disabled="isDisabled" />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-3">
        <InputOrDisplay :name="t('harvester.virtualMachine.volume.bus')" :value="value.bus" :mode="mode">
          <LabeledSelect
            v-model="value.bus"
            :label="t('harvester.virtualMachine.volume.bus')"
            :mode="mode"
            :options="interfaceOption"
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-3">
        <InputOrDisplay :name="t('harvester.virtualMachine.volume.bootOrder')" :value="value.bootOrder" :mode="mode">
          <LabeledSelect
            v-model="value.bootOrder"
            :label="t('harvester.virtualMachine.volume.bootOrder')"
            :mode="mode"
            :disabled="isDisabled"
            :searchable="false"
            :options="bootOrderOption"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <!-- <div class="col span-6">
        <LabeledSelect
          v-model="value.volumeMode"
          label="Volume Mode"
          :mode="mode"
          class="mb-20"
          :options="volumeModeOption"
          @input="update"
        />
      </div> -->
    </div>

    <div class="row">
      <div class="col span-3">
        <button v-if="needRootDisk" type="button" class="btn bg-primary mr-15" @click="setRootDisk()">
          {{ t('harvester.virtualMachine.volume.setFirst') }}
        </button>
      </div>
    </div>
  </div>
</template>

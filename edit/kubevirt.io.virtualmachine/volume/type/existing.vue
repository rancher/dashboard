<script>
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { PVC } from '@/config/types';
import { sortBy } from '@/utils/sort';

export default {
  name:       'Existing',
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

    namespace: {
      type:    String,
      default: null
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
    rows: {
      type:    Array,
      default: () => {
        return [];
      }
    }
  },

  async fetch() {
    await this.$store.dispatch('virtual/findAll', { type: PVC });
  },

  computed: {
    allPVCs() {
      return this.$store.getters['virtual/all'](PVC) || [];
    },

    isDisabled() {
      return false;
    },

    volumeOption() {
      return sortBy(
        this.allPVCs
          .filter( (pvc) => {
            let isAvailable = true;

            this.rows.forEach( (O) => {
              if (( O.volumeName !== this.value.volumeName && O.volumeName === pvc.metadata.name && O.accessMode === 'ReadWriteOnce')) {
                isAvailable = false;
              }
            });

            const isBeingUsed = pvc.attachVM;

            return isAvailable && !isBeingUsed && this.namespace === pvc.metadata.namespace;
          })
          .map((pvc) => {
            return {
              label: pvc.metadata.name,
              value: pvc.metadata.name
            };
          }),
        'label'
      );
    },
  },

  watch: {
    'value.volumeName'(neu) {
      const pvcResource = this.allPVCs.find( P => P.metadata.name === neu);

      if (!pvcResource) {
        return;
      }

      this.value.accessModes = pvcResource.spec.accessModes[0];
      this.value.size = pvcResource.spec.resources.requests.storage;
      this.value.storageClassName = pvcResource.spec.storageClassName;
      this.value.volumeMode = pvcResource.spec.volumeMode;
    },

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
  }
};
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput v-model="value.name" :label="t('harvester.fields.name')" :mode="mode" required :disabled="isDisabled" />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :mode="mode"
            :disabled="isDisabled"
            :options="typeOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.volume')" :value="value.volumeName" :mode="mode">
          <LabeledSelect
            v-model="value.volumeName"
            :label="t('harvester.fields.volume')"
            :mode="mode"
            :disabled="isDisabled"
            :options="volumeOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput v-model="value.size" :label="t('harvester.fields.size')" suffix="GiB" :mode="mode" :disabled="true" />
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
            :disabled="true"
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
            :mode="mode"
            :searchable="false"
            :options="bootOrderOption"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
  </div>
</template>

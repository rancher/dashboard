<script>
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { HCI } from '@/config/types';
import { sortBy } from '@/utils/sort';
// import { _EDIT } from '@/config/query-params';

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

  computed: {
    isDisabled() {
      // return !this.value.newCreateId && this.mode === _EDIT;
      return false;
    },
    volumeOption() {
      const choices = this.$store.getters['cluster/all'](HCI.DATA_VOLUME);

      return sortBy(
        choices
          .filter( (obj) => {
            let isAvailable = true;

            this.rows.forEach( (O) => {
              if (( O.volumeName !== this.value.volumeName && O.volumeName === obj.metadata.name && O.accessMode === 'ReadWriteOnce')) {
                isAvailable = false;
              }
            });

            const isExistingRWO = obj.isRWO && obj.attachVM;

            return obj.metadata.namespace === 'default' && obj.phaseStatus === 'Succeeded' && isAvailable && !isExistingRWO;
          })
          .map((obj) => {
            return {
              label: obj.metadata.name,
              value: obj.metadata.name
            };
          }),
        'label'
      );
    },
  },

  watch: {
    'value.volumeName'(neu) {
      const choices = this.$store.getters['cluster/all'](HCI.DATA_VOLUME);

      const pvcResource = choices.find( O => O.metadata.name === neu);

      if (!pvcResource) {
        return;
      }

      this.value.accessModes = pvcResource?.spec?.pvc?.accessModes[0];
      this.value.size = pvcResource?.spec?.pvc?.resources?.requests?.storage;
      this.value.storageClassName = pvcResource?.spec?.pvc?.storageClassName;
      this.value.volumeMode = pvcResource?.spec?.pvc?.volumeMode;
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
        <InputOrDisplay :name="t('harvester.vmPage.volume.bus')" :value="value.bus" :mode="mode">
          <LabeledSelect
            v-model="value.bus"
            :label="t('harvester.vmPage.volume.bus')"
            :mode="mode"
            :options="interfaceOption"
            :disabled="true"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-3">
        <InputOrDisplay :name="t('harvester.vmPage.volume.bootOrder')" :value="value.bootOrder" :mode="mode">
          <LabeledSelect
            v-model="value.bootOrder"
            :label="t('harvester.vmPage.volume.bootOrder')"
            :mode="mode"
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
          :options="volumeModeOption"
          :disabled="true"
          @input="update"
        />
      </div> -->
    </div>
  </div>
</template>

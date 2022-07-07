<script>
import Loading from '@shell/components/Loading';
import UnitInput from '@shell/components/form/UnitInput';
import InputOrDisplay from '@shell/components/InputOrDisplay';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';

import { PVC } from '@shell/config/types';
import { formatSi, parseSi } from '@shell/utils/units';
import { VOLUME_TYPE, InterfaceOption } from '@shell/config/harvester-map';

export default {
  name:       'HarvesterEditVolume',
  components: {
    InputOrDisplay, Loading, LabeledInput, LabeledSelect, UnitInput,
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

    validateRequired: {
      type:     Boolean,
      required: true
    },

    isVirtualType: {
      type:    Boolean,
      default: true
    }
  },

  data() {
    return {
      VOLUME_TYPE,
      InterfaceOption,
      loading: false,
    };
  },

  computed: {
    pvcsResource() {
      const allPVCs = this.$store.getters['harvester/all'](PVC) || [];

      return allPVCs.find(P => P.metadata.name === this.value.volumeName);
    },

    isDisabled() {
      return !this.value.newCreateId && this.isEdit && this.isVirtualType;
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
          const parseValue = parseSi(pvc.spec.resources.requests.storage);

          const formatSize = formatSi(parseValue, {
            increment:   1024,
            addSuffix:   false,
            maxExponent: 3,
            minExponent: 3,
          });

          this.value.size = `${ formatSize }Gi`;
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
  <div>
    <Loading mode="relative" :loading="loading" />
    <div class="row mb-20">
      <div
        class="col span-6"
        data-testid="input-hev-name"
      >
        <InputOrDisplay
          :name="t('harvester.fields.name')"
          :value="value.name"
          :mode="mode"
        >
          <LabeledInput
            v-model="value.name"
            :label="t('harvester.fields.name')"
            :mode="mode"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        class="col span-6"
        data-testid="input-hev-type"
      >
        <InputOrDisplay
          :name="t('harvester.fields.type')"
          :value="value.type"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="VOLUME_TYPE"
            required
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div
        class="col span-6"
        data-testid="input-hev-size"
      >
        <InputOrDisplay
          :name="t('harvester.fields.size')"
          :value="value.size"
          :mode="mode"
        >
          <UnitInput
            v-model="value.size"
            :output-modifier="true"
            :increment="1024"
            :input-exponent="3"
            :mode="mode"
            :required="validateRequired"
            :label="t('harvester.fields.size')"
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hev-bus"
        class="col span-3"
      >
        <InputOrDisplay :name="t('harvester.virtualMachine.volume.bus')" :value="value.bus" :mode="mode">
          <LabeledSelect
            v-model="value.bus"
            :label="t('harvester.virtualMachine.volume.bus')"
            :mode="mode"
            :options="InterfaceOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
  </div>
</template>

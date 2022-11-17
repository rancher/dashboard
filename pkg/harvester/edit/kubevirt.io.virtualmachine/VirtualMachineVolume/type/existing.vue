<script>
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import InputOrDisplay from '@shell/components/InputOrDisplay';

import { sortBy } from '@shell/utils/sort';
import { PVC } from '@shell/config/types';
import { HCI } from '../../../../types';
import { _CREATE } from '@shell/config/query-params';
import { VOLUME_TYPE, InterfaceOption } from '../../../../config/harvester-map';
import { HCI as HCI_ANNOTATIONS } from '@/pkg/harvester/config/labels-annotations';

export default {
  name:       'HarvesterEditExisting',
  components: {
    UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
  },

  props: {
    mode: {
      type:    String,
      default: _CREATE
    },

    value: {
      type:     Object,
      required: true
    },

    isEdit: {
      type:    Boolean,
      default: false
    },

    namespace: {
      type:    String,
      default: null
    },

    idx: {
      type:    Number,
      default: 0
    },

    rows: {
      type:     Array,
      required: true
    },
  },

  data() {
    if (this.value.realName) {
      this.value.volumeName = this.value.realName;
    }

    return {
      VOLUME_TYPE,
      InterfaceOption,
      loading: false,
    };
  },

  computed: {
    isDisabled() {
      return !this.value.newCreateId && this.isEdit;
    },

    allPVCs() {
      const allPVCs = this.$store.getters['harvester/all'](PVC);

      return allPVCs.filter((P) => {
        return this.namespace ? this.namespace === P.metadata.namespace : true;
      }) || [];
    },

    image() {
      const imageResource = this.$store.getters['harvester/all'](HCI.IMAGE).find(I => I.id === this.pvcResource?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID]);

      if (!imageResource) {
        return;
      }

      return `${ imageResource.metadata.namespace }/${ imageResource.spec.displayName }`;
    },

    pvcResource() {
      return this.allPVCs.find( P => P.metadata.name === this.value.volumeName );
    },

    volumeOption() {
      return sortBy(
        this.allPVCs
          .filter( (pvc) => {
            let isAvailable = true;
            let isBeingUsed = false;

            this.rows.forEach( (O) => {
              if (O.volumeName === pvc.metadata.name) {
                isAvailable = false;
              }
            });

            if (this.idx === 0 && !pvc.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID]) {
              return false;
            }

            if (pvc.attachVM && isAvailable && pvc.attachVM?.id === this.vm?.id && this.isEdit) {
              isBeingUsed = false;
            } else if (pvc.attachVM) {
              isBeingUsed = true;
            }

            return isAvailable && !isBeingUsed && pvc.isAvailable;
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

    pvcResource: {
      handler(pvc) {
        if (!this.value.volumeName && pvc?.metadata?.name) {
          this.value.volumeName = pvc.metadata.name;
        }
      },
      deep:      true,
      immediate: true
    },
  },

  created() {
    if (this.idx === 0 && !this.image) {
      this.value.volumeName = null;
    }
  },

  methods: {
    update() {
      this.$emit('update');
    },
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div
        data-testid="input-hee-name"
        class="col span-6"
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
        data-testid="input-hee-type"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.type')"
          :value="value.type"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :mode="mode"
            :options="VOLUME_TYPE"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div
        data-testid="input-hee-volumeName"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.volume')"
          :value="value.volumeName"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.volumeName"
            :disabled="isDisabled"
            :label="t('harvester.fields.volume')"
            :mode="mode"
            :options="volumeOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hee-size"
        class="col span-6"
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
            :label="t('harvester.fields.size')"
            :mode="mode"
            :disabled="true"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div
        v-if="!!image"
        data-testid="input-hee-image"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.image')"
          :value="image"
          :mode="mode"
        >
          <LabeledInput
            v-model="image"
            :label="t('harvester.fields.image')"
            :mode="mode"
            :disabled="true"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hee-bus"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.virtualMachine.volume.bus')"
          :value="value.bus"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.bus"
            :label="t('harvester.virtualMachine.volume.bus')"
            :mode="mode"
            :options="InterfaceOption"
            :disabled="true"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
  </div>
</template>

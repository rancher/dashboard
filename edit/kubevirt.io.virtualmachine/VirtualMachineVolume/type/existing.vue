<script>
import Banner from '@/components/Banner';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';

import { sortBy } from '@/utils/sort';
import { HCI, PVC } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  name:       'Existing',
  components: {
    Banner, UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
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

    vm: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    value: {
      type:     Object,
      required: true
    },

    namespace: {
      type:     String,
      default:  null
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

    idx: {
      type:    Number,
      default: 0
    },

    rows: {
      type:    Array,
      default: () => {
        return [];
      }
    },

    needRootDisk: {
      type:    Boolean,
      default: false
    },
  },

  data() {
    if (this.value.realName) {
      this.value.volumeName = this.value.realName;
    }

    return {
      loading: false,
      errors:  []
    };
  },

  computed: {
    isDisabled() {
      return !this.value.newCreateId && this.isEdit;
    },

    allPVCs() {
      return this.$store.getters['harvester/all'](PVC).filter((P) => {
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
      return this.allPVCs.find( P => P.metadata.name === this.value.realName );
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

            return isAvailable && !isBeingUsed;
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

    needSetPVC() {
      return !!this.errors.length || (!this.value.newCreateId && this.isEdit && this.value.size !== this.pvcResource?.spec?.resources?.requests?.storage);
    }
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
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput v-model="value.name" :label="t('harvester.fields.name')" :mode="mode" required />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :mode="mode"
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
            :disabled="isEdit"
            :label="t('harvester.fields.volume')"
            :mode="mode"
            :options="volumeOption"
            required
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput
            v-model="value.size"
            output-suffic-text="Gi"
            output-as="string"
            :label="t('harvester.fields.size')"
            suffix="GiB"
            :mode="mode"
            :disabled="true"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div v-if="!!image" class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.image')" :value="image" :mode="mode">
          <LabeledInput v-model="image" :label="t('harvester.fields.image')" :mode="mode" :disabled="true" />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
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
    </div>

    <div v-for="(err,index) in errors" :key="index">
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

<script>
import Banner from '@/components/Banner';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { HCI, PVC } from '@/config/types';
import { formatSi, parseSi } from '@/utils/units';

export default {
  name: 'HarvesterEditVMImage',

  components: {
    Banner, UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
  },

  props:  {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
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
    isCreate: {
      type:    Boolean,
      default: true
    },
    isEdit: {
      type:    Boolean,
      default: false
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
    imagesOption() {
      const choise = this.$store.getters['harvester/all'](HCI.IMAGE);

      return choise.map( (I) => {
        return {
          label: `${ I.metadata.namespace }/${ I.spec.displayName }`,
          value: I.id
        };
      });
    },

    imageName() {
      const image = this.imagesOption.find(I => I.value === this.value.image);

      return image ? image.label : '-';
    },

    pvcsResource() {
      const allPVCs = this.$store.getters['harvester/all'](PVC) || [];

      return allPVCs.find((P) => {
        return this.namespace ? P.id === `${ this.namespace }/${ this.value.volumeName }` : true;
      });
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

    onImageChange() {
      const imageResource = this.$store.getters['harvester/all'](HCI.IMAGE).find( I => this.value.image === I.id);
      const isIso = /.iso$/i.test(imageResource?.spec?.url);

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
  }
};
</script>

<template>
  <div @input="update">
    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput v-model="value.name" :label="t('harvester.fields.name')" required :mode="mode" />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.type')" :value="value.type" :mode="mode">
          <LabeledSelect
            v-model="value.type"
            :label="t('harvester.fields.type')"
            :options="typeOption"
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.image')" :value="imageName" :mode="mode">
          <LabeledSelect
            v-model="value.image"
            :disabled="idx === 0 && !isCreate && !value.newCreateId"
            :label="t('harvester.fields.image')"
            :options="imagesOption"
            :mode="mode"
            :required="validateRequired"
            @input="onImageChange"
          />
        </InputOrDisplay>
      </div>

      <div class="col span-6">
        <InputOrDisplay :name="t('harvester.fields.size')" :value="value.size" :mode="mode">
          <UnitInput
            v-model="value.size"
            :output-modifier="true"
            :increment="1024"
            :input-exponent="3"
            :label="t('harvester.fields.size')"
            :mode="mode"
            :required="validateRequired"
            suffix="GiB"
            :disabled="isDisabled"
          />
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

<script>
import { findBy } from '@shell/utils/array';
import UnitInput from '@shell/components/form/UnitInput';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import InputOrDisplay from '@shell/components/InputOrDisplay';
import { PVC } from '@shell/config/types';
import { HCI } from '../../../../types';
import { formatSi, parseSi } from '@shell/utils/units';
import { VOLUME_TYPE, InterfaceOption } from '../../../../config/harvester-map';

export default {
  name: 'HarvesterEditVMImage',

  components: {
    UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
  },

  props: {
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

    mode: {
      type:    String,
      default: 'create'
    },

    idx: {
      type:     Number,
      required: true
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
      images:  [],
    };
  },

  fetch() {
    this.images = this.$store.getters['harvester/all'](HCI.IMAGE);
  },

  computed: {
    imagesOption() {
      return this.images.filter(c => c.isReady).sort((a, b) => a.creationTimestamp > b.creationTimestamp ? -1 : 1).map( (I) => {
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

    'value.image'(neu) {
      this.checkImageExists(neu);
    },

    imagesOption() {
      this.checkImageExists(this.value.image);
    },

    pvcsResource: {
      handler(pvc) {
        if (pvc?.spec?.resources?.requests?.storage && this.isVirtualType) {
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
      const imageResource = this.$store.getters['harvester/all'](HCI.IMAGE)?.find( I => this.value.image === I.id);

      if (this.idx === 0) {
        if (/iso$/i.test(imageResource?.imageSuffix)) {
          this.$set(this.value, 'type', 'cd-rom');
          this.$set(this.value, 'bus', 'sata');
        } else {
          this.$set(this.value, 'type', 'disk');
          this.$set(this.value, 'bus', 'virtio');
        }
      }

      this.update();
    },

    onOpen() {
      this.images = this.$store.getters['harvester/all'](HCI.IMAGE);
    },

    checkImageExists(imageId) {
      if (!!imageId && this.imagesOption.length > 0 && !findBy(this.imagesOption, 'value', imageId)) {
        this.$store.dispatch('growl/error', {
          title:   this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistImage.title', { name: imageId }),
          message: this.$store.getters['i18n/t']('harvester.vmTemplate.tips.notExistImage.message')
        }, { root: true });

        this.$set(this.value, 'image', '');
      }
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-20">
      <div
        data-testid="input-hevi-name"
        class="col span-6"
      >
        <InputOrDisplay :name="t('harvester.fields.name')" :value="value.name" :mode="mode">
          <LabeledInput
            v-model="value.name"
            :label="t('harvester.fields.name')"
            required
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hevi-type"
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
            :options="VOLUME_TYPE"
            :mode="mode"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div
        data-testid="input-hevi-image"
        class="col span-6"
      >
        <InputOrDisplay
          :name="t('harvester.fields.image')"
          :value="imageName"
          :mode="mode"
        >
          <LabeledSelect
            v-model="value.image"
            :disabled="idx === 0 && !isCreate && !value.newCreateId && isVirtualType"
            :label="t('harvester.fields.image')"
            :options="imagesOption"
            :mode="mode"
            :searchable="true"
            :required="validateRequired"
            @input="onImageChange"
          />
        </InputOrDisplay>
      </div>

      <div
        data-testid="input-hevi-size"
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
            :required="validateRequired"
            suffix="GiB"
            :disabled="isDisabled"
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>

    <div class="row mb-20">
      <div
        data-testid="input-hevi-bus"
        class="col span-3"
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
            @input="update"
          />
        </InputOrDisplay>
      </div>
    </div>
  </div>
</template>

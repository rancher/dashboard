<script>
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';
import { HCI, PVC } from '@/config/types';
import { exceptionToErrorsArray } from '@/utils/error';

export default {
  name: 'VMImage',

  components: {
    AsyncButton, Banner, UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
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
      const choise = this.$store.getters['virtual/all'](HCI.IMAGE);

      return choise.map( (I) => {
        return {
          label: `${ I.metadata.namespace }/${ I.spec.displayName }`,
          value: I.id
        };
      });
    },

    pvcsResource() {
      const allPVCs = this.$store.getters['virtual/all'](PVC) || [];

      return allPVCs.find((P) => {
        return this.namespace ? P.id === `${ this.namespace }/${ this.value.volumeName }` : true;
      });
    },

    needSetPVC() {
      return !!this.errors.length || (!this.value.newCreateId && this.isEdit && this.value.size !== this.pvcsResource?.spec?.resources?.requests?.storage);
    }
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

    onImageChange() {
      const imageResource = this.$store.getters['virtual/all'](HCI.IMAGE).find( I => this.value.image === I.id);
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

    async savePVC(done) {
      this.$set(this.pvcsResource.spec.resources.requests, 'storage', this.value.size);

      this.loading = true;
      try {
        await this.pvcsResource.save();
        this.errors = [];

        this.$store.dispatch('growl/success', {
          title:   this.t('harvester.notification.title.succeed'),
          message: this.t('harvester.virtualMachine.volume.volumeUpdate', { name: this.value.volumeName })
        }, { root: true });

        done(true);
      } catch (err) {
        done(false);
        this.$set(this, 'errors', exceptionToErrorsArray(err));
      }
      this.loading = false;
    }
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
          <UnitInput
            v-model="value.size"
            output-suffic-text="Gi"
            output-as="string"
            :label="t('harvester.fields.size')"
            :mode="mode"
            suffix="GiB"
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

    <div class="action">
      <AsyncButton
        v-show="needSetPVC"
        mode="refresh"
        size="sm"
        :action-label="t('harvester.virtualMachine.volume.saveVolume')"
        :waiting-label="t('harvester.virtualMachine.volume.saveVolume')"
        :success-label="t('harvester.virtualMachine.volume.saveVolume')"
        :error-label="t('harvester.virtualMachine.volume.saveVolume')"
        @click="savePVC"
      />
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

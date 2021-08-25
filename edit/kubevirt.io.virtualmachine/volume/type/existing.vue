<script>
import Banner from '@/components/Banner';
import AsyncButton from '@/components/AsyncButton';
import UnitInput from '@/components/form/UnitInput';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import InputOrDisplay from '@/components/InputOrDisplay';

import { sortBy } from '@/utils/sort';
import { HCI, PVC } from '@/config/types';
import { exceptionToErrorsArray } from '@/utils/error';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  name:       'Existing',
  components: {
    AsyncButton, Banner, UnitInput, LabeledInput, LabeledSelect, InputOrDisplay
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
      required: true
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

    bootOrderOption: {
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
    allPVCs() {
      return this.$store.getters['virtual/all'](PVC).filter(P => this.namespace === P.metadata.namespace) || [];
    },

    image() {
      const imageResource = this.$store.getters['virtual/all'](HCI.IMAGE).find(I => I.id === this.pvcResource?.metadata?.annotations?.[HCI_ANNOTATIONS.IMAGE_ID]);

      if (!imageResource) {
        return;
      }

      return `${ imageResource.metadata.namespace }/${ imageResource.spec.displayName }`;
    },

    pvcResource() {
      return this.allPVCs.find( P => P.metadata.name === this.value.realName);
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
      return !!this.errors.length || (!this.value.newCreateId && this.isEdit && this.value.size !== this.pvcsResource?.spec?.resources?.requests?.storage);
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

    setRootDisk() {
      this.$emit('setRootDisk', this.idx);
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

    <div class="action">
      <button v-if="needRootDisk" type="button" class="btn bg-primary mr-15" @click="setRootDisk()">
        {{ t('harvester.virtualMachine.volume.setFirst') }}
      </button>

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

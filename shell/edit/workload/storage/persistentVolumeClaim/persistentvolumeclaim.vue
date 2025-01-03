<script>
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { LabeledInput } from '@components/Form/LabeledInput';
import { mapGetters } from 'vuex';
import { removeObject, addObject } from '@shell/utils/array';
import { STORAGE_CLASS, PV } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';
import { get } from '@shell/utils/object';

export default {
  emits: ['createUniqueId', 'removePvcForm', 'update:value'],

  components: {
    LabeledSelect, UnitInput, RadioGroup, Checkbox, LabeledInput
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

    registerBeforeHook: {
      type:    Function,
      default: null,
    },

    savePvcHookName: {
      type:     String,
      default:  '',
      required: true
    },
  },
  async fetch() {
    const hash = await allHash({
      storageClasses:    this.$store.dispatch('cluster/findAll', { type: STORAGE_CLASS }),
      persistentVolumes: this.$store.dispatch('cluster/findAll', { type: PV }),
    });

    this.storageClasses = hash.storageClasses;
    this.persistentVolumes = hash.persistentVolumes;
    this.spec['storageClassName'] = (this.spec.storageClassName || this.defaultStorageClassName);
  },

  data() {
    const spec = this.value.spec;

    if (!this.value.metadata) {
      this.value['metadata'] = {};
    }

    this.value.spec['accessModes'] = this.value.spec.accessModes || [];

    return {
      storageClasses:    [],
      persistentVolumes: [],
      isCreatePV:        true,
      spec,
      uniqueId:          new Date().getTime() // Allows form state to be individually deleted
    };
  },

  computed: {
    storageClassNames() {
      return this.storageClasses.map((sc) => sc.metadata.name);
    },

    /**
     * Required to initialize with default SC on creation
     */
    defaultStorageClassName() {
      return this.storageClasses.find((sc) => sc.metadata?.annotations?.['storageclass.beta.kubernetes.io/is-default-class'] === 'true' ||
        sc.metadata?.annotations?.['storageclass.kubernetes.io/is-default-class'] === 'true')?.metadata.name ;
    },

    availablePVs() {
      return this.persistentVolumes.reduce((total, each) => {
        if (each?.status?.phase === 'Available') {
          total.push(each);
        }

        return total;
      }, []);
    },

    persistentVolumeNames() {
      return this.availablePVs.map((pv) => pv.metadata.name);
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    isCreatePV(neu) {
      if (neu) {
        delete this.spec.volumeName;
        this.spec.resources.requests.storage = null;
      } else {
        this.spec.resources.requests.storage = null;
      }
    },
  },

  created() {
    this.value.uniqueId = this.uniqueId;
    this.$emit('createUniqueId');
    if (this.registerBeforeHook) {
      // Append the uniqueID to the PVC hook name so that form state for each can be deleted individually
      this.registerBeforeHook(this.value.save, this.savePvcHookName + this.uniqueId, undefined, this.value);
    }
  },

  beforeUnmount() {
    this.$emit('removePvcForm', this.savePvcHookName + this.uniqueId);
  },

  methods: {
    updateMode(mode, enabled) {
      if (enabled) {
        addObject(this.value.spec.accessModes, mode);
      } else {
        removeObject(this.value.spec.accessModes, mode);
      }
    },

    updatePV(pv) {
      this.spec['volumeName'] = pv.metadata.name;
      this.spec['storageClassName'] = (pv.spec.storageClassName || '');
      this.spec.resources.requests.storage = pv?.spec?.capacity?.storage;
    },

    updateStorage(neu = '') {
      if (!neu.toString().match(/[0-9]*[a-zA-Z]+$/)) {
        neu += 'Gi';
      }

      this.spec.resources.requests.storage = neu;
    },

    volumeName(vol) {
      return get(vol, 'metadata.name') || vol;
    }
  }
};
</script>

<template>
  <div>
    <div class="row mb-10">
      <div class="col span-6">
        <LabeledInput
          v-model:value="value.metadata.name"
          :mode="mode"
          :label="t('persistentVolumeClaim.name')"
          :required="true"
          @update:value="$emit('update:value', value)"
        />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-6">
        <RadioGroup
          v-model:value="isCreatePV"
          name="isCreatePV"
          :options="[true, false]"
          :labels="[t('persistentVolumeClaim.source.options.new'), t('persistentVolumeClaim.source.options.existing')]"
          :mode="mode"
        />
      </div>
      <div class="col span-6">
        <LabeledSelect
          v-if="isCreatePV"
          v-model:value="spec.storageClassName"
          data-testid="storage-class-name"
          :mode="mode"
          :required="true"
          :label="t('persistentVolumeClaim.storageClass')"
          :options="storageClassNames"
        />
        <LabeledSelect
          v-else
          :value="spec.volumeName"
          :get-option-label="volumeName"
          :required="true"
          :mode="mode"
          :label="t('persistentVolumeClaim.volumes')"
          :options="availablePVs"
          @update:value="updatePV"
        />
      </div>
    </div>

    <div class="row mb-10">
      <div class="col span-6">
        <div class="access-modes">
          <t
            class="text-label"
            k="persistentVolumeClaim.accessModes"
          />
          <span class="text-error">*</span>
        </div>
        <div class="access-modes">
          <Checkbox
            :mode="mode"
            :value="value.spec.accessModes.includes('ReadWriteOnce')"
            :label="t('persistentVolumeClaim.accessModesOptions.singleNodeRW')"
            @update:value="e=>updateMode('ReadWriteOnce', e)"
          />
          <Checkbox
            :mode="mode"
            :value="value.spec.accessModes.includes('ReadOnlyMany')"
            :label="t('persistentVolumeClaim.accessModesOptions.manyNodeR')"
            @update:value="e=>updateMode('ReadOnlyMany', e)"
          />
          <Checkbox
            :mode="mode"
            :value="value.spec.accessModes.includes('ReadWriteMany')"
            :label="t('persistentVolumeClaim.accessModesOptions.manyNodeRW')"
            @update:value="e=>updateMode('ReadWriteMany', e)"
          />
        </div>
      </div>
      <div
        v-if="isCreatePV"
        class="col span-6"
      >
        <UnitInput
          v-model:value="spec.resources.requests.storage"
          :mode="mode"
          :label="t('persistentVolumeClaim.capacity')"
          :increment="1024"
          :input-exponent="3"
          :required="true"
          :output-modifier="true"
        />
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
.access-modes {
  display: flex;
  flex-direction: row;
}
</style>

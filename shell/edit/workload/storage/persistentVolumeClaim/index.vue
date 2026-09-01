<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { Checkbox } from '@components/Form/Checkbox';
import { mapGetters } from 'vuex';
import PersistentVolumeClaim from '@shell/edit/workload/storage/persistentVolumeClaim/persistentvolumeclaim';
import { PVC } from '@shell/config/types';

export default {
  emits: ['removePvcForm'],

  components: {
    LabeledInput,
    LabeledSelect,
    PersistentVolumeClaim,
    Checkbox
  },

  props: {
    podSpec: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create'
    },

    namespace: {
      type:    String,
      default: null
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },

    // array of existing persistent volume claims
    pvcs: {
      type:    Array,
      default: () => []
    },

    registerBeforeHook: {
      type:    Function,
      default: null,
    },

    savePvcHookName: {
      type:     String,
      required: true
    },
    loading: {
      default: false,
      type:    Boolean
    },
  },

  async fetch() {
    // Create the new PVC form state if it doesn't exist
    if (this.value.__newPvc) {
      return;
    }
    const namespace = this.namespace || this.$store.getters['defaultNamespace'];

    const data = { type: PVC };

    data.metadata = { namespace };

    const pvc = await this.$store.dispatch('cluster/create', data);

    pvc.applyDefaults();
    this.value['__newPvc'] = pvc;
  },

  computed: {
    // whether this is creating a new PVC or referencing an existing one
    createNew() {
      return this.value._type === 'createPVC';
    },

    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    namespace(neu) {
      this.value.__newPvc.metadata.namespace = neu;
    },

    'value.__newPvc.metadata.name'(neu) {
      this.value.persistentVolumeClaim.claimName = neu;
    }
  },

  methods: {
    removePvcForm(hookName) {
      this.$emit('removePvcForm', hookName);
    }
  }
};
</script>

<template>
  <div v-if="value.__newPvc">
    <div>
      <div
        v-if="createNew"
        class="bordered-section"
      >
        <PersistentVolumeClaim
          v-if="value.__newPvc"
          v-model:value="value.__newPvc"
          :mode="mode"
          :register-before-hook="registerBeforeHook"
          :save-pvc-hook-name="savePvcHookName"
          @removePvcForm="removePvcForm"
        />
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="value.name"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.volumeName')"
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-if="!createNew"
            v-model:value="value.persistentVolumeClaim.claimName"
            :required="true"
            :mode="mode"
            :label="t('workload.storage.subtypes.persistentVolumeClaim')"
            :options="pvcs"
            :loading="loading"
          />
        </div>
      </div>
      <div class="row">
        <Checkbox
          v-model:value="value.persistentVolumeClaim.readOnly"
          :mode="mode"
          :label="t('workload.storage.readOnly')"
        />
      </div>
    </div>
  </div>
</template>

<script>
// Added by Verrazzano
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { SECRET } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'ImagePullSecrets',
  components: { LabeledSelect },
  mixins:     [VerrazzanoHelper],
  props:      {
    value: {
      type:    Array,
      default: () => ([])
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    label: {
      type:    String,
      default: ''
    },
    required: {
      type:    Boolean,
      default: false
    },
  },
  data() {
    const imagePullSecretNames = this.value.map(each => each.name);

    return {
      fetchInProgress: true,
      namespace:       this.namespacedObject.metadata.namespace,
      allSecretNames:  {},
      secretNames:     [],
      fieldLabel:      this.label,
      imagePullSecretNames,
    };
  },
  async fetch() {
    this.allSecretNames = {};
    const requests = {};

    if (this.$store.getters['management/schemaFor'](SECRET)) {
      requests.secrets = this.$store.dispatch('management/findAll', { type: SECRET });
    }

    const hash = await allHash(requests);

    if (hash.secrets) {
      this.sortObjectsByNamespace(hash.secrets, this.allSecretNames, true);
    }
    this.fetchInProgress = false;
  },
  computed: {
    placeholder() {
      let result;

      if (this.imagePullSecretNames.length === 0) {
        result = this.t('verrazzano.common.values.notSet');
      }

      return result;
    }
  },
  methods: {
    resetSecrets() {
      if (!this.fetchInProgress) {
        this.secretNames = this.allSecretNames[this.namespace] || [];
      }
    },
    setImagePullSecrets(value) {
      // LabeledSelect is broken.  Sometimes the value is the new item selected
      // and other times it is the expected array of strings.  Just ignore the
      // calls that do not pass an array and everything works fine.
      //
      if (Array.isArray(value)) {
        const newValue = value.map((secretName) => {
          return { name: secretName };
        });

        this.$emit('input', newValue);
      }
    },
  },
  created() {
    if (!this.fieldLabel) {
      this.fieldLabel = this.t('verrazzano.common.fields.imagePullSecrets');
    }
  },
  watch: {
    fetchInProgress() {
      this.resetSecrets();
    },
    'value.metadata.namespace'(neu, old) {
      this.namespace = neu;
      this.resetSecrets();
    }
  },
};
</script>

<template>
  <LabeledSelect
    v-model="imagePullSecretNames"
    :mode="mode"
    :multiple="true"
    :taggable="true"
    :required="required"
    :options="secretNames"
    :placeholder="placeholder"
    :label="fieldLabel"
    @input="setImagePullSecrets($event)"
  />
</template>

<style scoped>

</style>

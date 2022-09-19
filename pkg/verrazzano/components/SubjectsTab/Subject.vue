<script>
// Added by Verrazzano
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

import { NAMESPACE, SERVICE_ACCOUNT } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

export default {
  name:       'Subject',
  components: {
    LabeledInput,
    LabeledSelect,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
  },
  data() {
    return {
      fetchInProgress:    true,
      allNamespaces:      [],
      allServiceAccounts: {},
      serviceAccounts:    [],
    };
  },
  async fetch() {
    const requests = {
      namespaces:      this.$store.dispatch('management/findAll', { type: NAMESPACE }),
      serviceAccounts: this.$store.dispatch('management/findAll', { type: SERVICE_ACCOUNT }),
    };

    const hash = await allHash(requests);

    if (hash.namespaces) {
      this.allNamespaces = hash.namespaces;
    }
    if (hash.serviceAccounts) {
      this.sortObjectsByNamespace(hash.serviceAccounts, this.allServiceAccounts);
    }
    this.fetchInProgress = false;
  },
  computed: {
    kindOptions() {
      return [
        { value: 'User', label: this.t('verrazzano.common.types.subjectKind.user') },
        { value: 'Group', label: this.t('verrazzano.common.types.subjectKind.group') },
        { value: 'ServiceAccount', label: this.t('verrazzano.common.types.subjectKind.serviceAccount') },
      ];
    },
    nameIsSelect() {
      return this.value.kind === 'ServiceAccount';
    }
  },
  methods: {
    resetServiceAccounts() {
      if (this.value.namespace) {
        this.serviceAccounts = this.allServiceAccounts[this.value.namespace] || [];
      }
    },
    resetNameField(kind) {
      // Only blank out the name if changing to a service account and the name
      // does not match the name of a service account in the selected namespace.
      //
      // Note that if the namespace is not yet set, then the serviceAccounts array
      // will be empty so the name will not be reset.
      //
      if (kind === 'ServiceAccount' && this.value.name &&
        this.serviceAccounts.findIndex(sa => sa.metadata.name === this.value.name) === -1) {
        this.setField('name', undefined);
      }
    }
  },
  watch: {
    fetchInProgress() {
      this.resetServiceAccounts();
    },
    'value.namespace'(neu, old) {
      this.resetServiceAccounts();

      // If setting the namespace from an empty value,
      // make sure that the name field is consistent with
      // the current kind value.
      //
      if (neu && !old) {
        this.resetNameField(this.value.kind);
      }
    },
    'value.kind'(neu, _old) {
      this.resetNameField(neu);
    }
  },
};
</script>

<template>
  <div class="row">
    <div class="col span-3">
      <LabeledSelect
        :value="getField('namespace')"
        :mode="mode"
        :options="allNamespaces"
        option-label="metadata.name"
        :reduce="namespace => namespace.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'namespace')"
        :label="t('verrazzano.common.fields.namespace')"
        @input="setFieldIfNotEmpty('namespace', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledInput
        :value="getField('apiGroup')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'apiGroup')"
        :label="t('verrazzano.common.fields.apiGroup')"
        @input="setFieldIfNotEmpty('apiGroup', $event)"
      />
    </div>
    <div class="col span-3">
      <LabeledSelect
        :value="getField('kind')"
        :mode="mode"
        :options="kindOptions"
        option-key="value"
        option-label="label"
        :placeholder="getNotSetPlaceholder(value, 'kind')"
        :label="t('verrazzano.common.fields.kind')"
        @input="setFieldIfNotEmpty('kind', $event)"
      />
    </div>
    <div v-if="nameIsSelect" class="col span-3">
      <LabeledSelect
        :value="getField('name')"
        :mode="mode"
        :options="serviceAccounts"
        option-label="metadata.name"
        :reduce="sa => sa.metadata.name"
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
    <div v-else class="col span-3">
      <LabeledInput
        :value="getField('name')"
        :mode="mode"
        :placeholder="getNotSetPlaceholder(value, 'name')"
        :label="t('verrazzano.common.fields.name')"
        @input="setFieldIfNotEmpty('name', $event)"
      />
    </div>
  </div>
</template>

<style scoped>

</style>

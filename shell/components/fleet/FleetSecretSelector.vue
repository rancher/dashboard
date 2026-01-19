<script lang="ts" setup>
import { ref, computed } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import { TYPES } from '@shell/models/secret';
import { SECRET } from '@shell/config/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';

interface Secret {
  id?: string;
  name: string;
  namespace: string;
  _type: string;
}

const props = defineProps({
  value: {
    type:     Object,
    required: true,
  },
  namespace: {
    type:     String,
    required: true,
  },
  inStore: {
    type:    String,
    default: 'management',
  },
  mode: {
    type:    String,
    default: _EDIT
  },
  label: {
    type:    String,
    default: '',
  },
});

const emit = defineEmits(['update:value']);

const types = computed<string[]>(() => Object.values(TYPES));

const secrets = ref<Secret[]>([]);

const allSecretsSettings = {
  updateResources: (secretsList: Secret[]) => {
    const allSecretsInNamespace = secretsList.filter((secret) => types.value.includes(secret._type) && secret.namespace === props.namespace);
    const mappedSecrets = mapSecrets(allSecretsInNamespace.sort((a, b) => a.name.localeCompare(b.name)));

    secrets.value = allSecretsInNamespace;

    return mappedSecrets;
  }
};

const paginateSecretsSetting = {
  requestSettings: paginatePageOptions,
  updateResources: (secretsList: Secret[]) => {
    const mappedSecrets = mapSecrets(secretsList);

    secrets.value = secretsList;

    return mappedSecrets;
  }
};

function mapSecrets(secretsList: Secret[]) {
  return secretsList.reduce<{ label: string; value: string }[]>((res, s) => {
    if (s.id) {
      res.push({ label: s.name, value: s.name });
    } else {
      res.push(s as any);
    }

    return res;
  }, []);
}

function update(value: any) {
  emit('update:value', value);
}

function paginatePageOptions(opts: any) {
  const { opts: { filter } } = opts;

  const filters = !!filter ? [PaginationParamFilter.createSingleField({
    field: 'metadata.name', value: filter, exact: false, equals: true
  })] : [];

  filters.push(
    PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: props.namespace }),
    PaginationParamFilter.createMultipleFields(types.value.map((t) => ({
      field:  'metadata.fields.1',
      equals: true,
      exact:  true,
      value:  t
    })))
  );

  return {
    ...opts,
    filters,
    groupByNamespace: false,
    classify:         true,
    sort:             [{ asc: true, field: 'metadata.name' }],
  };
}
</script>

<template>
  <ResourceLabeledSelect
    :key="namespace"
    :value="value"
    :label="label || t('fleet.secrets.label')"
    :mode="mode"
    :resource-type="SECRET"
    :loading="$fetchState.pending"
    :in-store="inStore"
    :paginated-resource-settings="paginateSecretsSetting"
    :all-resources-settings="allSecretsSettings"
    :multiple="true"
    @update:value="update"
  />
</template>

<style lang="scss" scoped>
</style>

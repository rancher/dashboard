<script lang="ts" setup>
import { ref } from 'vue';
import { _EDIT } from '@shell/config/query-params';
import { CONFIG_MAP } from '@shell/config/types';
import { PaginationParamFilter } from '@shell/types/store/pagination.types';
import ResourceLabeledSelect from '@shell/components/form/ResourceLabeledSelect.vue';

interface ConfigMap {
  id?: string;
  name: string;
  namespace: string;
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

const configMaps = ref<ConfigMap[]>([]);

const allConfigMapsSettings = {
  updateResources: (configMapsList: ConfigMap[]) => {
    const allConfigMapsInNamespace = configMapsList.filter((configMap) => configMap.namespace === props.namespace);
    const mappedConfigMaps = mapConfigMaps(allConfigMapsInNamespace.sort((a, b) => a.name.localeCompare(b.name)));

    configMaps.value = allConfigMapsInNamespace;

    return mappedConfigMaps;
  }
};

const paginateConfigMapsSetting = {
  requestSettings: paginatePageOptions,
  updateResources: (configMapsList: ConfigMap[]) => {
    const mappedConfigMaps = mapConfigMaps(configMapsList);

    configMaps.value = configMapsList;

    return mappedConfigMaps;
  }
};

function mapConfigMaps(configMapsList: ConfigMap[]) {
  return configMapsList.reduce<{ label: string; value: string }[]>((res, c) => {
    if (c.id) {
      res.push({ label: c.name, value: c.name });
    } else {
      res.push(c as any);
    }

    return res;
  }, []);
}

function paginatePageOptions(opts: any) {
  const { opts: { filter } } = opts;

  const filters = !!filter ? [PaginationParamFilter.createSingleField({
    field: 'metadata.name', value: filter, exact: false, equals: true
  })] : [];

  filters.push(
    PaginationParamFilter.createSingleField({ field: 'metadata.namespace', value: props.namespace }),
  );

  return {
    ...opts,
    filters,
    groupByNamespace: false,
    classify:         true,
    sort:             [{ asc: true, field: 'metadata.name' }],
  };
}

function update(value: any) {
  emit('update:value', value);
}
</script>

<template>
  <ResourceLabeledSelect
    :key="namespace"
    :value="value"
    :label="label || t('fleet.configMaps.label')"
    :mode="mode"
    :resource-type="CONFIG_MAP"
    :loading="$fetchState.pending"
    :in-store="inStore"
    :paginated-resource-settings="paginateConfigMapsSetting"
    :all-resources-settings="allConfigMapsSettings"
    :multiple="true"
    @update:value="update"
  />
</template>

<style lang="scss" scoped>
</style>

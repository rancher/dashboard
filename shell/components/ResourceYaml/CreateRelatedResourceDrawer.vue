<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Banner } from '@components/Banner';
import { RcButton } from '@components/RcButton';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import Loading from '@shell/components/Loading.vue';
import YamlEditor from '@shell/components/YamlEditor.vue';
import { RelatedResourceType } from '@shell/components/ResourceYaml/types';
import { SCHEMA } from '@shell/config/types';
import { createYaml } from '@shell/utils/create-yaml';
import { stringify } from '@shell/utils/error';

const props = defineProps<{
  /** The types a resource can be created as */
  types: RelatedResourceType[],

  /** Set on the new resource when its type is namespaced */
  namespace?: string,
}>();

const emit = defineEmits<{ close: [] }>();

const store = useStore();
const i18n = useI18n(store);

const title = computed(() => i18n.t('resourceYaml.resourceGraph.create'));

// the source option for a blank resource, which no `nodeId` matches
const BLANK = '';

const typeOptions = computed(() => props.types.map(({ key, label }) => ({ value: key, label })));

const selectedKey = ref<string>();
const sourceId = ref(BLANK);

const selectedType = computed(() => props.types.find((t) => t.key === selectedKey.value));

const sourceOptions = computed(() => [
  { value: BLANK, label: i18n.t('resourceYaml.createRelatedResource.blank') },
  ...(selectedType.value?.sources || []).map(({ id, label }) => ({ value: id, label })),
]);

const yaml = ref('');
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const saveError = ref('');

// the yaml ResourceDetail creates for a new resource edited as yaml
const initialYamlFor = async({ type, resource }: RelatedResourceType): Promise<string> => {
  const schema = resource.$getters['schemaFor'](type);
  const data: any = { type };

  if (schema?.attributes?.namespaced) {
    data.metadata = { namespace: props.namespace || store.getters['defaultNamespace'] };
  }

  if (schema?.fetchResourceFields) {
    // fetch resourceFields for createYaml
    await schema.fetchResourceFields();
  }

  return createYaml(resource.$getters['all'](SCHEMA), type, data);
};

// a load for an earlier selection can finish after this one
let loadCount = 0;

const load = async() => {
  const type = selectedType.value;
  const source = type?.sources.find((s) => s.id === sourceId.value);
  const count = ++loadCount;

  yaml.value = '';
  error.value = '';
  saveError.value = '';

  if (!type) {
    return;
  }

  loading.value = true;

  try {
    const loaded = source ? await source.cloneYaml() : await initialYamlFor(type);

    if (count === loadCount) {
      yaml.value = loaded;
    }
  } catch (e) {
    if (count === loadCount) {
      error.value = stringify(e);
    }
  } finally {
    if (count === loadCount) {
      loading.value = false;
    }
  }
};

const selectType = (key: string) => {
  selectedKey.value = key;
  sourceId.value = BLANK;
  load();
};

const selectSource = (id: string) => {
  sourceId.value = id;
  load();
};

const canSave = computed(() => !!selectedType.value && !!yaml.value && !loading.value && !saving.value);

const save = async() => {
  const type = selectedType.value;

  if (!type) {
    return;
  }

  saving.value = true;
  saveError.value = '';

  try {
    await type.save(yaml.value);
    emit('close');
  } catch (e) {
    saveError.value = stringify(e);
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Drawer
    :ariaTarget="title"
    @close="emit('close')"
  >
    <template #title>
      {{ title }}
    </template>
    <template #body>
      <div class="create-related-resource">
        <div class="create-related-resource-selects">
          <LabeledSelect
            :value="selectedKey"
            :options="typeOptions"
            :append-to-body="false"
            :label="i18n.t('resourceYaml.createRelatedResource.type')"
            data-testid="create-related-resource-type"
            @update:value="selectType"
          />
          <LabeledSelect
            v-if="selectedType"
            :value="sourceId"
            :options="sourceOptions"
            :append-to-body="false"
            :label="i18n.t('resourceYaml.createRelatedResource.source')"
            data-testid="create-related-resource-source"
            @update:value="selectSource"
          />
        </div>
        <Banner
          v-if="error"
          color="error"
          :label="error"
        />
        <div
          v-else-if="loading"
          class="create-related-resource-loading"
        >
          <Loading mode="relative" />
        </div>
        <template v-else-if="selectedType">
          <Banner
            v-if="saveError"
            color="error"
            :label="saveError"
            data-testid="create-related-resource-save-error"
          />
          <YamlEditor
            :key="`${selectedKey}/${sourceId}`"
            v-model:value="yaml"
            data-testid="create-related-resource-yaml"
          />
        </template>
      </div>
    </template>
    <template #additional-actions>
      <RcButton
        variant="primary"
        size="large"
        :disabled="!canSave"
        data-testid="create-related-resource-save"
        @click="save"
      >
        {{ i18n.t('generic.save') }}
      </RcButton>
    </template>
  </Drawer>
</template>

<style lang="scss" scoped>
.create-related-resource {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.create-related-resource-selects {
  display: flex;
  gap: 16px;

  & > * {
    flex: 1 1 0;
  }
}

.create-related-resource-loading {
  position: relative;
  min-height: 200px;
}
</style>

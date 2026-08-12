<script setup lang="ts">
import { computed, onMounted, ref, useTemplateRef } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import { LabeledInput } from '@components/Form/LabeledInput';
import { RcButton } from '@components/RcButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import AsyncButton from '@shell/components/AsyncButton';
import YamlEditor, { EDITOR_MODES } from '@shell/components/YamlEditor';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { sortBy } from '@shell/utils/sort';
import { CONFIG_MAP, NAMESPACE } from '@shell/config/types';
import { CATTLE_UI_RESOURCE_TEMPLATE } from '@shell/config/labels-annotations';
import { _CLONE } from '@shell/config/query-params';
import ResourceTemplateUtils from '@shell/utils/resource-template';

interface Props {
  resources: any[];
}

const props = defineProps<Props>();
const emit = defineEmits<{(e: 'close'): void }>();

const store = useStore();
const { t } = useI18n(store);

const resource = computed(() => props.resources[0]);

const name = ref('');
const allNamespaces = ref<any[]>([]);
const selectedNamespace = ref<string | undefined>(resource.value?.metadata?.namespace);
const yamlContent = ref('');
const errors = ref<any[]>([]);
const editorMode = EDITOR_MODES.EDIT_CODE;

const yamlEditorRef = useTemplateRef<any>('yamleditor');

onMounted(async() => {
  allNamespaces.value = (await store.dispatch('cluster/findAll', {
    type: NAMESPACE,
    opt:  { url: 'namespaces' },
  })) || [];

  if (selectedNamespace.value === undefined) {
    const hasAccessToDefault = allNamespaces.value.some((ns: any) => ns.name === 'default');

    selectedNamespace.value = hasAccessToDefault ? 'default' : allNamespaces.value[0]?.name;
  }

  const rawYaml = await resource.value.cleanForDownload(
    (await resource.value.followLink('view', { headers: { accept: 'application/yaml' } })).data
  );

  // Clone before cleaning - cleanForNew() mutates the instance it's called on, and we must
  // not mutate the live resource the user is currently viewing/editing. Mirrors the
  // model?.cleanForNew(); yaml = model?.cleanYaml(yaml, realMode); pattern in
  // ResourceDetail/index.vue used when cloning/importing a resource.
  const inStore = store.getters['currentStore'](resource.value.type);
  const clone = await store.dispatch(`${ inStore }/clone`, { resource: resource.value });

  clone.cleanForNew();
  yamlContent.value = clone.cleanYaml(rawYaml, _CLONE);

  // YamlEditor doesn't watch its `value` prop for changes after mount, so push the fetched
  // content into CodeMirror explicitly (same pattern ResourceYaml.vue/ImportDialog.vue use
  // for programmatic content updates).
  yamlEditorRef.value?.updateValue(yamlContent.value);
});

const namespaceOptions = computed(() => {
  const out = allNamespaces.value.map((obj: any) => ({ label: obj.name, value: obj.name }));

  return sortBy(out, 'label');
});

function close() {
  emit('close');
}

async function save(buttonDone: (success: boolean) => void) {
  errors.value = [];

  try {
    const cm = await store.dispatch('cluster/create', {
      type:     CONFIG_MAP,
      metadata: { name: name.value, namespace: selectedNamespace.value },
      data:     { [ResourceTemplateUtils.dataKey]: yamlContent.value },
    });

    cm.setLabel(CATTLE_UI_RESOURCE_TEMPLATE, resource.value.type);

    await cm.save();

    buttonDone(true);
    close();
  } catch (err) {
    errors.value = exceptionToErrorsArray(err);
    buttonDone(false);
  }
}
</script>

<template>
  <Card
    class="save-as-template-dialog"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ t('saveAsTemplateModal.title') }}
      </h4>
    </template>

    <template #body>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model:value="name"
            :label="t('saveAsTemplateModal.name.label')"
            required
          />
        </div>
        <div class="col span-6">
          <LabeledSelect
            v-model:value="selectedNamespace"
            :label="t('saveAsTemplateModal.namespace.label')"
            :options="namespaceOptions"
            mode="edit"
          />
        </div>
      </div>
      <div class="yaml-editor-clamp">
        <YamlEditor
          ref="yamleditor"
          v-model:value="yamlContent"
          class="yaml-editor"
          :editor-mode="editorMode"
        />
      </div>
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </template>

    <template #actions>
      <div class="dialog-actions">
        <RcButton
          variant="secondary"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <AsyncButton
          mode="saveTemplate"
          :disabled="!name || !selectedNamespace"
          @click="save"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  .save-as-template-dialog {
    margin: 0;
  }

  // Clamps the embedded YamlEditor/CodeMirror to a fixed height. CodeMirror sizes
  // itself to its content by default (app-wide, via CodeMirror.vue's own styles), so
  // without this it grows unbounded. Rather than reaching into YamlEditor's/CodeMirror's
  // own internal classes (which would need :deep() or an unscoped style block), this
  // wraps them in a plain div that's part of THIS component's own template - fully
  // reachable by scoped CSS - and lets the browser's normal overflow/clipping behavior
  // contain whatever renders inside it, regardless of its internal structure.
  .yaml-editor-clamp {
    max-height: 50vh;
    overflow-y: auto;
  }

  // Same idea for right-aligning the action buttons: rather than overriding Card's own
  // internal .card-actions class, wrap the buttons in a div that belongs to this
  // component's own template.
  .dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    width: 100%;
  }
</style>

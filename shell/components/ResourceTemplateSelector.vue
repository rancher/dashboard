<script setup lang="ts">
import {
  computed, inject, onMounted, onUnmounted, ref
} from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { RcButton } from '@components/RcButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceTemplateUtils from '@shell/utils/resource-template';

interface Props {
  resourceType: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{(e: 'apply', configMap: any): void; (e: 'save'): void }>();

const store = useStore();
const { t } = useI18n(store);

const templates = ref<any[]>([]);
const selectedTemplateId = ref<string | null>(null);

// Registered with ResourceDetail/index.vue (see its provide()), which calls this once the
// apply-a-template process it kicked off on our `apply` emit has actually finished - clearing
// the selection back to the placeholder both tidies up the control and doubles as visible
// confirmation to the user that the template really was applied.
const registerTemplateSelector = inject<(reset: (() => void) | null) => void>('registerTemplateSelector', () => {});

function reset() {
  selectedTemplateId.value = null;
}

onMounted(async() => {
  registerTemplateSelector(reset);
  templates.value = await ResourceTemplateUtils.fetchTemplates(store, props.resourceType) || [];
});

onUnmounted(() => {
  registerTemplateSelector(null);
});

const isNamespaced = computed(() => {
  const inStore = store.getters['currentStore'](props.resourceType);
  const schema = store.getters[`${ inStore }/schemaFor`](props.resourceType);

  return !!schema?.attributes?.namespaced;
});

const templateOptions = computed(() => {
  if (!isNamespaced.value) {
    return templates.value.map((cm: any) => ({
      label: `${ cm.metadata.namespace }/${ cm.metadata.name }`,
      value: cm.id,
    }));
  }

  const byNamespace: { [ns: string]: any[] } = {};

  templates.value.forEach((cm: any) => {
    const ns = cm.metadata.namespace;

    if (!byNamespace[ns]) {
      byNamespace[ns] = [];
    }

    byNamespace[ns].push(cm);
  });

  const out: any[] = [];

  Object.keys(byNamespace).sort().forEach((ns) => {
    out.push({ kind: 'group', label: ns });

    byNamespace[ns].forEach((cm: any) => {
      out.push({ label: cm.metadata.name, value: cm.id });
    });
  });

  return out;
});

function onSelect(id: string | null) {
  selectedTemplateId.value = id;

  const selectedTemplate = templates.value.find((cm: any) => cm.id === id);

  if (selectedTemplate) {
    emit('apply', selectedTemplate);
  }
}

function save() {
  emit('save');
}
</script>

<template>
  <div class="resource-template-selector">
    <LabeledSelect
      v-if="templateOptions.length"
      class="template-select"
      :value="selectedTemplateId"
      :placeholder="t('resourceTemplateSelector.label')"
      :options="templateOptions"
      mode="edit"
      @update:value="onSelect"
    />
    <RcButton
      variant="secondary"
      @click="save"
    >
      {{ t('resourceTemplateSelector.save') }}
    </RcButton>
  </div>
</template>

<style lang='scss' scoped>
  .resource-template-selector {
    display: flex;
    // The select control and RcButton aren't the same height (LabeledSelect renders taller) -
    // center them on the cross axis instead of bottom-aligning so the shorter button doesn't
    // look like it's sitting low.
    align-items: center;
    gap: 10px;
    // Masthead's `.actions-container` sets `text-align: right`, which is inherited
    // by form controls (e.g. the select's search input) - reset it back to left here.
    text-align: left;

    .template-select {
      min-width: 320px;
    }
  }
</style>

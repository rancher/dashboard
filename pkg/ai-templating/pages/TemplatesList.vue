<script setup lang="ts">
// Store getters return untyped Steve models (the engine is JS), so a few `any`s are unavoidable.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import ResourceTable from '@shell/components/ResourceTable.vue';
import { Checkbox } from '@components/Form/Checkbox';
import { NAME, NAMESPACE, AGE } from '@shell/config/table-headers';
import {
  CONFIGMAP, LABEL_MARKER, LABEL_TYPE, TYPE_HOME,
  isTemplatingEnabled, toggleTemplating, fetchTemplatingConfigMaps
} from '../templating/template-engine';

// A management list of the Home template ConfigMaps that back the configurable Home (the panel
// building blocks). Rows are REAL ConfigMap resources, so their standard row actions (Edit
// YAML/Config, Clone, Delete, Download) and the name link work with no extra code. The Enabled
// toggle is the global kill switch.
const store = useStore();
const loading = ref(true);
const toggling = ref(false);

onMounted(async() => {
  try {
    await fetchTemplatingConfigMaps(store).catch(() => {});
  } finally {
    loading.value = false;
  }
});

const enabled = computed(() => isTemplatingEnabled(store.getters));
const schema = computed(() => store.getters['management/schemaFor'](CONFIGMAP));

const rows = computed(() => {
  if (!schema.value) {
    return [];
  }

  // Live store list (not a snapshot) so the table stays in sync as ConfigMaps change. Show only the
  // Home template ConfigMaps (not the config/home singletons).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return store.getters['management/all'](CONFIGMAP).filter((cm: any) => {
    const labels = cm.metadata?.labels || {};

    return labels[LABEL_MARKER] === 'true' && labels[LABEL_TYPE] === TYPE_HOME;
  });
});

const headers = [NAME, NAMESPACE, AGE];

async function onToggle(value: boolean) {
  if (toggling.value) {
    return;
  }
  toggling.value = true;

  try {
    const now = await toggleTemplating(store, value);

    store.dispatch('growl/success', {
      title:   'AI Templating',
      message: now ? 'Templating enabled — the custom Home is active.' : 'Templating disabled — Rancher ignores all templates and behaves like stock.',
    }, { root: true });
  } catch (e: any) {
    store.dispatch('growl/error', { title: 'Could not change templating', message: e?.message || String(e) }, { root: true });
  } finally {
    toggling.value = false;
  }
}
</script>

<template>
  <div class="templates-list">
    <h1 class="mb-10">
      Home Templates
    </h1>
    <p class="text-muted mb-20">
      The <code>{{ LABEL_TYPE }}={{ TYPE_HOME }}</code> ConfigMaps that define the panel building
      blocks for the configurable Home. Use a row's actions to edit its YAML — the Home updates live
      as you create, edit, or delete them. Author them visually in the <b>Home</b> editor.
    </p>

    <div
      class="templating-switch mb-20"
      :class="{ 'templating-switch--off': !enabled }"
    >
      <Checkbox
        :value="enabled"
        :disabled="toggling"
        label="Custom Home templating enabled"
        data-testid="ai-templating-enabled-toggle"
        @update:value="onToggle"
      />
      <p class="text-muted mt-5 mb-0">
        When off, Rancher ignores every template and behaves exactly like stock Rancher. This page
        stays available so you can turn it back on. Shortcut: <code>⌘/Ctrl + Shift + .</code>
      </p>
    </div>

    <ResourceTable
      v-if="schema"
      :schema="schema"
      :rows="rows"
      :headers="headers"
      :loading="loading"
      :namespaced="true"
      data-testid="ai-templating-templates-table"
    />
    <div
      v-else
      class="text-error"
    >
      You don't have permission to list ConfigMaps.
    </div>
  </div>
</template>

<style lang="scss" scoped>
.templates-list {
  padding: 16px;

  code {
    padding: 1px 4px;
  }

  .templating-switch {
    border:        1px solid var(--border);
    border-radius: var(--border-radius);
    padding:       12px 16px;
    background:    var(--box-bg);
    max-width:     720px;

    &--off {
      border-color: var(--warning);
    }
  }
}
</style>

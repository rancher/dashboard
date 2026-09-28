<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { Checkbox } from '@components/Form/Checkbox';
import { isTemplatingEnabled, toggleTemplating, fetchTemplatingConfigMaps } from '../templating/template-engine';

// Configurable Views settings — the global kill switch for the custom Home. Always reachable (even
// when off) so the feature can be turned back on.

const store = useStore();

const toggling = ref(false);

const enabled = computed(() => isTemplatingEnabled(store.getters));

onMounted(() => fetchTemplatingConfigMaps(store));

async function onToggle(value: boolean): Promise<void> {
  if (toggling.value) {
    return;
  }
  toggling.value = true;

  try {
    const now = await toggleTemplating(store, value);

    store.dispatch('growl/success', {
      title:   'Configurable Views',
      message: now ? 'The configurable Home is on.' : 'The configurable Home is off — showing the stock Home.',
    }, { root: true });
  } catch (e) {
    store.dispatch('growl/error', {
      title:   'Could not change the setting',
      message: (e as Error)?.message || String(e),
    }, { root: true });
  } finally {
    toggling.value = false;
  }
}
</script>

<template>
  <div class="configurable-views-settings">
    <h1 class="mb-10">
      Configurable Views
    </h1>
    <p class="text-muted mb-20">
      The configurable Home is stored as labeled <code>ConfigMap</code>s and authored in the
      <b>Home</b> editor.
    </p>

    <div
      class="templating-switch"
      :class="{ 'templating-switch--off': !enabled }"
    >
      <Checkbox
        :value="enabled"
        :disabled="toggling"
        label="Configurable Home enabled"
        @update:value="onToggle"
      />
      <p class="text-muted mt-5 mb-0">
        When off, Rancher ignores every Home template and behaves like stock Rancher. This page stays
        available so you can turn it back on.
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.templating-switch {
  border:        1px solid var(--border);
  border-radius: var(--border-radius);
  padding:       12px 16px;
  background:    var(--box-bg);
  max-width:     640px;

  &--off {
    border-color: var(--warning);
  }

  code {
    padding: 1px 4px;
  }
}
</style>

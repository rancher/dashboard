<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import { Checkbox } from '@components/Form/Checkbox';
import { isTemplatingEnabled, toggleTemplating, fetchTemplatingConfigMaps } from '../templating/template-engine';

// Configurable Views settings — the global kill switch for the configurable pages. Always reachable
// (even when off) so the feature can be turned back on.

const store = useStore();
const { t } = useI18n(store);

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
      title:   t('configurableViews.toggle.title'),
      message: now ? t('configurableViews.toggle.turnedOn') : t('configurableViews.toggle.turnedOff'),
    }, { root: true });
  } catch (e) {
    store.dispatch('growl/error', {
      title:   t('configurableViews.toggle.failed'),
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
      {{ t('configurableViews.toggle.title') }}
    </h1>
    <p class="text-muted mb-20">
      {{ t('configurableViews.settings.intro') }}
    </p>

    <div
      class="templating-switch"
      :class="{ 'templating-switch--off': !enabled }"
    >
      <Checkbox
        :value="enabled"
        :disabled="toggling"
        :label="t('configurableViews.settings.enabled')"
        @update:value="onToggle"
      />
      <p class="text-muted mt-5 mb-0">
        {{ t('configurableViews.settings.enabledHint') }}
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

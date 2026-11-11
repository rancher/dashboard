<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import Drawer from '@shell/components/Drawer/Chrome.vue';
import Loading from '@shell/components/Loading.vue';

/**
 * Stands in for the resource detail drawer while its chunk loads, so the panel slides in with a
 * title, a close button and a loading state instead of being empty.
 *
 * Also used as the async wrapper's error component. The async wrapper passes no props other than
 * `error`, so the resource is read back from the panel it was opened with.
 */
const props = defineProps<{ error?: unknown }>();

const store = useStore();
const i18n = useI18n(store);

const resource = computed(() => store.getters['slideInPanel/componentProps']?.resource);

const title = computed(() => {
  if (!resource.value) {
    return i18n.t('component.drawer.resourceDetailDrawer.loading');
  }

  const resourceType = store.getters['type-map/labelFor']({ id: resource.value.type });

  return i18n.t('component.drawer.resourceDetailDrawer.title', { resourceType, resourceName: resource.value.nameDisplay });
});

function close() {
  store.commit('slideInPanel/close');
}

onMounted(() => {
  // The drawer could not be loaded at all - there is nothing to show in the panel, so report it
  // the way every other failure is reported and close
  if (props.error) {
    store.dispatch('growl/fromError', {
      title: i18n.t('component.drawer.resourceDetailDrawer.loadFailed'),
      err:   props.error,
    }, { root: true });

    close();
  }
});
</script>
<template>
  <Drawer
    v-if="!props.error"
    :ariaTarget="title"
    @close="close"
  >
    <template #title>
      {{ title }}
    </template>
    <template #body>
      <Loading mode="relative" />
    </template>
  </Drawer>
</template>

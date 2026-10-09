<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Banner } from '@components/Banner';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { ResourceModel } from '@shell/core/types';
import { keyForResource } from '@shell/utils/resource-key';
import { ResourceManagement, findManager, managementOf } from '@shell/utils/related-resources/management';

const props = defineProps<{
  /** The resource shown in the editor */
  resource: ResourceModel,

  /** The resource is shown read-only, so only a controller is named, as the reason it is read-only */
  readOnly?: boolean,

  /** The resource being edited, which is named without a link, as it is already open */
  primaryResource?: ResourceModel,
}>();

const MESSAGE_KEYS: Record<ResourceManagement['by'], string> = {
  controller: 'resourceYaml.management.controller',
  rancher:    'resourceYaml.management.rancher',
  fleet:      'resourceYaml.management.fleet',
  helm:       'resourceYaml.management.helm',
};

const management = computed<ResourceManagement | null>(() => {
  const found = managementOf(props.resource);

  return props.readOnly && found?.by !== 'controller' ? null : found;
});

const messageKey = computed(() => {
  const found = management.value;

  if (found?.by === 'controller' && props.readOnly) {
    return 'resourceYaml.management.controllerReadOnly';
  }

  if (found?.by === 'helm' && found.record) {
    return 'resourceYaml.management.helmRecord';
  }

  return found ? MESSAGE_KEYS[found.by] : '';
});

const managerLabel = computed(() => {
  const found = management.value;

  if (!found) {
    return '';
  }

  return 'owner' in found ? `${ found.owner.kind } ${ found.owner.name }` : `${ found.release.namespace }/${ found.release.name }`;
});

// the resource the label links to, fetched once the banner is shown
const manager = ref<ResourceModel | null>(null);

watch(management, async(found) => {
  manager.value = null;

  if (!found) {
    return;
  }

  // without the manager the label is shown unlinked
  const fetched = await findManager(props.resource, found).catch(() => null);

  // a later change of resource has started another fetch
  if (management.value === found) {
    manager.value = fetched;
  }
}, { immediate: true });

const managerLocation = computed(() => {
  const isPrimary = !!manager.value && !!props.primaryResource && keyForResource(manager.value) === keyForResource(props.primaryResource);

  return isPrimary ? null : manager.value?.detailLocation || null;
});
</script>

<template>
  <Banner
    v-if="management"
    :color="readOnly ? 'info' : 'warning'"
    data-testid="multi-yaml-management-banner"
  >
    <RichTranslation :k="messageKey">
      <template #manager>
        <!-- a new tab, as leaving the page loses the edits in the editor -->
        <router-link
          v-if="managerLocation"
          :to="managerLocation"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="multi-yaml-management-link"
        >
          {{ managerLabel }}
        </router-link>
        <span v-else>{{ managerLabel }}</span>
      </template>
    </RichTranslation>
  </Banner>
</template>

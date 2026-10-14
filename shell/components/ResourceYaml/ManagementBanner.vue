<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Banner } from '@components/Banner';
import RichTranslation from '@shell/components/RichTranslation.vue';
import { ResourceModel } from '@shell/core/types';
import { keyForResource } from '@shell/utils/related-resources/resource-key';
import { ResourceManagement, findManager, managementOf } from '@shell/utils/related-resources/management';

const props = defineProps<{

  resource: ResourceModel,


  readOnly?: boolean,

  // track the primary resource and avoid showing a link to it
  primaryResource?: ResourceModel,

  /** some model or extension has flagged that the controller banner does not apply - see `RelatedResource.ignoreController` */
  ignoreController?: boolean,
}>();

const MESSAGE_KEYS: Record<ResourceManagement['by'], string> = {
  controller: 'resourceYaml.management.controller',
  rancher:    'resourceYaml.management.rancher',
  fleet:      'resourceYaml.management.fleet',
  helm:       'resourceYaml.management.helm',
};

const management = computed<ResourceManagement | null>(() => {
  const found = managementOf(props.resource, { ignoreController: props.ignoreController });

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

// the resource the banner should link to, unless the related resource is the primary resource
const manager = ref<ResourceModel | null>(null);

watch(management, async(found) => {
  manager.value = null;

  if (!found) {
    return;
  }


  const fetched = await findManager(props.resource, found).catch(() => null);

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

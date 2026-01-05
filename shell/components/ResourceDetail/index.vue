<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent } from 'vue';

import { MODE, _VIEW } from '@shell/config/query-params';
import Legacy from '@shell/components/ResourceDetail/legacy.vue';
import Loading from '@shell/components/Loading.vue';
import { useIsNewDetailPageEnabled } from '@shell/composables/useIsNewDetailPageEnabled';
import { VIRTUAL_TYPES } from '@shell/config/types';
import { useResourceDetailPageProvider } from '@shell/composables/resourceDetail';

export interface Props {
  flexContent?: boolean;
  componentTestId?: string;
  storeOverride?: string;
  resourceOverride?: string;
  parentRouteOverride?: string;
  errorsMap?: any;
}

// Ideally I'd prefer to have separate routes/pages for each of these but our app makes a
// fair amount of assumptions around having one detail page for each resource and that the
// detail, config, edit, yaml, create pages are all derived from the same page.
//
// I could also dynamically check for and import these pages but I wanted this to be easier
// to be explicit and easier to search for.
const resourceToPage: any = {
  // 'apps.daemonset':   defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.daemonset.vue')),
  // 'apps.deployment':  defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.deployment.vue')),
  // 'apps.statefulset': defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.statefulset.vue')),
  // 'batch.cronjob':    defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/batch.cronjob.vue')),
  // 'batch.job':        defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/batch.job.vue')),
  configmap:                       defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/configmap.vue')),
  // namespace:           defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/namespace.vue')),
  // node:                defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/node.vue')),
  // pod:                 defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/pod.vue')),
  secret:                          defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/secret.vue')),
  [VIRTUAL_TYPES.PROJECT_SECRETS]: defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/projectsecret.vue')),
};

defineOptions({ inheritAttrs: false });

const route = useRoute();
const props = withDefaults(defineProps<Props>(), {
  flexContent:         false,
  componentTestId:     'resource-details',
  storeOverride:       undefined,
  resourceOverride:    undefined,
  parentRouteOverride: undefined,
  errorsMap:           undefined
});

const currentResourceName = computed(() => {
  const resource = props.resourceOverride || route?.params?.resource;

  if (!resource) {
    return;
  }

  if (typeof resource === 'string') {
    return resource;
  }

  // This should never occur, just satisfying the types
  return resource[0];
});
const mode = computed(() => route?.query?.[MODE]);
const isView = computed(() => route?.params?.id && (!mode.value || mode.value === _VIEW));
// We're defaulting to legacy being on, we'll switch this once we want to enable the new detail page by default
const iseNewDetailPageEnabled = useIsNewDetailPageEnabled();
const page = computed(() => currentResourceName.value ? resourceToPage[currentResourceName.value] : undefined);
const useLatest = computed(() => !!(iseNewDetailPageEnabled.value && isView.value && page.value));

if (isView.value) {
  useResourceDetailPageProvider();
}
</script>

<template>
  <Suspense v-if="useLatest">
    <template #default>
      <component :is="page" />
    </template>
    <template #fallback>
      <Loading />
    </template>
  </Suspense>
  <Legacy
    v-else
    v-bind="{...$attrs, ...props}"
  />
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { computed, defineAsyncComponent } from 'vue';

import { MODE, _VIEW, LEGACY } from '@shell/config/query-params';
import Legacy from '@shell/components/ResourceDetail/legacy.vue';
import Loading from '@shell/components/Loading.vue';

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
  // 'apps.daemonset':    defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.daemonset.vue')),
  // 'apps.deployment':   defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.deployment.vue')),
  // 'apps.statefulset':  defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/apps.statefulset.vue')),
  // 'batch.cronjob':     defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/batch.cronjob.vue')),
  // 'batch.job':         defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/batch.job.vue')),
  // 'cluster-dashboard': defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/cluster-dashboard.vue')),
  configmap: defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/configmap.vue')),
  // namespace:           defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/namespace.vue')),
  // node:                defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/node.vue')),
  // pod:                 defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/pod.vue')),
  // secret:              defineAsyncComponent(() => import('@shell/pages/explorer/resource/detail/secret.vue')),
};

const route = useRoute();
const props = withDefaults(defineProps<Props>(), {
  flexContent:         false,
  componentTestId:     'resource-details',
  storeOverride:       undefined,
  resourceOverride:    undefined,
  parentRouteOverride: undefined,
  errorsMap:           undefined
});

const currentResourceName = computed<string>(() => route.params.resource as string);
const mode = computed(() => route.query[MODE]);
const isView = computed(() => !mode.value || mode.value === _VIEW);
// We're defaulting to legacy being on, we'll switch this once we want to enable the new detail page by default
const isLegacy = computed(() => route.query[LEGACY] !== 'false');
const page = computed(() => resourceToPage[currentResourceName.value]);

const useLatest = computed(() => !!(!isLegacy.value && isView.value && page.value));
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
    v-bind="props"
  />
</template>

<script lang="ts">
import { _VIEW, _YAML } from '@shell/config/query-params';
import Latest from '@shell/components/ResourceDetail/Masthead/latest.vue';
import Legacy from '@shell/components/ResourceDetail/Masthead/legacy.vue';
import { useIsNewDetailPageEnabled } from '@shell/composables/useIsNewDetailPageEnabled';
import { computed } from 'vue';

export interface Props {
  value?: Object;
  mode?: string;
  realMode?: string;
  as?: string;
  hasGraph?: boolean;
  hasDetail?: boolean;
  hasEdit?: boolean;
  storeOverride?: string;
  resource?: string;
  resourceSubtype?: string;
  parentRouteOverride?: string;
  canViewYaml?: boolean;
}

</script>
<script lang="ts" setup>

const props = withDefaults(defineProps<Props>(), {
  value:               () => ({}),
  mode:                'create',
  realMode:            'create',
  as:                  _YAML,
  hasGraph:            false,
  hasDetail:           false,
  hasEdit:             false,
  storeOverride:       undefined,
  resource:            undefined,
  resourceSubtype:     undefined,
  parentRouteOverride: undefined,
  canViewYaml:         false
});

const isNewDetailPageEnabled = useIsNewDetailPageEnabled();
const isView = computed(() => props.mode === _VIEW);
const showLatestMasthead = computed(() => isNewDetailPageEnabled.value && isView.value );
</script>

<template>
  <Latest
    v-if="showLatestMasthead"
    :value="props.value"
    :resourceSubtype="props.resourceSubtype"
    :isCustomDetailOrEdit="props.hasDetail || props.hasEdit"
  />
  <Legacy
    v-else
    v-bind="props"
  >
    <slot name="default" />
  </Legacy>
</template>

<style lang="scss" scoped>
.new.state-banner {
  margin: 0;
  margin-top: 16px;
}
</style>

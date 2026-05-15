<script setup lang="ts">
import LabeledSelect from '@shell/components/form/LabeledSelect.vue';
import { _CREATE } from '@shell/config/query-params';

defineOptions({ name: 'PoolsSharedSection' });
interface Props {
  value: any;
  mode: string;
}
const {
  mode = _CREATE,
  value = {}
} = defineProps<Props>();

</script>

<template>
  <div class="mb-20 row span-4">
    <LabeledSelect
      v-model:value="value.region"
      :mode="mode"
      :options="[]"
      required
      :label="t('capa.poolsSharedSection.region.label')"
      :placeholder="t('capa.poolsSharedSection.region.placeholder')"
    />
  </div>
</template>

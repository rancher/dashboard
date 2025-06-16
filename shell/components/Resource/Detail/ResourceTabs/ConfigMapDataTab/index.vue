<script lang="ts">
import { useStore } from 'vuex';
import Tab from '@shell/components/Tabbed/Tab.vue';
import { useI18n } from '@shell/composables/useI18n';

import DetailText from '@shell/components/DetailText.vue';

export interface Row {
  key: string;
  value: any;
  binary: boolean;
}

export interface Props {
  rows: any;
  weight?: number;
}
</script>

<script lang="ts" setup>
const { weight, rows } = defineProps<Props>();

const store = useStore();
const i18n = useI18n(store);
</script>

<template>
  <Tab
    name="data"
    label-key="secret.data"
    :weight="weight"
  >
    <div
      v-for="(row,idx) in rows"
      :key="idx"
      class="mb-20"
    >
      <DetailText
        :value="row.value"
        :label="row.key"
        :binary="row.binary"
      />
    </div>
    <div v-if="!rows.length">
      <div class="m-20 text-center">
        {{ i18n.t('sortableTable.noRows') }}
      </div>
    </div>
  </Tab>
</template>

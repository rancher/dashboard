<script lang="ts">
import DetailText from '@shell/components/DetailText.vue';
import { useI18n } from '@shell/composables/useI18n';
import { useStore } from 'vuex';

export interface Row {
    key: string;
    value: string;
}

export interface Props {
    rows: Row[];
}
</script>

<script setup lang="ts">

const store = useStore();
const i18n = useI18n(store);

const props = defineProps<Props>();
</script>
<template>
  <div class="secret-data-tab-basic">
    <div
      v-for="(row, idx) in props.rows"
      :key="idx"
      class="entry"
    >
      <DetailText
        :value="row.value"
        :label="row.key"
        :conceal="true"
        :conceal-stand-alone="true"
      />
    </div>
    <div v-if="!rows.length">
      <div
        class="m-20 text-center no-rows"
      >
        {{ i18n.t('sortableTable.noRows') }}
      </div>
    </div>
  </div>
</template>

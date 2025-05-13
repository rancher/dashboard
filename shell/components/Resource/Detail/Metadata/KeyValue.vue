<script lang="ts">
import { computed, ref, withDefaults } from 'vue';
import { pluralize } from '@shell/utils/string';
import Rectangle from '@shell/components/Resource/Detail/Metadata/Rectangle.vue';

export type KeyValueType = {[key: string]: string};

export interface Row {
    key: string;
    value: string;
}

export interface KeyValueProps {
    propertyName: string;
    rows: Row[];
    maxRows: number;
    outline?: boolean;
}
</script>

<script setup lang="ts">
const {
  propertyName, rows, maxRows, outline
} = withDefaults(
  defineProps<KeyValueProps>(),
  { outline: false }
);

const partialRowsLength = computed(() => Math.min(maxRows, rows.length));
const partialRows = computed(() => rows.slice(0, partialRowsLength.value));

const showToggleButton = computed(() => rows.length > maxRows);
const showAll = ref<boolean>(false);
const showAllLabel = computed(() => `Show all ${ pluralize(propertyName).toLowerCase() }`);
const hideExtraLabel = computed(() => `Hide extra ${ pluralize(propertyName).toLowerCase() }`);

const visibleRows = ref<Row[]>(partialRows.value);
const toggleVisibility = () => {
  showAll.value = !showAll.value;
  visibleRows.value = showAll.value ? rows : partialRows.value;
};

</script>

<template>
  <div class="key-value">
    <div class="heading">
      <span class="title text-muted">{{ propertyName }}</span>
      <span class="count">{{ rows.length }}</span>
    </div>
    <div
      v-for="row in visibleRows"
      :key="`${row.key}:${row.value}`"
      class="row"
    >
      <Rectangle :outline="outline">
        {{ row.key }} : {{ row.value }}
      </Rectangle>
    </div>
    <a
      v-if="showToggleButton"
      href="#"
      class="show-all"
      @click="toggleVisibility"
    >{{ showAll ? hideExtraLabel : showAllLabel }}</a>
  </div>
</template>

<style lang="scss" scoped>
.key-value {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    .count {
        margin-left: 24px;
    }

    .heading {
        margin-bottom: 4px;
    }

    .row {
        &:not(:first-of-type) {
            margin-top: 4px;
        }

        & {
            margin-top: 8px;
        }
    }

    .show-all {
        margin-top: 8px;
    }
}
</style>

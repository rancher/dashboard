<script>
import ResourceTable from '@shell/components/ResourceTable';

export default {
  components: { ResourceTable },
  props:      {
    title: {
      type:     String,
      required: true
    },
    createLocation: {
      type:    Object,
      default: null
    },
    headers: {
      type:     Array,
      required: true
    },
    rows: {
      type:     Array,
      required: true
    },
    keyField: {
      type:    String,
      default: '_key'
    },
  },
};
</script>

<template>
  <div class="resource-list">
    <header class="mb-20">
      <div class="title">
        <h1 class="mt-5">
          {{ title }}
          <i
            data-v-658e6cb4=""
            data-v-70bd713f=""
            tabindex="0"
            aria-checked="true"
            aria-role="button"
            class="favorite icon icon-star"
          />
        </h1>
      </div>
      <div class="actions">
        <n-link
          data-v-70bd713f=""
          :to="'/dashboard/c/local/explorer/configmap/create'"
          class="btn role-primary"
          data-testid="masthead-create"
        >
          {{ t('resourceList.head.create') }}
        </n-link>
      </div>
    </header>
    <ResourceTable
      :rows="rows"
      :headers="headers"
      :key-field="keyField"
      :namespaced="true"
      :table-actions="true"
    />
  </div>
</template>

<style lang="scss" scoped>
.resource-list {
    header {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;

        i {
            font-size: 20px;
        }
    }
}
</style>

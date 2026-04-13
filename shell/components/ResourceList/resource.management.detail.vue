<template>
  <ResourceDetail
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template #detail>
      <slot name="detail" />
    </template>

    <template #detail-top>
      <slot name="detail-top" />
    </template>


    <template #aside-footer>
      <slot name="aside-footer">
        <div class="aside-footer">
          <slot name="aside-footer" />
        </div>
      </slot>
    </template>

    <template #related">
      <slot name="related" />
    </template>
  </ResourceDetail>
</template>

<script lang="ts">nimport ResourceDetail from '@shell/components/ResourceDetail/index.vue';

export default {
  name: 'ResourceManagementDetail',
  components: {
    ResourceDetail,
  },
  inheritAttrs: false,
};
</script>

<script>
export default {
  props: {
    columns: {
      type:    Array,
      default: () => []
    }
  }
};
</script>

<template>
  <div class="detail-top">
    <div v-for="col in columns" :key="col.title">
      <span>{{ col.title }}: </span>
      <slot :name="col.name">
        <span>{{ col.content || col.content===0 ? col.content : col.fallback || 'n/a' }}</span>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.detail-top {
    display: flex;
    flex-wrap: wrap;
    border-top: solid thin var(--border);
    border-bottom: solid thin var(--border);
    padding: 15px 0;

    & > * {
        padding: 0 10px;
        & >:first-child {
            color: var(--input-placeholder);
        }

        &:last-child {
            padding-right: 0;
        }
    }
}
</style>

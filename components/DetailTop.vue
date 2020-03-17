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
      <span>{{ col.title }}</span>
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
    background: var(--box-bg);
    border: solid thin var(--border);
    border-radius: var(--border-radius);

    & > * {
        padding: 0 10px;
        margin: 15px 0;
        display: flex;
        flex-direction: column;
        justify-content: center;

        & >:first-child {
            padding-bottom: 5px;
            color: var(--input-placeholder);

        }

        &:not(:last-child) {
            border-right: 1px solid var(--border);
        }

        &:last-child {
            padding-right: 0;
        }
    }
}
</style>

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
    position:relative;
    right: 50px;
    & > * {
        padding: 10px 50px;
        display: flex;
        flex-direction: column;
        justify-content: center;

        & >:first-child {
            padding-bottom: 5px;
        }

        &:not(:last-child) {
            border-right: 2px solid var(--border);
        }

        &:last-child {
            padding-right: 0;
        }

        & >:not(:first-child) {
            color: var(--input-label);
        }
    }
}
</style>

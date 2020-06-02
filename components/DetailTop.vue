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
      <label>{{ col.title+': ' }}</label>
      <slot :name="col.name">
        <span>{{ col.content || col.content===0 ? col.content : col.fallback || 'n/a' }}</span>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $sm-screen-grid: 1fr;
  $md-screen-grid: 1fr 1fr;
  $default-screen-grid: 1fr 1fr 1fr 1fr 1fr;

  .detail-top {
    display: grid;
    grid-template-columns: $default-screen-grid;
    border-top: solid thin var(--border);
    border-bottom: solid thin var(--border);
    padding: 15px 0;

    & > * {
      display: flex;
      align-items: center;
      padding: 0 10px;

      & > label {
        color: var(--input-placeholder);
        display: flex;
        padding-right: 5px;
      }

      & > :not(label) {
        display: flex;
        flex: 1;
      }

      & :last-child {
        padding-right: 0;
      }
    }
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-4')) {
    .detail-top {
      grid-template-columns: $sm-screen-grid;
    }
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-7')) {
    .detail-top {
      grid-template-columns: $md-screen-grid;
    }
  }

  @media only screen and (min-width: map-get($breakpoints, '--viewport-9')) {
    .detail-top {
      grid-template-columns: $default-screen-grid;
    }
  }

</style>

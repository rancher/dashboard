<script>
export default {
  props: {
    title: {
      type:    String,
      default: null,
    },

    closeable: {
      type:    Boolean,
      default: false
    }
  },
};
</script>

<template>
  <div class="simple-box" v-on="$listeners">
    <div class="top">
      <h2 v-if="title">
        {{ title }}
      </h2>
      <button v-if="closeable" class="role-link" @click="$emit('close', $event)">
        <i class="icon icon-x icon-lg text-primary" />
      </button>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss">
.simple-box {
  $padding: 15px;

  border-radius: 6px;
  background: var(--simple-box-bg) 0% 0% no-repeat padding-box;
  box-shadow: 0px 0px 10px var(--simple-box-shadow);
  border: 1px solid var(--simple-box-border);
  padding: $padding;

  .top {
    line-height: 24px;
    font-size: 18px;
    border-bottom: 1px solid var(--simple-box-divider);
    padding-bottom: $padding;
    display: flex;
    justify-content: space-between;
    & BUTTON {
      padding:0;
      height: fit-content;
    }
  }

  .content {
    padding: $padding;
  }

  .sortable-table {
    border: solid thin var(--border);
    box-shadow: none;
  }
}
</style>

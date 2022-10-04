<script>
import Closeable from '@shell/mixins/closeable';

export default {
  name: 'SimpleBox',

  mixins: [Closeable],

  props: {
    title: {
      type:    String,
      default: null,
    },

    canClose: {
      type:    Boolean,
      default: false
    }
  },

  methods: {
    closeBox(event) {
      this.hide();
      this.$emit('close', event);
    }
  }
};
</script>

<template>
  <div v-if="shown" class="simple-box" v-on="$listeners">
    <div v-if="title || canClose || $slots.title" class="top">
      <slot name="title">
        <h2 v-if="title">
          {{ title }}
        </h2>
      </slot>
      <div v-if="canClose || pref" class="close-button" @click="closeBox($event)">
        <i class="icon icon-close" />
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.top {
  display: flex;
  position: relative;
  > h2 {
    flex: 1;
  }
}
.close-button {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  > i {
    font-size: 20px;
    opacity: 0.5;
  }
  &:hover {
    background-color: var(--wm-closer-hover-bg);
  }
}
</style>
<style lang="scss">
.simple-box {
  $padding: 15px;

  background: var(--simple-box-bg) 0% 0% no-repeat padding-box;
  box-shadow: 0px 0px 10px var(--simple-box-shadow);
  border: 1px solid var(--simple-box-border);
  padding: $padding;

  .top {
    line-height: 24px;
    font-size: 18px;
    border-bottom: 1px solid var(--simple-box-divider);
    padding-bottom: $padding;
    margin: 0 -15px 10px -15px;
    padding: 0 15px 15px 15px;
    align-items: center;
    display: flex

    & BUTTON {
      padding: 0;
      height: fit-content;
      align-self: flex-start;
    }

    & H2{
      margin-bottom: 0;
    }
  }

  .content {
    padding: $padding;
  }
}
</style>

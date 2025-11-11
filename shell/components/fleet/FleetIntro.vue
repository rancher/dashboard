<script>
import { NAME } from '@shell/config/product/fleet';

export default {

  name: 'FleetIntro',

  props: {
    schema: {
      type:     Object,
      required: true,
    },

    route: {
      type:    Object,
      default: null,
    },

    isCreatable: {
      type:    Boolean,
      default: false,
    },

    icon: {
      type:    String,
      default: 'icon-repository'
    },

    labelKey: {
      type:     String,
      required: true,
    },
  },

  computed: {
    to() {
      return this.route || {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: this.schema?.id,
        },
      };
    },

    canCreate() {
      return this.isCreatable || this.schema?.resourceMethods?.includes('PUT');
    },
  }
};
</script>
<template>
  <div class="intro-box">
    <i
      class="icon"
      :class="icon"
    />
    <div class="title">
      {{ t(`fleet.${ labelKey }.intro.empty`) }}
    </div>
    <div
      v-if="canCreate"
      class="actions"
    >
      <router-link
        :to="to"
        class="btn role-secondary"
      >
        {{ t(`fleet.${ labelKey }.intro.add`) }}
      </router-link>
    </div>
  </div>
</template>
<style lang="scss" scoped>

  .intro-box {
    flex: 0 0 100%;
    height: calc(100vh - 246px); // 2(48 content header + 20 padding + 55 pageheader)
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .title {
    margin-bottom: 15px;
    font-size: $font-size-h2;
  }

  .icon {
    font-size: 96px;
    margin-bottom: 32px;
  }
</style>

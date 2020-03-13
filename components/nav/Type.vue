<script>
export default {
  props: {
    type: {
      type:     Object,
      required: true
    }
  },

  data() {
    return { over: false };
  },

  methods: {
    onMouseover() {
      this.over = true;
      console.log('over');
    },

    onMouseout() {
      this.over = false;
      console.log('out');
    },

    removeFavorite() {
      this.$store.commit('type-map/removeFavorite', this.type.id);
    }
  }
};
</script>

<template>
  <n-link
    :key="type.name"
    :to="type.route"
    tag="li"
    class="child"
    @onmouseover="onMouseover($event)"
    @onmouseout="onMouseout($event)"
  >
    <a>
      <span class="label" v-html="type.labelDisplay || type.label" />
      <span v-if="over" class="count">
        <i class="icon icon-trash" @click="removeFavorite" />
      </span>
      <span v-else-if="typeof type.count !== 'undefined'" class="count">
        {{ type.count }}
      </span>
    </a>
  </n-link>
</template>

<style lang="scss" scoped>
  .child {
    A {
      display: grid;
      grid-template-areas: "label count";
      grid-template-columns: auto auto;
      grid-column-gap: 5px;
      font-size: 12px;
      padding: 7px 5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .label {
      grid-area: label;
      display: block;
      overflow: hidden;
      text-overflow: ellipsis;

      ::v-deep .highlight {
        filter: invert(1);
      }

      ::v-deep .icon {
        position: relative;
        top: -2px;
      }
    }

    .count {
      grid-area: count;
      font-size: 12px;
      text-align: right;
      justify-items: center;
    }
  }
</style>

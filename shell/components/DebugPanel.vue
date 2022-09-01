<script>
export default {
  props: {
    content: {
      type:    String,
      default: ''
    }
  },

  data() {
    return { visible: false };
  },

  computed: {
    info() {
      const info = this.$store.getters['cluster/debugInfo']();

      return info;
    }
  },

  methods: {
    close() {
      this.visible = false;

      const el = document.getElementById(this.content);

      el.style.width = '';
    },

    open() {
      this.visible = true;

      const el = document.getElementById(this.content);

      el.style.width = 'calc(100% - 300px)';
    }
  }
};
</script>

<template>
  <div v-if="visible" class="debug-panel" :class="{visible: visible}">
    <div class="header">
      <div>DEBUG PANEL</div>
      <div class="close" @click="close()">
        <i class="icon icon-close" />
      </div>
    </div>

    <div class="header list">
      <div>Watches</div>
      <div>{{ info.watches.length }}</div>
    </div>

    <div v-for="(type, i) in info.watches" :key="i" class="list-item">
      {{ type }}
    </div>

    <div class="header list">
      <div>Types</div>
      <div>{{ info.types.length }}</div>
    </div>

    <table>
      <tr v-for="type in info.types" :key="type.name">
        <td class="wrap">
          {{ type.name }}
        </td>
        <td class="right">
          {{ type.count }}
        </td>
      </tr>
    </table>

    <button
      v-shortkey="{windows: ['ctrl', 'i'], mac: ['meta', 'i']}"
      class="hide"
      @shortkey="close()"
    />
  </div>

  <button
    v-else
    v-shortkey="{windows: ['ctrl', 'i'], mac: ['meta', 'i']}"
    class="hide"
    @shortkey="open()"
  />
</template>

<style lang="scss" scoped>
  TABLE {
    width: 100%;
    padding: 10px;
  }

  TD.wrap {
    word-break: break-all;
  }

  TD.right {
    text-align: right;
  }

  .list-item {
    padding: 0 10px;
    line-height: 20px;
  }

  .debug-panel {
    border-left: 1px solid var(--border);
    position: absolute;
    width: 300px;
    right: 0;
    height: 100%;

    .header {
      align-items: center;
      display: flex;
      padding: 5px 10px;

      &.list {
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        margin: 5px 0;
        padding: 5px 10px;
      }

      > :first-child {
        flex: 1;
      }

      .close {
        cursor: pointer;

        > i {
          font-size: 20px;
          width: 20x;
          height: 20px;
        }

        &:hover {
          color: var(--link);
        }
      }
    }
  }
</style>

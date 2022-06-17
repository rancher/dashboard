<script>
export default {
  name: 'NovncConsoleItem',

  props: {
    items: {
      type:     Object,
      required: true,
      default:  () => {
        return {};
      }
    },

    path: {
      type:     Array,
      required: true,
      default:  () => {
        return [];
      }
    },

    pos: {
      type:     Number,
      required: true,
      default:  0,
    }
  },

  methods: {
    keysDown(key, pos) {
      this.addKeys(key, pos);
      this.$emit('sendKeys', this.path);
    },

    addKeys(key, pos) {
      this.path.splice(pos, this.path.length - pos, key);
    },

    sendKeys() {
      this.$emit('sendKeys', this.path);
    },

    getOpenStatus(key, pos) {
      return this.path[pos] === key;
    }
  }
};
</script>

<template>
  <ul class="list-unstyled dropdown combination-keys__container">
    <li v-for="(item, key) in items" :key="key">
      <v-popover
        v-if="!!item.keys"
        placement="right-start"
        trigger="click"
        :container="false"
      >
        <span :class="{ open: getOpenStatus(key, pos) }" class="p-10 hand" @click="addKeys(key, pos)">{{ item.label }}</span>

        <template slot="popover">
          <novnc-console-item :items="item.keys" :path="path" :pos="pos+1" @sendKeys="sendKeys" />
        </template>
      </v-popover>

      <span v-else class="p-10 hand" @click="keysDown(key, pos)">{{ item.label }}</span>
    </li>
  </ul>
</template>

<style lang="scss">
  .combination-keys__container {
    max-width: 60px;

    DIV, SPAN {
      display: block;
      text-align: center;
    }

    SPAN {
      border-radius: 3px;

      &:hover, &.open {
        color: var(--primary-hover-text);
        background: var(--primary-hover-bg);
      }
    }
  }
</style>

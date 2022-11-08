<script>
import debounce from 'lodash/debounce';
import { removeAt } from '@shell/utils/array';
import { _EDIT, _VIEW } from '@shell/config/query-params';
export default {
  props: {
    value: {
      type:     Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    title: {
      type:    String,
      default: ''
    },
  },
  data() {
    const rows = this.value.map(item => ({ ...item }));

    return { rows };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    containerStyle() {
      const gap = this.canRemove ? ' 50px' : '';
      const size = 2;

      return `grid-template-columns: repeat(${ size }, 1fr)${ gap };`;
    },
    canRemove() {
      return !this.isView;
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },
  methods: {
    add() {
      this.rows.push({ name: '', replicas: 1 });
      this.queueUpdate();
      this.$nextTick(() => {
        if (this.$refs.key) {
          const keys = this.$refs.key;
          const lastKey = keys[keys.length - 1];

          lastKey.focus();
        } else {
          this.$emit('focusKey');
        }
      });
    },
    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },
    update() {
      const out = this.rows.map(item => ({ ...item }));

      this.$emit('input', out);
    },
  }
};
</script>
<template>
  <div class="key-value">
    <div class="clearfix">
      <h4>
        {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.resources.title') }}
      </h4>
    </div>
    <div class="kv-container" :style="containerStyle">
      <template v-if="rows.length || isView">
        <label class="text-label">
          {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.resources.name.label') }}
        </label>
        <label class="text-label">
          {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.resources.replicas.label') }}
        </label>
        <span v-if="canRemove" />
      </template>
      <template v-if="!rows.length && isView">
        <div class="kv-item key text-muted">
          &mdash;
        </div>
        <div class="kv-item key text-muted">
          &mdash;
        </div>
      </template>
      <template v-for="(row, i) in rows" v-else>
        <div :key="i+'key'" class="kv-item key">
          <input
            ref="key"
            v-model="row.name"
            :disabled="isView"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @input="queueUpdate"
          />
        </div>
        <div :key="i+'value'" class="kv-item value">
          <input
            v-model.number="row.replicas"
            :disabled="isView"
            type="number"
            @input="queueUpdate"
          />
        </div>
        <div
          v-if="canRemove"
          :key="i"
          class="kv-item remove"
        >
          <button type="button" :disabled="isView" class="btn role-link" @click="remove(i)">
            {{ t('generic.remove') }}
          </button>
        </div>
      </template>
    </div>
    <div v-if="!isView" class="footer">
      <button type="button" class="btn role-tertiary add" @click="add()">
        {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.resources.add') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.key-value {
  width: 100%;
  .kv-container{
    display: grid;
    align-items: center;
    column-gap: 20px;
    label {
      margin-bottom: 0;
    }
    & .kv-item {
      width: 100%;
      margin: 10px 0px 10px 0px;
      &.key, &.extra {
        align-self: flex-start;
      }
      &.value textarea{
        padding: 10px 10px 10px 10px;
      }
      .text-monospace:not(.conceal) {
        font-family: monospace, monospace;
      }
    }
  }
  .remove {
    text-align: center;
    BUTTON{
      padding: 0px;
    }
  }
  .title {
    margin-bottom: 10px;
  }
  input {
    height: 40px;
    line-height: 1;
  }
}
</style>

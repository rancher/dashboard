<script>
import debounce from 'lodash/debounce';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';

/*
  @TODO
  - Paste
  - Read from file
  - Multiline
  - Concealed value
*/

export default {
  components: { TextAreaAutoGrow },

  props: {
    value: {
      type:    Array,
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    initialEmptyRow: {
      type:    Boolean,
      default: false,
    },

    title: {
      type:    String,
      default: ''
    },
    titleAdd: {
      type:    Boolean,
      default: false,
    },
    protip: {
      type:    [String, Boolean],
      default: 'ProTip: Paste lines into any list field for easy bulk entry',
    },
    showHeader: {
      type:    Boolean,
      default: false,
    },

    padLeft: {
      type:    Boolean,
      default: false,
    },

    valueLabel: {
      type:    String,
      default: 'Value',
    },
    valuePlaceholder: {
      type:    String,
      default: 'e.g. bar'
    },
    valueMultiline: {
      type:    Boolean,
      default: true,
    },
    valueConcealed: {
      type:    Boolean,
      default: false,
    },

    addLabel: {
      type:    String,
      default: 'Add',
    },
    addIcon: {
      type:    String,
      default: 'icon-plus',
    },
    addAllowed: {
      type:    Boolean,
      default: true,
    },

    removeLabel: {
      type:    String,
      default: '',
    },
    removeIcon: {
      type:    String,
      default: 'icon-minus',
    },
    removeAllowed: {
      type:    Boolean,
      default: true,
    },
    defaultAddValue: {
      type:    [String, Number, Object, Array],
      default: ''
    },
    tableClass: {
      type:    [String, Object, Array],
      default: 'fixed zebra-table'
    }
  },

  data() {
    const input = (this.value || []).slice();
    const rows = [];

    for ( const value of input ) {
      rows.push({ value });
    }

    if ( !rows.length && this.initialEmptyRow ) {
      rows.push({ value: '' });
    }

    return { rows };
  },

  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return !this.isView && this.addAllowed;
    },

    showRead() {
      return !this.isView && this.readAllowed;
    },

    showRemove() {
      return !this.isView && this.removeAllowed;
    },
  },

  watch: {
    value() {
      this.rows = (this.value || []).map(v => ({ value: v }));
    }
  },

  created() {
    this.queueUpdate = debounce(this.update, 100);
  },

  methods: {
    add() {
      this.rows.push({ value: this.defaultAddValue });
      if (this.defaultAddValue) {
        this.queueUpdate();
      }

      this.$nextTick(() => {
        const inputs = this.$refs.value;

        if ( inputs && inputs.length > 0 ) {
          inputs[inputs.length - 1].focus();
        }
      });
    },

    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },

    update() {
      if ( this.isView ) {
        return;
      }

      const out = [];

      for ( const row of this.rows ) {
        const value = (typeof row.value === 'string') ? row.value.trim() : row.value;

        if ( typeof value !== 'undefined' ) {
          out.push(value);
        }
      }

      this.$emit('input', out);
    },

    onPaste(index, event) {
      event.preventDefault();
      const text = event.clipboardData.getData('text/plain');
      const split = text.split('\n').map(value => ({ value }));

      this.rows.splice(index, 1, ...split);
      this.update();
    }
  },
};
</script>

<template>
  <div>
    <div v-if="title" class="clearfix">
      <h4>
        {{ title }}
        <i v-if="protip" v-tooltip="protip" class="icon icon-info" />
        <button v-if="titleAdd && showAdd" type="button" class="btn btn-xs role-tertiary p-5 ml-10" style="position: relative; top: -3px;" @click="add">
          <i class="icon icon-plus icon-lg icon-fw" />
        </button>
      </h4>
    </div>

    <template v-if="rows.length">
      <div v-if="showHeader">
        <slot name="column-headers">
          <span class="value text-label">
            {{ valueLabel }}
          </span>
        </slot>
      </div>
      <div
        v-for="(row, idx) in rows"
        :key="idx"
        class="box"
      >
        <slot
          name="columns"
          :queueUpdate="queueUpdate"
          :i="idx"
          :rows="rows"
          :row="row"
          :mode="mode"
          :isView="isView"
        >
          <div class="value">
            <slot
              name="value"
              :row="row"
              :mode="mode"
              :isView="isView"
              :queue-update="queueUpdate"
            >
              <span v-if="isView">{{ row.value }}</span>
              <TextAreaAutoGrow
                v-else-if="valueMultiline"
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                @paste="onPaste(idx, $event)"
                @input="queueUpdate"
              />
              <input
                v-else
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                @paste="onPaste(idx, $event)"
                @input="queueUpdate"
              />
            </slot>
          </div>
        </slot>
        <div v-if="showRemove" class="remove">
          <slot name="remove-button" :remove="() => remove(idx)">
            <button type="button" class="btn role-link" @click="remove(idx)">
              Remove
              {{ removeLabel }}
            </button>
          </slot>
        </div>
      </div>
    </template>
    <div v-else-if="mode==='view'" class="text-muted">
      &mdash;
    </div>
    <div v-else>
      <slot name="empty" />
    </div>
    <div v-if="!titleAdd && (showAdd || showRead)" class="footer">
      <slot v-if="showAdd" name="add">
        <button type="button" class="btn role-tertiary add mt-10" @click="add()">
          {{ addLabel }}
        </button>
        <slot name="moreAdd" :rows="rows" />
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $remove: 75;

  .title {
    margin-bottom: 10px;

  }

  .box {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    .value {
      flex: 1;
      INPUT {
        height: 50px;
      }
    }
  }

  .remove {
    vertical-align: middle;
    text-align: right;
    width: #{$remove}px;
  }

  .footer {
    .protip {
      float: right;
      padding: 5px 0;
    }
  }
</style>

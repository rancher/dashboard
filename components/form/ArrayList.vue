<script>
import { debounce } from 'lodash';
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
    protip: {
      type:    [String, Boolean],
      default: 'ProTip: Paste lines of <code>key=value</code> or <code>key: value</code> into any key field for easy bulk entry',
    },

    showHeader: {
      type:    Boolean,
      default: false,
    },

    padLeft: {
      type:    Boolean,
      default: true,
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

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    add(value = '') {
      this.rows.push({ value });
      this.queueUpdate();

      this.$nextTick(() => {
        const inputs = this.$refs.value;

        inputs[inputs.length - 1].focus();
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
        const value = (row.value || '').trim();

        if ( value ) {
          out.push(value);
        }
      }

      this.$emit('input', out);
    }
  },
};
</script>

<template>
  <div>
    <div class="title clearfix">
      <h4>{{ title }} <i v-if="protip" v-tooltip="protip" class="icon icon-info" style="font-size: 12px" /></h4>
    </div>

    <table v-if="rows.length" class="fixed">
      <thead v-if="showHeader">
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="value">
            {{ valueLabel }}
          </th>
          <th v-if="showRemove" class="remove"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="idx"
        >
          <td v-if="padLeft" class="left"></td>
          <td class="value">
            <slot
              name="value"
              :row="row"
              :mode="mode"
              :isView="isView"
            >
              <span v-if="isView">{{ row.value }}</span>
              <TextAreaAutoGrow
                v-else-if="valueMultiline"
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                @input="queueUpdate"
              />
              <input
                v-else
                ref="value"
                v-model="row.value"
                :placeholder="valuePlaceholder"
                @input="queueUpdate"
              />
            </slot>
          </td>
          <td v-if="showRemove" class="remove">
            <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
              Remove
              {{ removeLabel }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showAdd || showRead" class="footer">
      <slot v-if="showAdd" name="add">
        <button type="button" class="btn role-tertiary add" @click="add()">
          <i v-if="addIcon" :class="{'icon': true, [addIcon]: true}" />
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

    .read-from-file {
      float: right;
    }
  }

  TABLE {
    width: 100%;
  }

  TH {
    text-align: left;
    font-size: 12px;
    font-weight: normal;
    color: var(--input-label);
  }

  .left {
    width: #{$remove}px;
  }

  .value {
    vertical-align: top;
  }

  .remove {
    vertical-align: middle;
    text-align: right;
    width: #{$remove}px;
  }

  .footer {
    margin-top: 10px;

    .protip {
      float: right;
      padding: 5px 0;
    }
  }
</style>

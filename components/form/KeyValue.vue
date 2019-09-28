<script>
import { debounce } from 'lodash';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';

/*
  @TODO
  - View Mode
  - Paste
  - Read from file
  - Multiline
  - Base64 value
  - Concealed value
*/

export default {
  props: {
    value: {
      type:     [Array, Object],
      default: null,
    },
    mode: {
      type:    String,
      default: _EDIT,
    },
    asMap: {
      type:    Boolean,
      default: true,
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

    padLeft: {
      type:    Boolean,
      default: true,
    },

    keyLabel: {
      type:    String,
      default: 'Key',
    },
    keyPlaceholder: {
      type:    String,
      default: 'e.g. foo'
    },

    separatorLabel: {
      type:    String,
      default: ':',
    },

    valueLabel: {
      type:    String,
      default: 'Value',
    },
    valuePlaceholder: {
      type:    String,
      default: 'e.g. bar'
    },
    valueCanBeEmpty: {
      type:    Boolean,
      default: false,
    },
    valueBinary: {
      type:    Boolean,
      default: false,
    },
    valueMultiline: {
      type:    Boolean,
      default: true,
    },
    valueBase64: {
      type:    Boolean,
      default: false,
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

    readLabel: {
      type:    String,
      default: 'Read from a file'
    },
    readIcon: {
      type:    String,
      default: 'icon-upload',
    },
    readAllowed: {
      type:    Boolean,
      default: true,
    },
    readAccept: {
      type:    String,
      default: '*',
    },
    readMultiple: {
      type:    Boolean,
      default: false,
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

    parserSeparators: {
      type:    Array,
      default: () => [': ', '='],
    },
  },

  data() {
    if ( !this.asMap ) {
      return { rows: this.value.slice() };
    }

    const input = this.value || {};
    const rows = [];

    Object.keys(input).forEach((key) => {
      rows.push({ key, value: input[key] });
    });

    if ( !rows.length && this.initialEmptyRow ) {
      rows.push({ key: '', value: '' });
    }

    return { rows };
  },

  computed: {
    isEditing() {
      return this.mode !== _VIEW;
    },

    isView() {
      return this.mode === _VIEW;
    },

    showAdd() {
      return this.isEditing && this.addAllowed;
    },

    showRead() {
      return this.isEditing && this.readAllowed;
    },

    showRemove() {
      return this.isEditing && this.removeAllowed;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    add(key = '', value = '') {
      if ( this.valueBase64 ) {
        value = base64Encode(value);
      }

      this.rows.push({ key, value });
      this.queueUpdate();

      this.$nextTick(() => {
        const inputs = this.$refs.key;

        inputs[inputs.length - 1].focus();
      });
    },

    remove(idx) {
      removeAt(this.rows, idx);
      this.queueUpdate();
    },

    readFromFile() {
      this.$refs.uploader.click();
    },

    fileChange(event) {
      const input = event.target;
      const handles = input.files;
      const names = [];

      if ( handles ) {
        for ( let i = 0 ; i < handles.length ; i++ ) {
          const reader = new FileReader();

          reader.onload = (loaded) => {
            this.add(names[i], loaded.target.result);
          };

          reader.onerror = (err) => {
            this.$dispatch('growl/fromError', { title: 'Error reading file', err }, { root: true });
          };

          names[i] = handles[i].name;
          reader.readAsText(handles[i]);
        }

        input.value = '';
      }
    },

    download(idx) {
      const row = this.rows[idx];
      const name = row.key;
      let value = row.value;

      if ( this.valueBase64 ) {
        value = base64Decode(value);
      }

      downloadFile(name, value, 'application/octet-stream');
    },

    update() {
      if ( this.isView ) {
        return;
      }

      if ( !this.asMap ) {
        this.$emit('input', this.data.slice());

        return;
      }

      const out = {};

      for ( const row of this.rows ) {
        const key = (row.key || '').trim();
        const value = (row.value || '').trim();

        if ( key && (value || this.valueCanBeEmpty) ) {
          out[key] = value;
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
      <h2>{{ title }} <i v-if="protip" v-tooltip="protip" class="icon icon-info" style="font-size: 16px" /></h2>
    </div>

    <table v-if="rows.length" class="fixed">
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="key">
            {{ keyLabel }}
          </th>
          <th class="separator"></th>
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
          <td class="key">
            <slot name="key" :row="row" :mode="mode">
              <span v-if="isView">{{ row.key }}</span>
              <input v-else ref="key" v-model="row.key" @input="queueUpdate" />
            </slot>
          </td>
          <td class="separator">
            {{ separatorLabel }}
          </td>
          <td class="value">
            <slot name="value" :row="row" :mode="mode">
              <span v-if="valueBinary">
                {{ row.value.length }} byte<span v-if="row.value.length !== 1">s</span>
                <button type="button" class="bg-link" @click="download(idx)">
                  <i class="icon icon-download text-small" />
                </button>
              </span>
              <span v-else-if="isView">{{ row.value }}</span>
              <input v-else v-model="row.value" @input="queueUpdate" />
            </slot>
          </td>
          <td v-if="showRemove" class="remove">
            <button type="button" class="btn bg-primary" @click="remove(idx)">
              <i v-if="removeIcon" :class="{'icon': true, [removeIcon]: true}" />
              {{ removeLabel }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="showAdd || showRead" class="footer">
      <button v-if="showAdd" type="button" class="btn bg-primary add" @click="add()">
        <i v-if="addIcon" :class="{'icon': true, [addIcon]: true}" />
        {{ addLabel }}
      </button>
      <button v-if="showRead" type="button" class="btn bg-primary read-from-file" @click="readFromFile">
        <i v-if="readIcon" :class="{'icon': true, [readIcon]: true}" />
        {{ readLabel }}
      </button>
    </div>

    <input
      ref="uploader"
      type="file"
      :accept="readAccept"
      :multiple="readMultiple"
      class="hide"
      @change="fileChange"
    />
  </div>
</template>

<style lang="scss" scoped>
  $separator: 20;
  $remove: 50;

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
  }

  .separator {
    width: #{$separator}px;
    text-align: center;
  }

  .left {
    width: #{$remove}px;
  }

  .remove {
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

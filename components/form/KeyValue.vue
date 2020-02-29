<script>
import { debounce } from 'lodash';
import { typeOf } from '@/utils/sort';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { asciiLike } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';
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
      default: false,
    },

    // For asMap=false, the name of the field that goes into the row objects
    keyName: {
      type:    String,
      default: 'key',
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
      default: '',
    },

    // For asMap=false, the name of the field that goes into the row objects
    valueName: {
      type:    String,
      default: 'value',
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
    // @TODO base64 and binary support for as Array (!asMap)
    if ( !this.asMap ) {
      return { rows: (this.value || []).slice() };
    }

    const input = this.value || {};
    const rows = [];

    Object.keys(input).forEach((key) => {
      let value = input[key];

      if ( this.valueBase64 ) {
        value = base64Decode(value);
      }

      const binary = !asciiLike(value);

      rows.push({
        key,
        value,
        binary
      });
    });

    if ( !rows.length && this.initialEmptyRow ) {
      rows.push({ [this.keyName]: '', [this.valueName]: '' });
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
    add(key = '', value = '', binary = false) {
      this.rows.push({
        [this.keyName]:   key,
        [this.valueName]: value,
        binary,
      });
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
    removeEmptyRows() {
      const cleaned = this.rows.filter((row) => {
        return (row.value.length || row.key.length);
      });

      this.$set(this, 'rows', cleaned);
    },
    readFromFile() {
      this.$refs.uploader.click();
    },

    fileChange(event) {
      const input = event.target;
      const handles = input.files;
      const names = [];

      this.removeEmptyRows();
      if ( handles ) {
        for ( let i = 0 ; i < handles.length ; i++ ) {
          const reader = new FileReader();

          reader.onload = (loaded) => {
            const value = loaded.target.result;

            this.add(names[i], value, !asciiLike(value));
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
      const name = row[this.keyName];
      const value = row[this.valueName];

      downloadFile(name, value, 'application/octet-stream');
    },

    update() {
      if ( this.isView ) {
        return;
      }

      if ( !this.asMap ) {
        this.$emit('input', this.rows.slice());

        return;
      }

      const out = {};
      const keyName = this.keyName;
      const valueName = this.valueName;

      for ( const row of this.rows ) {
        let value = (row[valueName] || '');
        const key = (row[keyName] || '').trim();

        if (typeOf(value) === 'object') {
          out[key] = JSON.parse(JSON.stringify(value));
        } else {
          value = value.trim();

          if ( value && this.valueBase64 ) {
            value = base64Encode(value);
          }

          if ( key && (value || this.valueCanBeEmpty) ) {
            out[key] = value;
          }
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
      <thead>
        <tr>
          <th v-if="padLeft" class="left"></th>
          <th class="key">
            <label>{{ keyLabel }}</label>
          </th>
          <th v-if="separatorLabel" class="separator"></th>
          <th class="value">
            <label>{{ valueLabel }}</label>
          </th>
          <slot name="moreColumnHeaders" />
          <th v-if="showRemove" class="remove"></th>
        </tr>
      </thead>
      <tbody>
        <template
          v-for="(row, idx) in rows"
        >
          <slot name="row" :row="row">
            <tr :key="idx">
              <td v-if="padLeft" class="left"></td>
              <td class="key">
                <slot
                  name="key"
                  :row="row"
                  :mode="mode"
                  :keyName="keyName"
                  :valueName="valueName"
                  :isView="isView"
                >
                  <span v-if="isView">{{ row[keyName] }}</span>
                  <input
                    v-else
                    ref="key"
                    v-model="row[keyName]"
                    :placeholder="keyPlaceholder"
                    type="text"
                    @input="queueUpdate"
                  />
                </slot>
              </td>
              <td v-if="separatorLabel" class="separator">
                {{ separatorLabel }}
              </td>
              <td class="value">
                <slot
                  name="value"
                  :row="row"
                  :mode="mode"
                  :keyName="keyName"
                  :valueName="valueName"
                  :isView="isView"
                  :queueUpdate="queueUpdate"
                >
                  <span v-if="valueBinary || row.binary">
                    {{ row[valueName].length }} byte<span v-if="row[valueName].length !== 1">s</span>
                    <button type="button" class="btn bg-transparent role-link" @click="download(idx)">
                      Download
                    </button>
                  </span>
                  <span v-else-if="isView">{{ row[valueName] }}</span>
                  <TextAreaAutoGrow
                    v-else-if="valueMultiline"
                    v-model="row[valueName]"
                    :placeholder="valuePlaceholder"
                    :min-height="50"
                    :spellcheck="false"
                    @input="queueUpdate"
                  />
                  <input
                    v-else
                    v-model="row[valueName]"
                    :placeholder="valuePlaceholder"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    @input="queueUpdate"
                  />
                </slot>
              </td>
              <slot name="moreColumnHeaders" />
              <td v-if="showRemove" class="remove">
                <slot name="removeButton" :remove="remove" :idx="idx" :row="row">
                  <button type="button" class="btn bg-transparent role-link" @click="remove(idx)">
                    Remove
                    {{ removeLabel }}
                  </button>
                </slot>
              </td>
            </tr>
          </slot>
        </template>
      </tbody>
    </table>
    <div v-if="showAdd || showRead" class="footer">
      <slot v-if="showAdd" name="add">
        <button type="button" class="btn role-tertiary add" @click="add()">
          {{ addLabel }}
        </button>
        <slot name="moreAdd" :rows="rows" />
      </slot>
      <button v-if="showRead" type="button" class="btn role-tertiary read-from-file" @click="readFromFile">
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
  $remove: 75;

  .title {
    margin-bottom: 10px;

    .read-from-file {
      float: right;
    }
  }

  TABLE {
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px 10px;
  }

  TH {
    text-align: left;
    font-size: 10px;
    font-weight: normal;
    color: var(--input-label);
  }

  TD {
    padding-bottom: 10px;
  }

  .left {
    width: #{$remove}px;
  }

  .key {
    vertical-align: top;

    label {
      margin-bottom: 0!important;
    }
  }

  .separator {
    width: #{$separator}px;
    vertical-align: top;
    text-align: center;
  }

  .value {
    vertical-align: middle;

    label {
      margin-bottom: 0!important;
    }

    select {
      -webkit-appearance: none;
      border-radius: 2px;
    }

    textarea::placeholder {
      padding-top: 8px;
      color: var(--input-placeholder);
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

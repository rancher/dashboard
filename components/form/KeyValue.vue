<script>
import debounce from 'lodash/debounce';
import { typeOf } from '@/utils/sort';
import { removeAt } from '@/utils/array';
import { asciiLike } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { get } from '@/utils/object';
import FileSelector from '@/components/form/FileSelector';
import { _EDIT, _VIEW } from '@/config/query-params';

export default {
  components: {
    TextAreaAutoGrow,
    FileSelector
  },

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
      default: 'Paste lines of <em>key=value</em> or <em>key: value</em> into any key field for easy bulk entry',
    },

    // For asMap=false, the name of the field that goes into the row objects
    keyName: {
      type:    String,
      default: 'key',
    },

    keyLabel: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.key');
      },
    },

    keyPlaceholder: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('keyValue.valuePlaceholder');
      },
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
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.value');
      },
    },

    valuePlaceholder: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('keyValue.valuePlaceholder');
      },
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
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.add');
      },
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
      type: String,
      default() {
        return this.$store.getters['i18n/t']('generic.readFromFile');
      },
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

    fileModifier: {
      type:    Function,
      default: (name, value) => ({ name, value })
    },
    parserSeparators: {
      type:    Array,
      default: () => [': ', '='],
    },
  },

  data() {
    // @TODO base64 and binary support for as Array (!asMap)
    if ( !this.asMap ) {
      const rows = (this.value || []).slice() ;

      rows.map((row) => {
        row.binary = !asciiLike(row[this.valueName]);
      });

      return { rows };
    }

    const input = this.value || {};
    const rows = [];

    Object.keys(input).forEach((key) => {
      let value = input[key];

      if ( this.valueBase64 ) {
        value = base64Decode(value);
      }
      rows.push({
        key,
        value,
        binary: !asciiLike(value),
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

    threeColumns() {
      return this.removeAllowed;
    },
  },

  created() {
    this.queueUpdate = debounce(this.update, 500);
  },

  methods: {
    asciiLike,
    add(key = '', value = '') {
      this.rows.push({
        [this.keyName]:   key,
        [this.valueName]: value,
        binary:           !asciiLike(value),
      });
      this.queueUpdate();
      this.$nextTick(() => {
        const keys = this.$refs.key;
        const lastKey = keys[keys.length - 1];

        lastKey.focus();
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

    onFileSelected(file) {
      const { name, value } = this.fileModifier(file.name, file.value);

      this.add(name, value, !asciiLike(value));
    },

    download(idx, ev) {
      const row = this.rows[idx];
      const name = row[this.keyName];
      const value = row[this.valueName];

      downloadFile(name, value, 'application/octet-stream');
    },

    update() {
      if ( !this.asMap ) {
        this.$emit('input', this.rows.map((row) => {
          let value = row.value;

          if ( this.base64Encode ) {
            value = base64Encode(value);
          }

          return {
            [this.keyName]:   row.key,
            [this.valueName]: value,
          };
        }));

        return;
      }

      const out = {};
      const keyName = this.keyName;
      const valueName = this.valueName;

      if (!this.rows.length) {
        this.$emit('input', out);
      }

      for ( const row of this.rows ) {
        let value = (row[valueName] || '');
        const key = (row[keyName] || '').trim();

        if (value && typeOf(value) === 'object') {
          out[key] = JSON.parse(JSON.stringify(value));
        } else {
          value = (value || '').trim();

          if ( value && this.valueBase64 ) {
            value = base64Encode(value);
          }
          if ( key && (value || this.valueCanBeEmpty) ) {
            out[key] = value;
          }
        }
        this.$emit('input', out);
      }
    },

    onPaste(index, event, pastedValue) {
      const text = event.clipboardData.getData('text/plain');
      const lines = text.split('\n');
      const splits = lines.map((line) => {
        if (line.includes(':')) {
          return line.split(':');
        }

        return line.split('=');
      });

      if (splits.length === 0 || (splits.length === 1 && splits[0].length < 2)) {
        return;
      }
      event.preventDefault();

      const keyValues = splits.map(split => ({
        [this.keyName]:   (split[0] || '').trim(),
        [this.valueName]: (split[1] || '').trim(),
        binary:           !asciiLike(split[1])
      }));

      this.rows.splice(index, 1, ...keyValues);
      this.queueUpdate();
    },

    get,

  }
};
</script>

<template>
  <div class="key-value">
    <div v-if="title" class="clearfix">
      <slot name="title">
        <h3>
          {{ title }}
        </h3>
      </slot>
    </div>

    <div class="kv-container" :class="{'extra-column':threeColumns}">
      <template v-if="rows.length">
        <label class="text-label">
          {{ keyLabel }}
          <i v-if="protip" v-tooltip="protip" class="icon icon-info" />
        </label>
        <label class="text-label">
          {{ valueLabel }}
        </label>
        <span v-if="threeColumns" />
      </template>

      <template v-for="(row,i) in rows">
        <div :key="i+'key'" class="kv-item key">
          <slot
            name="key"
            :row="row"
            :mode="mode"
            :keyName="keyName"
            :valueName="valueName"
          >
            <input
              ref="key"
              v-model="row[keyName]"
              :disabled="isView"
              :placeholder="keyPlaceholder"
              @input="queueUpdate"
              @paste="onPaste(i, $event)"
            />
          </slot>
        </div>

        <div :key="i+'value'" class="kv-item value">
          <slot
            name="value"
            :row="row"
            :mode="mode"
            :keyName="keyName"
            :valueName="valueName"
            :queueUpdate="queueUpdate"
          >
            <div v-if="row.binary">
              {{ t('detailText.binary', {n: row.value.length || 0}, true) }}
            </div>
            <TextAreaAutoGrow
              v-else-if="valueMultiline"
              v-model="row[valueName]"
              :class="{'conceal': valueConcealed}"
              :mode="mode"
              :placeholder="valuePlaceholder"
              :min-height="54"
              :spellcheck="false"
              @input="queueUpdate"
            />
            <input
              v-else
              v-model="row[valueName]"
              :disabled="isView"
              :type="valueConcealed ? 'password' : 'text'"
              :placeholder="valuePlaceholder"
              autocorrect="off"
              autocapitalize="off"
              spellcheck="false"
              @input="queueUpdate"
            />
          </slot>
        </div>

        <div v-if="removeAllowed" :key="i" class="kv-item remove">
          <slot name="removeButton" :remove="remove" :row="row">
            <button type="button" :disabled="isView" class="btn bg-transparent role-link" @click="remove(i)">
              {{ removeLabel || t('generic.remove') }}
            </button>
          </slot>
        </div>
      </template>
    </div>

    <div v-if="addAllowed || readAllowed" class="footer">
      <slot name="add" :add="add">
        <button v-if="addAllowed" :disabled="isView" type="button" class="btn btn-sm role-tertiary add" @click="add()">
          {{ addLabel }}
        </button>
        <FileSelector
          v-if="readAllowed"
          :disabled="isView"
          class="btn-sm role-tertiary"
          :label="t('generic.readFromFile')"
          :include-file-name="true"
          @selected="onFileSelected"
        />
      </slot>
    </div>
  </div>
</template>

<style lang="scss">
.key-value {
  width: 100%;

  .file-selector.role-link {
    text-transform: initial;
    padding: 0;
  }

  .kv-container{
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    column-gap: 20px;

    label {
      margin-bottom: 0;
    }

    &.extra-column {
       grid-template-columns: 1fr 1fr 100px;
    }

    & .kv-item {
      width: 100%;
      margin: 10px 0px 10px 0px;
      &.key {
        align-self: flex-start;
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

    .read-from-file {
      float: right;
    }
  }

  input {
    height: $input-height;
  }

  .footer {

    .protip {
      float: right;
      padding: 5px 0;
    }
  }

  .download {
    text-align: right;
  }

  .copy-value{
    padding: 0px 0px 0px 10px;
  }

}
</style>

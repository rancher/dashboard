<script>
import debounce from 'lodash/debounce';
import { typeOf } from '@/utils/sort';
import { removeAt, removeObject } from '@/utils/array';
import { base64Encode, base64Decode, binarySize } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import { get } from '@/utils/object';
import Select from '@/components/form/Select';
import FileSelector from '@/components/form/FileSelector';
import { _EDIT, _VIEW } from '@/config/query-params';
import { asciiLike } from '@/utils/string';

export default {
  components: {
    Select,
    TextAreaAutoGrow,
    FileSelector
  },
  props: {
    value: {
      type:     [Array, Object],
      default: null,
    },
    // If the user supplies this array, then it indicates which keys should be shown as binary
    binaryValueKeys: {
      type:    [Array, Object],
      default: null
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
      type: [String, Boolean],
      default() {
        return this.$store.getters['i18n/t']('keyValue.protip', null, true);
      },
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
    keyEditable: {
      type:    Boolean,
      default: true,
    },
    // Offer a set of suggestions for the keys as a Select instead of Input
    keyOptions: {
      type:    Array,
      default: null,
    },
    // If false and keyOptions are provided, the key MUST be one of the keyOptions.
    keyTaggable: {
      type:    Boolean,
      default: true,
    },
    keyOptionUnique: {
      type:    Boolean,
      default: false,
    },
    keyPlaceholder: {
      type: String,
      default() {
        return this.$store.getters['i18n/t']('keyValue.keyPlaceholder');
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
    displayValuesAsBinary: {
      type:    Boolean,
      default: false,
    },
    valueMultiline: {
      type:    Boolean,
      default: true,
    },
    valueTrim: {
      type:    Boolean,
      default: true,
    },
    handleBase64: {
      type:    Boolean,
      default: false,
    },
    valueConcealed: {
      type:    Boolean,
      default: false,
    },
    // On initial reading of the existing value, this function is called
    // and can return false to say that a value is not supported for editing.
    // This is mainly useful for resources like envVars that have a valueFrom
    // you want to preserve but not support editing
    supported: {
      type:    Function,
      default: v => true,
    },
    // For asMap=false, preserve (copy) these keys from the original value into the emitted value.
    // Also useful for valueFrom as above.
    preserveKeys: {
      type:    Array,
      default: null,
    },
    extraColumns: {
      type:    Array,
      default: () => [],
    },
    defaultAddData: {
      type:    Object,
      default: () => {},
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
    loading: {
      default: false,
      type:    Boolean
    },
    parseLinesFromFile: {
      default: false,
      type:    Boolean
    }
  },
  data() {
    const rows = [];

    console.log('DATA!!!', this.value);

    if ( this.asMap ) {
      const input = this.value || {};

      Object.keys(input).forEach((key) => {
        let value = input[key];

        if ( this.handleBase64 && asciiLike(base64Decode(value))) {
          value = base64Decode(value);
        }

        rows.push({
          key,
          value,
          binary:    this.displayValuesAsBinary || (this.handleBase64 && !asciiLike(base64Decode(input[key]))),
          canEncode: this.handleBase64 && asciiLike(base64Decode(input[key])),
          supported: true,
        });
      });
    } else {
      const input = this.value || [];

      for ( const row of input ) {
        let value = row[this.valueName] || '';

        if ( this.handleBase64 && asciiLike(base64Decode(value))) {
          value = base64Decode(value);
        }
        const entry = {
          [this.keyName]:   row[this.keyName] || '',
          [this.valueName]: value,
          binary:           this.displayValuesAsBinary || (this.handleBase64 && !asciiLike(base64Decode(row[this.valueName]))),
          canEncode:        this.handleBase64 && asciiLike(base64Decode(row[this.valueName])),
          supported:        this.supported(row),
        };

        this.preserveKeys?.map((k) => {
          if ( typeof row[k] !== 'undefined' ) {
            entry[k] = row[k];
          }
        });
        rows.push(entry);
      }
    }
    if ( !rows.length && this.initialEmptyRow ) {
      rows.push({
        [this.keyName]:   '',
        [this.valueName]: '',
        binary:           false,
        supported:        true
      });
    }

    console.log('ROWS!', rows);

    return { rows };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    containerStyle() {
      const gap = this.canRemove ? ' 50px' : '';
      const size = 2 + this.extraColumns.length;

      return `grid-template-columns: repeat(${ size }, 1fr)${ gap };`;
    },
    usedKeyOptions() {
      return this.rows.map(row => row[this.keyName]);
    },
    filteredKeyOptions() {
      if (this.keyOptionUnique) {
        return this.keyOptions
          .filter(option => !this.usedKeyOptions.includes(option.value));
      }

      return this.keyOptions;
    },
    /**
     * Prevent removal if expressly not allowed and not in view mode
     */
    canRemove() {
      return !this.isView && this.removeAllowed;
    }
  },
  created() {
    this.queueUpdate = debounce(this.update, 500);
  },
  methods: {
    add(key = '', value = '') {
      const obj = {
        ...this.defaultAddData,
        [this.keyName]:   key,
        [this.valueName]: value,
      };

      obj.binary = this.displayValuesAsBinary;
      obj.supported = true;
      this.rows.push(obj);
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
    removeEmptyRows() {
      const cleaned = this.rows.filter((row) => {
        return (row.value.length || row.key.length);
      });

      this.$set(this, 'rows', cleaned);
    },
    onFileSelected(file) {
      const { name, value } = this.fileModifier(file.name, file.value);

      if (!this.parseLinesFromFile) {
        this.add(name, value, this.displayValuesAsBinary);
      } else {
        const lines = value.split('\n');

        lines.forEach((line) => {
          // Ignore empty lines
          if (line.length) {
            const [key, value] = line.split('=');

            this.add(key, value);
          }
        });
      }
    },
    download(idx, ev) {
      const row = this.rows[idx];
      const name = row[this.keyName];
      const value = row[this.valueName];

      downloadFile(name, value, 'application/octet-stream');
    },
    update() {
      let out;

      if ( this.asMap ) {
        out = {};
        const keyName = this.keyName;
        const valueName = this.valueName;

        for ( const row of this.rows ) {
          let value = (row[valueName] || '');
          const key = (row[keyName] || '').trim();

          if (value && typeOf(value) === 'object') {
            out[key] = JSON.parse(JSON.stringify(value));
          } else {
            value = value || '';
            if (this.valueTrim && asciiLike(value)) {
              value = value.trim();
            }
            if (row.canEncode) {
              value = base64Encode(value);
            }
            if ( key && (value || this.valueCanBeEmpty) ) {
              out[key] = value;
            }
          }
        }
      } else {
        const preserveKeys = this.preserveKeys || [];

        removeObject(preserveKeys, this.keyName);
        removeObject(preserveKeys, this.valueName);
        out = this.rows.map((row) => {
          let value = row[this.valueName];

          if (row.canEncode) {
            value = base64Encode(value);
          }
          const entry = {
            [this.keyName]:   row[this.keyName],
            [this.valueName]: value,
          };

          for ( const k of preserveKeys ) {
            if ( typeof row[k] !== 'undefined' ) {
              entry[k] = row[k];
            }
          }

          return entry;
        });
      }

      console.log('OUTPUT!', out);
      this.$emit('input', out);
    },
    onPaste(index, event, pastedValue) {
      const text = event.clipboardData.getData('text/plain');
      const lines = text.split('\n');
      const splits = lines.map((line) => {
        const splitter = !line.includes(':') || ((line.indexOf('=') < line.indexOf(':')) && line.includes(':')) ? '=' : ':';

        return line.split(splitter);
      });

      if (splits.length === 0 || (splits.length === 1 && splits[0].length < 2)) {
        return;
      }
      event.preventDefault();
      const keyValues = splits.map(split => ({
        [this.keyName]:   (split[0] || '').trim(),
        [this.valueName]: (split[1] || '').trim(),
        supported:        true,
        binary:           this.displayValuesAsBinary
      }));

      this.rows.splice(index, 1, ...keyValues);
      this.queueUpdate();
    },
    calculateOptions(value) {
      const valueOption = this.keyOptions.find(o => o.value === value);

      if (valueOption) {
        return [valueOption, ...this.filteredKeyOptions];
      }

      return this.filteredKeyOptions;
    },
    binaryTextSize(val) {
      return this.t('detailText.binary', { n: val.length ? binarySize(val) : 0 }, true);
    },
    get,
  }
};
</script>
<template>
  <div class="key-value">
    <div v-if="title || $slots.title" class="clearfix">
      <slot name="title">
        <h3>
          {{ title }}
        </h3>
      </slot>
    </div>
    <div class="kv-container" :style="containerStyle">
      <template v-if="rows.length || isView">
        <label class="text-label">
          {{ keyLabel }}
          <i v-if="protip && !isView && addAllowed" v-tooltip="protip" class="icon icon-info" />
        </label>
        <label class="text-label">
          {{ valueLabel }}
        </label>
        <label v-for="c in extraColumns" :key="c">
          <slot :name="'label:'+c">{{ c }}</slot>
        </label>
        <slot v-if="canRemove" name="remove">
          <span />
        </slot>
      </template>
      <template v-if="!rows.length && isView">
        <div class="kv-item key text-muted">
          &mdash;
        </div>
        <div class="kv-item key text-muted">
          &mdash;
        </div>
      </template>
      <template v-for="(row,i) in rows" v-else>
        <div :key="i+'key'" class="kv-item key">
          <slot
            name="key"
            :row="row"
            :mode="mode"
            :keyName="keyName"
            :valueName="valueName"
            :queueUpdate="queueUpdate"
          >
            <Select
              v-if="keyOptions"
              ref="key"
              v-model="row[keyName]"
              :searchable="true"
              :clearable="false"
              :taggable="keyTaggable"
              :options="calculateOptions(row[keyName])"
              @input="queueUpdate"
            />
            <input
              v-else
              ref="key"
              v-model="row[keyName]"
              :disabled="isView || !keyEditable"
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
            <div v-if="!row.supported">
              {{ t('detailText.unsupported', null, true) }}
            </div>
            <div v-else-if="row.binary">
              {{ binaryTextSize(row.value) }}
            </div>
            <TextAreaAutoGrow
              v-else-if="valueMultiline"
              v-model="row[valueName]"
              :class="{'conceal': valueConcealed}"
              :mode="mode"
              :placeholder="valuePlaceholder"
              :min-height="40"
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
        <div v-for="c in extraColumns" :key="i + c" class="kv-item extra">
          <slot :name="'col:' + c" :row="row" :queue-update="queueUpdate" />
        </div>
        <div
          v-if="canRemove"
          :key="i"
          class="kv-item remove"
          :data-testid="`remove-column-${i}`"
        >
          <slot name="removeButton" :remove="remove" :row="row" :i="i">
            <button type="button" :disabled="isView" class="btn role-link" @click="remove(i)">
              {{ removeLabel || t('generic.remove') }}
            </button>
          </slot>
        </div>
      </template>
    </div>
    <div v-if="(addAllowed || readAllowed) && !isView" class="footer">
      <slot name="add" :add="add">
        <button v-if="addAllowed" type="button" class="btn role-tertiary add" :disabled="loading || (keyOptions && filteredKeyOptions.length === 0)" @click="add()">
          <i v-if="loading" class="mr-5 icon icon-spinner icon-spin icon-lg" /> {{ addLabel }}
        </button>
        <FileSelector
          v-if="readAllowed"
          :disabled="isView"
          class="role-tertiary"
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
    .read-from-file {
      float: right;
    }
  }
  input {
    height: 40px;
    line-height: 1;
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

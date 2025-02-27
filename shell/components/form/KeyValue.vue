<script>
import debounce from 'lodash/debounce';
import { typeOf } from '@shell/utils/sort';
import { removeAt, removeObject } from '@shell/utils/array';
import { base64Encode, base64Decode, binarySize } from '@shell/utils/crypto';
import { downloadFile } from '@shell/utils/download';
import { TextAreaAutoGrow } from '@components/Form/TextArea';
import { get } from '@shell/utils/object';
import Select from '@shell/components/form/Select';
import FileSelector from '@shell/components/form/FileSelector';
import { _EDIT, _VIEW } from '@shell/config/query-params';
import { asciiLike } from '@shell/utils/string';
import CodeMirror from '@shell/components/CodeMirror';
import isEqual from 'lodash/isEqual';

export default {
  name: 'KeyValue',

  emits: ['focusKey', 'update:value'],

  components: {
    CodeMirror,
    Select,
    TextAreaAutoGrow,
    FileSelector
  },
  props: {
    value: {
      type:    [Array, Object],
      default: null,
    },
    defaultValue: {
      type:    [Array, Object],
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

    titleProtip: {
      type:    String,
      default: ''
    },

    protip: {
      type:    [String, Boolean],
      default: '',
    },
    // For asMap=false, the name of the field that goes into the row objects
    keyName: {
      type:    String,
      default: 'key',
    },
    keyLabel: {
      type:    String,
      default: '',
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
      type:    String,
      default: '',
    },
    /**
     * List of keys which needs to be disabled and hidden based on toggler
     */
    protectedKeys: {
      type:    Array,
      default: () => [],
    },
    /**
     * Conditionally display protected keys, if any
     */
    toggleFilter: {
      type:    Boolean,
      default: false,
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
      default: '',
    },
    valuePlaceholder: {
      type:    String,
      default: '',
    },
    valueCanBeEmpty: {
      type:    Boolean,
      default: false,
    },
    displayValuesAsBinary: {
      type:    Boolean,
      default: false,
    },
    valueMarkdownMultiline: {
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
      default: (v) => true,
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
      type:    String,
      default: '',
    },
    addIcon: {
      type:    String,
      default: '',
    },
    addAllowed: {
      type:    Boolean,
      default: true,
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
      default: () => [':', '='],
    },
    loading: {
      default: false,
      type:    Boolean
    },
    parseLinesFromFile: {
      default: false,
      type:    Boolean
    },
    parseValueFromFile: {
      default: false,
      type:    Boolean
    },
    disabled: {
      default: false,
      type:    Boolean
    },
  },
  data() {
    const rows = this.getRows(this.value);

    return {
      rows,
      codeMirrorFocus: {},
      lastUpdated:     null
    };
  },
  computed: {
    _protip() {
      return this.protip || this.t('keyValue.protip', null, true);
    },
    _keyLabel() {
      return this.keyLabel || this.t('generic.key');
    },
    _keyPlaceholder() {
      return this.keyPlaceholder || this.t('keyValue.keyPlaceholder');
    },
    _valueLabel() {
      return this.valueLabel || this.t('generic.value');
    },
    _valuePlaceholder() {
      return this.valuePlaceholder || this.t('keyValue.valuePlaceholder');
    },
    _addLabel() {
      return this.addLabel || this.t('generic.add');
    },

    isView() {
      return this.mode === _VIEW;
    },
    containerStyle() {
      const gap = this.canRemove ? ' 50px' : '';
      const size = 2 + this.extraColumns.length;

      return `grid-template-columns: repeat(${ size }, 1fr)${ gap };`;
    },
    usedKeyOptions() {
      return this.rows.map((row) => row[this.keyName]);
    },
    filteredKeyOptions() {
      if (this.keyOptionUnique) {
        return this.keyOptions
          .filter((option) => !this.usedKeyOptions.includes(option.value));
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
  watch: {
    /**
     * KV works with v-model:value=value
     * value is transformed into this.rows (base64 decode, mark supported etc)
     * on input, this.update constructs a new value from this.rows and emits
     * if the parent component changes value, KV needs to re-compute this.rows
     * If the value changes because the user has edited it using KV, then KV should NOT re-compute rows
     * the value watcher will compare the last value KV emitted with the new value KV detects and re-compute rows if they don't match
     */
    value: {
      deep: true,
      handler(neu, old) {
        this.valuePropChanged(neu, old);
      }
    }
  },
  methods: {
    valuePropChanged(neu) {
      if (!isEqual(neu, this.lastUpdated)) {
        this.rows = this.getRows(neu);
      }
    },

    isProtected(key) {
      return this.protectedKeys && this.protectedKeys.includes(key);
    },

    getRows(value) {
      const rows = [];

      if ( this.asMap ) {
        const input = value || {};

        Object.keys(input).forEach((key) => {
          let value = input[key];
          const decodedValue = base64Decode(input[key]);
          const asciiValue = asciiLike(decodedValue);

          if ( this.handleBase64 && asciiValue) {
            value = base64Decode(value);
          }

          rows.push({
            key,
            value,
            binary:    this.displayValuesAsBinary || (this.handleBase64 && !asciiValue),
            canEncode: this.handleBase64 && asciiValue,
            supported: true,
          });
        });
      } else {
        const input = value || [];

        for ( const row of input ) {
          let value = row[this.valueName] || '';

          const decodedValue = base64Decode(row[this.valueName]);
          const asciiValue = asciiLike(decodedValue);

          if ( this.handleBase64 && asciiValue) {
            value = base64Decode(value);
          }
          const entry = {
            [this.keyName]:   row[this.keyName] || '',
            [this.valueName]: value,
            binary:           this.displayValuesAsBinary || (this.handleBase64 && !asciiValue),
            canEncode:        this.handleBase64 && asciiValue,
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
      if ( rows && !rows.length && this.initialEmptyRow ) {
        rows.push({
          [this.keyName]:   '',
          [this.valueName]: '',
          binary:           false,
          canEncode:        this.handleBase64,
          supported:        true
        });
      }

      return rows;
    },

    add(key = '', value = '') {
      const obj = {
        ...this.defaultAddData,
        [this.keyName]:   key,
        [this.valueName]: value,
      };

      obj.binary = false;
      obj.canEncode = this.handleBase64;
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

      this['rows'] = cleaned;
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

        if (lines.length > 0) {
          this.removeEmptyRows();
        }
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
      this.lastUpdated = out;

      this.$emit('update:value', out);
    },
    onPaste(index, event) {
      const text = event.clipboardData.getData('text/plain');
      const lines = text.split('\n');
      const splits = lines.map((line) => {
        const splitter = this.parserSeparators.find((sep) => line.includes(sep));

        return splitter ? line.split(splitter) : '';
      }).filter((split) => split && split.length > 0);

      if (splits.length === 0 || (splits.length === 1 && splits[0].length < 2)) {
        return;
      }
      event.preventDefault();
      const keyValues = splits.map((split) => ({
        [this.keyName]:   (split[0] || '').trim(),
        [this.valueName]: (split[1] || '').trim(),
        supported:        true,
        canEncode:        this.handleBase64,
        binary:           this.displayValuesAsBinary
      }));

      this.rows.splice(index, 1, ...keyValues);
      this.queueUpdate();
    },
    calculateOptions(value) {
      const valueOption = this.keyOptions.find((o) => o.value === value);

      if (valueOption) {
        return [valueOption, ...this.filteredKeyOptions];
      }

      return this.filteredKeyOptions;
    },
    binaryTextSize(val) {
      const handledValue = this.handleBase64 ? base64Decode(val) : val;
      const n = val.length ? binarySize(handledValue) : 0;

      return this.t('detailText.binary', { n }, true);
    },
    get,
    /**
     * Update 'rows' variable with the user's input and prevents to update queue before the row model is updated
     */
    onInputMarkdownMultiline(idx, value) {
      this.rows = this.rows.map((row, i) => i === idx ? { ...row, value } : row);
      this.queueUpdate();
    },
    /**
     * Set focus on CodeMirror fields
     */
    onFocusMarkdownMultiline(idx, value) {
      this.codeMirrorFocus[idx] = value;
    },
    onValueFileSelected(idx, file) {
      const { name, value } = file;

      if (!this.rows[idx][this.keyName]) {
        this.rows[idx][this.keyName] = name;
      }
      this.rows[idx][this.valueName] = value;
    },
    isValueFieldEmpty(value) {
      return !value || value.trim().length === 0;
    }
  }
};
</script>
<template>
  <div class="key-value">
    <div
      v-if="title || $slots.title"
      class="clearfix"
    >
      <slot name="title">
        <h3>
          {{ title }}
          <i
            v-if="titleProtip"
            v-clean-tooltip="titleProtip"
            class="icon icon-info"
          />
        </h3>
      </slot>
    </div>
    <div
      class="kv-container"
      role="grid"
      :aria-rowcount="rows.length"
      :aria-colcount="extraColumns.length + 2"
      :style="containerStyle"
    >
      <template v-if="rows.length || isView">
        <div class="rowgroup">
          <div class="row">
            <label
              class="text-label"
              role="columnheader"
            >
              {{ _keyLabel }}
              <i
                v-if="_protip && !isView && addAllowed"
                v-clean-tooltip="{content: _protip, triggers: ['hover', 'touch', 'focus'] }"
                v-stripped-aria-label="_protip"
                class="icon icon-info"
                tabindex="0"
              />
            </label>
            <label
              class="text-label"
              role="columnheader"
            >
              {{ _valueLabel }}
            </label>
            <label
              v-for="(c, i) in extraColumns"
              :key="i"
              role="columnheader"
            >
              <slot :name="'label:'+c">{{ c }}</slot>
            </label>
            <slot
              v-if="canRemove"
              name="remove"
            >
              <span />
            </slot>
          </div>
        </div>
      </template>
      <template v-if="!rows.length && isView">
        <div class="rowgroup">
          <div class="row">
            <div
              class="kv-item key text-muted"
              role="gridcell"
            >
              &mdash;
            </div>
            <div
              class="kv-item key text-muted"
              role="gridcell"
            >
              &mdash;
            </div>
          </div>
        </div>
      </template>
      <template
        v-for="(row,i) in rows"
        v-else
        :key="i"
      >
        <div
          class="rowgroup"
          :class="{'hide': isProtected(row.key) && !toggleFilter}"
        >
          <div class="row">
            <!-- Key -->
            <div
              class="kv-item key"
              role="gridcell"
              :aria-rowindex="i+1"
              :aria-colindex="1"
            >
              <slot
                name="key"
                :row="row"
                :mode="mode"
                :keyName="keyName"
                :valueName="valueName"
                :queueUpdate="queueUpdate"
                :disabled="disabled"
              >
                <Select
                  v-if="keyOptions"
                  ref="key"
                  v-model:value="row[keyName]"
                  :searchable="true"
                  :disabled="disabled || isProtected(row.key)"
                  :clearable="false"
                  :taggable="keyTaggable"
                  :options="calculateOptions(row[keyName])"
                  :data-testid="`select-kv-item-key-${i}`"
                  :aria-label="t('generic.ariaLabel.key', {index: i})"
                  @update:value="queueUpdate"
                />
                <input
                  v-else
                  ref="key"
                  v-model="row[keyName]"
                  :disabled="isView || disabled || !keyEditable || isProtected(row.key)"
                  :placeholder="_keyPlaceholder"
                  :data-testid="`input-kv-item-key-${i}`"
                  :aria-label="t('generic.ariaLabel.key', {index: i})"
                  @input="queueUpdate"
                  @paste="onPaste(i, $event)"
                >
              </slot>
            </div>

            <!-- Value -->
            <div
              :data-testid="`kv-item-value-${i}`"
              class="kv-item value"
              role="gridcell"
              :aria-rowindex="i+1"
              :aria-colindex="2"
            >
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
                <div
                  v-else
                  class="value-container"
                  :class="{ 'upload-button': parseValueFromFile }"
                >
                  <CodeMirror
                    v-if="valueMarkdownMultiline"
                    ref="cm"
                    data-testid="code-mirror-multiline-field"
                    :class="{['focus']: codeMirrorFocus[i]}"
                    :value="row[valueName]"
                    :as-text-area="true"
                    :mode="mode"
                    :options="{
                      screenReaderLabel: t('generic.ariaLabel.value', { index: i })
                    }"
                    @onInput="onInputMarkdownMultiline(i, $event)"
                    @onFocus="onFocusMarkdownMultiline(i, $event)"
                  />
                  <TextAreaAutoGrow
                    v-else-if="valueMultiline && row[valueName] !== undefined"
                    v-model:value="row[valueName]"
                    data-testid="value-multiline"
                    :class="{'conceal': valueConcealed}"
                    :disabled="disabled || isProtected(row.key)"
                    :mode="mode"
                    :placeholder="_valuePlaceholder"
                    :min-height="40"
                    :spellcheck="false"
                    :aria-label="t('generic.ariaLabel.value', {index: i})"
                    @update:value="queueUpdate"
                  />
                  <input
                    v-else
                    v-model="row[valueName]"
                    :disabled="isView || disabled || isProtected(row.key)"
                    :type="valueConcealed ? 'password' : 'text'"
                    :placeholder="_valuePlaceholder"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    :data-testid="`input-kv-item-value-${i}`"
                    :aria-label="t('generic.ariaLabel.value', {index: i})"
                    @input="queueUpdate"
                  >
                  <FileSelector
                    v-if="parseValueFromFile && readAllowed && !isView && isValueFieldEmpty(row[valueName])"
                    class="btn btn-sm role-secondary file-selector"
                    :label="t('generic.upload')"
                    :include-file-name="true"
                    :aria-label="t('generic.ariaLabel.value', {index: i})"
                    @selected="onValueFileSelected(i, $event)"
                  />
                </div>
              </slot>
            </div>
            <div
              v-for="(c, j) in extraColumns"
              :key="`${i}-${j}`"
              class="kv-item extra"
              role="gridcell"
              :aria-rowindex="i+1"
              :aria-colindex="j+3"
            >
              <slot
                :name="'col:' + c"
                :row="row"
                :queue-update="queueUpdate"
                :i="i"
              />
            </div>
            <div
              v-if="canRemove"
              :key="i"
              class="kv-item remove"
              role="gridcell"
              :aria-rowindex="i+1"
              :aria-colindex="extraColumns.length+3"
              :data-testid="`remove-column-${i}`"
            >
              <slot
                name="removeButton"
                :remove="remove"
                :row="row"
                :i="i"
              >
                <button
                  type="button"
                  role="button"
                  :disabled="isView || isProtected(row.key) || disabled"
                  :aria-label="removeLabel || t('generic.remove')"
                  class="btn role-link"
                  @click="remove(i)"
                >
                  {{ removeLabel || t('generic.remove') }}
                </button>
              </slot>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div
      v-if="(addAllowed || readAllowed) && !isView"
      class="footer mt-20"
    >
      <slot
        name="add"
        :add="add"
      >
        <button
          v-if="addAllowed"
          type="button"
          role="button"
          class="btn role-tertiary add"
          data-testid="add_row_item_button"
          :disabled="loading || disabled || (keyOptions && filteredKeyOptions.length === 0)"
          :aria-label="_addLabel"
          @click="add()"
        >
          <i
            class="mr-5 icon"
            :class="loading ? ['icon-lg', 'icon-spinner','icon-spin']: [addIcon]"
          /> {{ _addLabel }}
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
  .kv-container {
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
      &.value .value-container {
        &.upload-button {
          position: relative;
          display: flex;
          justify-content: right;
          align-items: center;
        }
        .file-selector {
          position: absolute;
          margin-right: 5px;
        }
      }
      &.value textarea {
        padding: 10px 10px 10px 10px;
      }

      .text-monospace:not(.conceal) {
        font-family: monospace, monospace;
      }
    }
  }

  .rowgroup {
    display: grid;
    grid-column-start: 1;
    grid-column-end: span end;
    grid-template-columns: subgrid;
  }

  .row {
    &::before {
      display: none;
    }
    display: grid;
    grid-column-start: 1;
    grid-column-end: span end;
    grid-template-columns: subgrid;
  }

  .remove {
    text-align: center;
    BUTTON {
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
  .copy-value {
    padding: 0px 0px 0px 10px;
  }
}
</style>

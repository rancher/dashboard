<script>
import debounce from 'lodash/debounce';
import { typeOf } from '@/utils/sort';
import { _EDIT, _VIEW } from '@/config/query-params';
import { removeAt } from '@/utils/array';
import { asciiLike, escapeHtml } from '@/utils/string';
import { base64Encode, base64Decode } from '@/utils/crypto';
import { downloadFile } from '@/utils/download';
import TextAreaAutoGrow from '@/components/form/TextAreaAutoGrow';
import SortableTable from '@/components/SortableTable';
import ClickExpand from '@/components/formatter/ClickExpand';
import { get } from '@/utils/object';
import CodeMirror from '@/components/CodeMirror';

const LARGE_LIMIT = 2 * 1024;

/*
  @TODO
  - Paste
  - Read from file
  - Multiline
  - Concealed value
*/

export default {
  components: {
    SortableTable,
    TextAreaAutoGrow,
    ClickExpand,
    CodeMirror
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
    downloadLabel: {
      type:    String,
      default: 'Download'
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
      default: 'Read from file'
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
      default: 'Remove',
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
      const rows = (this.value || []).slice() ;

      rows.map((row) => {
        row._display = this.displayProps(row[this.valueName]);
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
        _display: this.displayProps(value)
      });
    });

    if ( !rows.length && this.initialEmptyRow && this.mode !== _VIEW) {
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

    headers() {
      const out = [
        {
          name:  'key',
          label: 'Key',
          value: this.keyName,
        },
        {
          name:  'value',
          label: 'Value',
          value: this.valueName,
        }
      ];

      if ( this.showRemove ) {
        out.push({
          name:  'remove',
          label: '',
          value: '',
          align: 'right',
          width: 100
        });
      }

      if ( this.valueBinary && this.isView ) {
        out.push({
          name:  'download',
          label: 'Download',
          value: '',
          align: 'right'
        });
      }

      return out;
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
        this.$refs.key.focus();
      });
    },

    remove(row) {
      const idx = this.rows.indexOf(row);

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

    download(row) {
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

    displayProps(value) {
      const binary = typeof value === 'string' && !asciiLike(value);
      const withBreaks = escapeHtml(value || '').replace(/(\r\n|\r|\n)/g, '<br/>\n');
      const byteSize = withBreaks.length || 0; // Blobs don't exist in node/ssr
      const isLarge = byteSize > LARGE_LIMIT;
      let parsed;

      if ( value && ( value.startsWith('{') || value.startsWith('[') ) ) {
        try {
          parsed = JSON.parse(value);
        } catch {
        }
      }

      return {
        binary,
        withBreaks,
        isLarge,
        parsed,
        byteSize
      };
    },
    get
  }
};
</script>

<template>
  <div class="key-value" :class="mode">
    <template v-if="title || !!$slots.title">
      <div :style="{'display':'flex'}" class="clearfix">
        <slot name="title">
          <h2 :style="{'display':'flex'}">
            {{ title }}
          </h2>
        </slot>
        <i v-if="protip" v-tooltip="protip" class="icon icon-info" style="font-size: 12px" />
      </div>
    </template>

    <SortableTable
      :headers="headers"
      :rows="rows"
      :search="false"
      :table-actions="false"
      :row-actions="false"
      :show-no-rows="isView"
      key-field="id"
    >
      <template #col:key="{row}">
        <td class="key">
          <slot
            name="key"
            :row="row"
            :mode="mode"
            :keyName="keyName"
            :valueName="valueName"
            :isView="isView"
          >
            <div v-if="isView" class="view force-wrap">
              {{ row[keyName] }}
            </div>
            <input
              v-else
              ref="key"
              v-model="row[keyName]"
              :placeholder="keyPlaceholder"
              @input="queueUpdate"
            />
          </slot>
        </td>
      </template>
      <template #col:value="{row}">
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
            <div v-if="isView" class="view force-wrap">
              <span v-if="valueBinary || get(row, '_display.binary')">
                {{ row[valueName].length }} byte<span v-if="row[valueName].length !== 1">s</span>
              </span>
              <template v-else-if="get(row, '_display.parsed')">
                <CodeMirror
                  :options="{mode:{name:'javascript', json:true}, lineNumbers:false, foldGutter:false, readOnly:true}"
                  :value="row[valueName]"
                />
              </template>
              <ClickExpand v-else-if="get(row, '_display.isLarge')" :value="row[valueName]" :size="get(row, '_display.byteSize')" />
              <span v-else-if="get(row, '_display.withBreaks')" v-html="get(row, '_display.withBreaks')" />
              <span v-else class="text-muted">&mdash;</span>
            </div>
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
      </template>
      <template v-if="valueBinary" #col:download="{row}">
        <td class="download" :data-title="valueLabel">
          <a href="#" @click="download(row)">Download</a>
        </td>
      </template>
      <template #col:remove="{row}">
        <td class="remove">
          <slot name="removeButton" :remove="remove" :row="row">
            <button type="button" class="btn bg-transparent role-link" @click="remove(row)">
              {{ removeLabel }}
            </button>
          </slot>
        </td>
      </template>
    </SortableTable>

    <div v-if="showAdd || showRead" class="footer mt-10">
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

<style lang="scss">
.key-value {
  $separator: 20;
  $remove: 75;
  $spacing: 10px;

  .title {
    margin-bottom: 10px;

    .read-from-file {
      float: right;
    }
  }

  &.edit, &.create, &.clone {
    TABLE.sortable-table THEAD TR TH {
      border-color: transparent;
    }
  }

  TABLE.sortable-table {
    width: 100%;
    border-collapse: collapse;

    TD, TH {
      padding: 0 $spacing $spacing 0;
    }

    TR:last-of-type TD {
      padding-bottom: 0;
    }
  }

  .left {
    width: #{$remove}px;
  }

  input {
    height: 50px;
  }

  .key {
    vertical-align: middle;

    label {
      margin: 0;
    }
  }

  .value {
    vertical-align: middle;

    label {
      margin: 0;
    }

    select {
      -webkit-appearance: none;
      border-radius: 2px;
    }

    textarea::placeholder {
      padding-top: 0px;
      color: var(--input-placeholder);
    }
  }

  .remove {
    vertical-align: middle;
    text-align: right;
    width: #{$remove}px;
  }

  .footer {
    .add {
      margin-left: 1px;
    }

    .protip {
      float: right;
      padding: 5px 0;
    }
  }

  .download {
    text-align: right;
  }

  .empty {
    text-align: center;
  }

  .create {
  }

  .view {
    TABLE.sortable-table {
        TD, TH {
          padding: $spacing 0;
        }
      }
    }

    TR:first-of-type TD {
      padding-top: 0;
    }
}

.key-value TR:first-of-type TD.no-rows {
  padding: 40px;
  color: var(--disabled-bg);
  text-align: center;
}
</style>

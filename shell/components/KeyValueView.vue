<script>
import { asciiLike } from '@shell/utils/string';
import { base64Decode } from '@shell/utils/crypto';
import { downloadFile } from '@shell/utils/download';

export default {
  components: {},

  props: {
    value: {
      type:    [Array, Object],
      default: null,
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

    valueBase64: {
      type:    Boolean,
      default: false,
    },

    valueConcealed: {
      type:    Boolean,
      default: false,
    },
  },

  computed: {
    threeColumns() {
      return this.showRemove;
    },

    rows() {
      const out = [];

      if ( this.asMap ) {
        Object.keys(this.value || {}).forEach((key) => {
          const value = this.value[key];

          out.push({
            key,
            ...this.displayProps(value),
          });
        });
      } else {
        for ( const row of (this.value || []) ) {
          const key = row[this.keyName];
          const value = row[this.valueName];

          out.push({
            key,
            ...this.displayProps(value),
          });
        }
      }

      return out;
    },
  },

  methods: {
    displayProps(value) {
      const binary = typeof value === 'string' && !asciiLike(value);
      const byteSize = `${ value }`.length;
      let parsed;

      if ( this.valueBase64 ) {
        value = base64Decode(value);
      }

      if ( value && ( value.startsWith('{') || value.startsWith('[') ) ) {
        try {
          parsed = JSON.parse(value);
          parsed = JSON.stringify(parsed, null, 2);
        } catch {
        }
      }

      return {
        value,
        binary,
        parsed,
        byteSize
      };
    },

    download(idx, ev) {
      const row = this.rows[idx];
      const name = row[this.keyName];
      const value = row[this.valueName];

      downloadFile(name, value, 'application/octet-stream');
    },
  }
};
</script>

<template>
  <div class="key-value">
    <div
      v-if="title"
      class="clearfix"
    >
      <slot name="title">
        <h3>
          {{ title }}
        </h3>
      </slot>
    </div>

    <div
      class="kv-container"
      :class="{'extra-column':threeColumns}"
    >
      <label class="text-label">
        {{ keyLabel }}
      </label>
      <label class="text-label">
        {{ valueLabel }}
      </label>
      <span v-if="threeColumns" />

      <div
        v-if="!rows.length"
        class="kv-row last"
        :class="{'extra-column':threeColumns}"
      >
        <div class="text-muted">
          &mdash;
        </div>
        <div class="text-muted">
          &mdash;
        </div>
        <div
          v-if="threeColumns"
          class="text-muted"
        >
          &mdash;
        </div>
      </div>

      <template v-for="(row,i) in rows">
        <div
          :key="i+'key'"
          class="kv-item key"
        >
          <slot
            name="key"
            :row="row"
          >
            <span v-if="row.key">{{ row.key }}</span>
            <span v-else>&mdash;</span>
          </slot>
        </div>

        <div
          :key="i+'value'"
          class="kv-item value"
        >
          <slot
            name="value"
            :row="row"
          >
            <span v-if="row.binary">{{ t('detailText.binary', {n: row.byteSize}) }}</span>
            <span v-else-if="row.empty">{{ t('detailText.empty') }}</span>
            <span v-else>{{ row.value }}</span>
          </slot>
        </div>
      </template>
    </div>
  </div>
</template>

<style lang="scss">

.key-value {
  width: 100%;

  .kv-container{
    display: grid;
    align-items: center;
    grid-template-columns: auto 1fr;
    column-gap: $column-gutter;

    &.extra-column {
       grid-template-columns: 1fr 1fr 100px;
       &.view{
       grid-template-columns: auto 1fr 100px;

       }
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
    height: 50px;
  }

  .download {
    text-align: right;
  }

  .copy-value{
    padding: 0px 0px 0px 10px;
  }
}
</style>

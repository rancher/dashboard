<script>
export default {
  props: {
    /**
     * When used in headers the value can come in as a string or object (e.g. $.metadata.fields[6] returns an array of csv of key=value pairs)
     * @model
     */
    value: {
      type:    [String, Object],
      default: '',
    },
  },

  computed: {
    parsed() {
      const { value } = this;
      let rv = value;

      try {
        rv = this.parseObject(value);
      } catch {
        if (typeof value === 'string') {
          try {
            const objectValues = JSON.parse(value.slice());

            rv = this.parseObject(objectValues);
          } catch (e) {
            console.error('Formatter KeyValue: Unable to parse object from string', e); // eslint-disable-line no-console
          }
        }
      }

      return rv;
    }
  },
  methods: {
    parseObject(obj) {
      const valueKeys = Object.keys(obj);
      const out = [];

      for (let i = 0; i < valueKeys.length; i++) {
        out.push(`${ valueKeys[i] }=${ obj[valueKeys[i]] }`);
      }

      return out;
    }
  }
};
</script>

<template>
  <div class="formatter-key-value-container">
    <div
      v-for="( kv, index ) in parsed"
      :key="index"
      class="formatter-key-value-item"
    >
      {{ kv }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
  td.col-key-value {
    .formatter-key-value-item {
      padding: 3px 0;
      &:first-child {
        margin-top: 10px;
      }
      &:last-child {
        margin-bottom: 10px;
      }
      input, textarea {
        margin-bottom: 10px;
      }
    }
  }
</style>

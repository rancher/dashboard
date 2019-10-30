<script>
import KeyValue from '@/components/form/KeyValue';
import StringMatch from '@/components/cru/rio.cattle.io.v1.router/StringMatch';
import LabeledInput from '@/components/form/LabeledInput';
export default {
  components: {
    StringMatch, KeyValue, LabeledInput
  },
  props:      {
    spec: {
      type:     Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const {
      headers = [], methods = [], path = {}, cookies = []
    } = this.spec;

    return {
      httpMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
      headers,
      methods,
      cookies,
      path,
      host:        { name: 'host', value: '' }
    };
  },
  computed: {
    formatted() {
      return {
        headers: [this.host, ...this.headers],
        methods: this.methods,
        path:    this.path,
        cookies: this.cookies
      };
    },
  },
  methods: {
    matchChange() {
      this.$emit('input', this.formatted);
    },
    isSelected(opt) {
      return this.methods.includes(opt);
    },
    change(type, val) {
      this.$set(this, type, val);
    },
    changeKV(type, val) {
      const set = [];

      for (const key in val) {
        const name = key;
        const value = val[name];

        set.push({ name, value });
      }

      this[type] = set;
    }
  }
};
</script>

<template>
  <div class="match" @change="matchChange" @input="matchChange">
    <div class="row inputs">
      <v-select
        multiple
        :close-on-select="false"
        :options="httpMethods.filter(opt=>!isSelected(opt))"
        placeholder="Method"
        @input="e=>change('methods', e)"
      >
      </v-select>
      <LabeledInput v-model="host.value" label="Host header" />
      <StringMatch :spec="path" label="Path" @input="e=>change('path', e)" />
    </div>
    <div class="row">
      <div class="col span-6">
        <h5>Headers</h5>
        <KeyValue add-label="Add Header Rule" :protip="false" :pad-left="false" :read-allowed="false" @input="e=>changeKV('headers', e)">
          <template v-slot:value="valProps">
            <StringMatch
              :spec="{'exact':valProps.row.value}"
              :options="['exact', 'prefix', 'regexp']"
              label="e.g. bar"
              @input="e=>{
                valProps.row.value = e
                valProps.queueUpdate()
              }"
            />
          </template>
        </KeyValue>
      </div>
      <div class="col span-6">
        <h5>Cookies</h5>
        <KeyValue add-label="Add Cookie Rule" :protip="false" :pad-left="false" :read-allowed="false" @input="e=>changeKV('cookies', e)">
          <template v-slot:value="valProps">
            <StringMatch
              :spec="{'exact':valProps.row.value}"
              :options="['exact', 'prefix']"
              label="e.g. bar"
              @input="e=>{
                valProps.row.value = e
                valProps.queueUpdate()
              }"
            />
          </template>
        </KeyValue>
      </div>
    </div>
  </div>
</template>

<style lang='scss'>
  .match {
    & .fixed  tr {
      & .key, .value, .remove {
        vertical-align: middle;
      }
      & .remove {
        text-align:left;
      }
      & td {
        margin-right: 5px;
        & .labeled-input {
          padding: 0;
          & label:nth-child(1) {
            bottom: -2px;
          }
        }
        & > * {
          padding: 8px;
          height: 100%;
        }
      }
    }
  }
</style>

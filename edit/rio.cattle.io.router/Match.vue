<script>
import pullAt from 'lodash/pullAt';
import pickBy from 'lodash/pickBy';
import isEmpty from 'lodash/isEmpty';
import findIndex from 'lodash/findIndex';
import { typeOf } from '@/utils/sort';
import KeyValue from '@/components/form/KeyValue';
import StringMatch from '@/edit/rio.cattle.io.router/StringMatch';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _VIEW } from '@/config/query-params';

export default {
  components: {
    StringMatch, KeyValue, LabeledInput, LabeledSelect
  },
  props: {
    mode: {
      type:     String,
      required: true,
    },

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

    let hostHeader;

    if (headers.length) {
      hostHeader = pullAt(headers, findIndex(headers, header => header.name === 'host' && Object.keys(header.value)[0] === 'exact'))[0];
    }
    if (!hostHeader) {
      hostHeader = { name: 'host', value: { exact: '' } };
    }

    return {
      httpMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
      headers,
      methods,
      cookies,
      path,
      host:        hostHeader
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },

    formatted() {
      const all = {
        headers: !!this.host.value.exact ? [this.hostHeader, ...this.headers] : this.headers,
        methods: this.methods,
        path:    this.path,
        cookies: this.cookies
      };

      const out = pickBy(all, (value, key) => {
        if (typeOf(value) === 'array') {
          value.forEach((condition) => {
            if (typeOf(condition) === 'string') {
              return true;
            } else {
              return !isEmpty(condition);
            }
          });

          return value.length;
        } else {
          return !!Object.values(value)[0];
        }
      });

      return out;
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
    },
    changePath(stringmatch) {
      const pathString = Object.values(stringmatch)[0];
      const method = Object.keys(stringmatch)[0];

      if (pathString.charAt(0) !== '/') {
        this.$set(this.path, method, `/${ pathString }`);
      } else {
        this.path[method] = pathString;
      }
    }
  }
};
</script>

<template>
  <div class="match" @change="matchChange" @input="matchChange">
    <div class="row inputs">
      <div class="col span-4">
        <LabeledSelect
          multiple
          :close-on-select="false"
          :options="httpMethods.filter(opt=>!isSelected(opt))"
          :value="methods"
          label="Method"
          placeholder="Select a Method..."
          :disabled="isView"
          @input="e=>{change('methods', e); matchChange()}"
        />
      </div>
      <div class="col span-4">
        <LabeledInput v-if="host" v-model="host.value.exact" label="Host header" />
      </div>
      <div class="col span-4">
        <StringMatch :spec="path" label="Path" @input="e=>changePath(e)" />
      </div>
    </div>
    <div class="row mt-20">
      <div class="col span-6">
        <h4>Headers</h4>
        <KeyValue
          :value="headers"
          key-name="name"
          :as-map="false"
          add-label="Add Header Rule"
          :protip="false"
          :pad-left="false"
          :read-allowed="false"
          @input="e=>changeKV('headers', e)"
        >
          <template v-slot:removeButton="buttonProps">
            <button :disabled="isView" type="button" class="btn btn-sm role-link" @click="buttonProps.remove(buttonProps.idx)">
              REMOVE
            </button>
          </template>
          <template v-slot:value="valProps">
            <StringMatch
              :spec="valProps.row.value"
              :options="['exact', 'prefix', 'regexp']"
              placeholder="e.g. bar"
              @input="e=>{
                valProps.row.value = e
                valProps.queueUpdate()
              }"
            />
          </template>
        </KeyValue>
      </div>
      <div class="col span-6">
        <h4>Cookies</h4>
        <KeyValue
          key-name="name"
          :value="cookies"
          :as-map="false"
          add-label="Add Cookie Rule"
          :protip="false"
          :pad-left="false"
          :read-allowed="false"
          @input="e=>changeKV('cookies', e)"
        >
          <template v-slot:removeButton="buttonProps">
            <button :disabled="isView" type="button" class="btn btn-sm role-link" @click="buttonProps.remove(buttonProps.idx)">
              REMOVE
            </button>
          </template>
          <template v-slot:value="valProps">
            <StringMatch
              :spec="valProps.row.value"
              :options="['exact', 'prefix']"
              placeholder="e.g. bar"
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
        & button.role-link {
          padding: 0 0 0 0;
        }
      }
      & td {
        margin-right: 5px;
        & .labeled-input {
          padding: 0;
          & label:nth-child(1) {
            bottom: -2px;
          }
        }
      }
    }
  }
</style>

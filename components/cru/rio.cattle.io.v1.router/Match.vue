<script>
import NameValue from '@/components/cru/rio.cattle.io.v1.router/NameValue';
import StringMatch from '@/components/cru/rio.cattle.io.v1.router/StringMatch';
import Checkbox from '@/components/form/Checkbox';
export default {
  components: { StringMatch, NameValue },
  props:      {
    spec: {
      type:     Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    const { headers = [], methods = [], path = '' } = this.spec;

    return {
      httpMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'],
      headers,
      methods,
      path
    };
  },
  computed: {
    formatted() {
      return {
        headers: this.headers, methods: this.methods, path:    this.path
      };
    },
    listeners() {
      return this.$listeners;
    }
  },
  methods: {
    matchChange() {
      this.$emit('input', this.formatted);
    },
    addMatchString(opt) {
      this.$set(this.match, opt, { value: '', matchStringType: 'exact' });
      this.nextType = '';
    },
    change(target, value, index) {
      console.log('changing: ', target, value, index);
      if (index >= 0) {
        this[target][index] = value;
      } else {
        this[target] = value;
      }
    },
    addHeaderRule() {
      this.headers.unshift({ name: '', value: '' });
    },
    isSelected(opt) {
      return this.methods.includes(opt);
    },
  }
};
</script>

<template>
  <div @change="matchChange" @input="matchChange">
    <v-select
      multiple
      :close-on-select="false"
      :options="httpMethods.filter(opt=>!isSelected(opt))"
      placeholder="filter by http method"
      @input="e=>change('methods', e)"
    >
    </v-select>
    <StringMatch :init="path" :label="'path match string'" @input="e=>change('path', e)" />
    <button class="btn bg-transparent" @click="addHeaderRule">
      add header rule
    </button>
    <NameValue v-for="(header, i) in headers" :key="header.name + headers.length+i" :spec="header" @input="e=>change('headers', e, i)" />
  </div>
</template>

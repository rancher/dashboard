<script>

import { random32 } from '../../utils/string';
import RadioGroup from '@/components/form/RadioGroup';
import RulePath from '@/edit/networking.k8s.io.v1beta1.ingress/RulePath';
import LabeledInput from '@/components/form/LabeledInput';

export default {
  components: {
    RadioGroup, RulePath, LabeledInput
  },

  props: {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    workloads: {
      type:    Array,
      default: () => []
    }
  },

  data() {
    const { host = '', http = {} } = this.value;

    const { paths = [{ id: random32(1) }] } = http;

    return {
      host, paths, ruleMode: 'setHost'
    };
  },

  methods: {
    update() {
      const http = { paths: this.paths };
      const out = { ...this.value, http };

      if (this.host) {
        out.host = this.host;
      } else {
        delete out.host;
      }

      if (this.ruleMode === 'asDefault') {
        out.asDefault = true;
      }

      this.$emit('input', out);
    },

    addPath() {
      this.paths = [...this.paths, { id: random32(1) }];
    },

    removePath(idx) {
      const neu = [...this.paths];

      neu.splice(idx, 1);
      this.paths = neu;
    },

    removeRule() {
      this.$emit('remove');
    }
  }
};
</script>

<template>
  <div class="rule mt-20" @input="update">
    <div class="row">
      <RadioGroup v-model="ruleMode" class="col span-4" :options="[ 'setHost', 'asDefault']" :labels="[ 'Specify a hostname to use', 'Use as the default backend']" />
      <div id="host" :style="{'visibility': ruleMode==='setHost' ? 'visible':'hidden'}" class="col span-7">
        <LabeledInput v-model="host" label="Request Host" placeholder="e.g. example.com" />
      </div>
      <div class="col span-1">
        <button class="btn role-link close" @click="removeRule">
          <i class="icon icon-2x icon-x" />
        </button>
      </div>
    </div>
    <template v-for="(path, i) in paths">
      <RulePath
        :key="path.id"
        class="row mb-10"
        :value="path"
        :rule-mode="ruleMode"
        :targets="workloads"
        @input="e=>$set(paths, i, e)"
        @remove="e=>removePath(i)"
      />
    </template>
    <button :style="{'padding':'0px 0px 0px 5px'}" class="btn btn-sm role-link" @click="addPath">
      add path
    </button>
  </div>
</template>

<style lang='scss' scoped>
  .rule {
    background: var(--tabbed-container-bg);
    border: 1px solid var(--tabbed-border);
    border-radius: var(--border-radius);
    padding: 40px;
  }

  #host {
    align-self: center
  }

  .close{
    float:right;
    padding: 0px;
    position: relative;
    top: -25px;
    right: -25px;
  }
</style>

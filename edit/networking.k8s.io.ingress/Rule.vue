<script>
import RulePath from '@/edit/networking.k8s.io.ingress/RulePath';
import LabeledInput from '@/components/form/LabeledInput';
import { random32 } from '../../utils/string';
export default {
  components: { RulePath, LabeledInput },
  props:      {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    serviceTargets: {
      type:    Array,
      default: () => []
    }
  },
  data() {
    const { host = '', http = {} } = this.value;
    const { paths = [{ id: random32(1) }] } = http;

    return {
      host, paths, ruleMode: this.value.asDefault ? 'asDefault' : 'setHost'
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
      this.$emit('input', out);
    },
    addPath(ev) {
      ev.preventDefault();
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
      <div id="host" class="col span-11">
        <LabeledInput v-model="host" :label="t('ingress.rules.requestHost.label')" :placeholder="t('ingress.rules.requestHost.placeholder')" />
      </div>
      <div class="col span-1">
        <button class="btn role-link close" @click="removeRule">
          <i class="icon icon-2x icon-x" />
        </button>
      </div>
    </div>
    <div class="rule-path-headings row mb-0">
      <div class="col span-4">
        {{ t('ingress.rules.path.label') }}
      </div>
      <div class="col span-4">
        {{ t('ingress.rules.target.label') }}
      </div>
      <div class="col span-3" :style="{'margin-right': '0px'}">
        {{ t('ingress.rules.port.label') }}
      </div>
      <div class="col" />
    </div>
    <template v-for="(path, i) in paths">
      <RulePath
        :key="path.id"
        class="row mb-10"
        :value="path"
        :rule-mode="ruleMode"
        :service-targets="serviceTargets"
        @input="e=>$set(paths, i, e)"
        @remove="e=>removePath(i)"
      />
    </template>
    <button v-if="ruleMode === 'setHost'" :style="{'padding':'0px 0px 0px 5px'}" class="btn btn-sm role-link" @click="addPath">
      {{ t('ingress.rules.addPath') }}
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

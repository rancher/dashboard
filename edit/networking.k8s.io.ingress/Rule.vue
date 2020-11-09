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
      },
    },
    serviceTargets: {
      type:    Array,
      default: () => [],
    },
    ingress: {
      type:     Object,
      required: true
    }
  },
  data() {
    const { host = '', http = {} } = this.value;
    const { paths = [{ id: random32(1) }] } = http;

    return {
      host,
      paths,
      ruleMode: this.value.asDefault ? 'asDefault' : 'setHost',
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
    },
  },
};
</script>

<template>
  <div class="rule" @input="update">
    <div class="row mb-20">
      <div id="host" class="col span-6">
        <LabeledInput
          v-model="host"
          :label="t('ingress.rules.requestHost.label')"
          :placeholder="t('ingress.rules.requestHost.placeholder')"
        />
      </div>
      <div id="host" class="col span-5"></div>
      <div class="col span-1">
        <button class="btn role-link close" @click="removeRule">
          <i class="icon icon-2x icon-x" />
        </button>
      </div>
    </div>
    <div class="rule-path-headings row">
      <div class="col" :class="{'span-6': ingress.showPathType, 'span-4': !ingress.showPathType}">
        <label>{{ t("ingress.rules.path.label") }}</label>
      </div>
      <div class="col" :class="{'span-3': ingress.showPathType, 'span-4': !ingress.showPathType}">
        <label>{{ t("ingress.rules.target.label") }}</label>
      </div>
      <div class="col" :class="{'span-2': ingress.showPathType, 'span-3': !ingress.showPathType}" :style="{ 'margin-right': '0px' }">
        <label>{{ t("ingress.rules.port.label") }}</label>
      </div>
      <div class="col" />
    </div>
    <template v-for="(_, i) in paths">
      <RulePath
        :key="i"
        v-model="paths[i]"
        class="row mb-10"
        :rule-mode="ruleMode"
        :service-targets="serviceTargets"
        :ingress="ingress"
        @remove="(e) => removePath(i)"
      />
    </template>
    <button
      v-if="ruleMode === 'setHost'"
      class="btn role-tertiary add"
      @click="addPath"
    >
      {{ t("ingress.rules.addPath") }}
    </button>
  </div>
</template>

<style lang="scss" scoped>
.rule {
  background: var(--tabbed-container-bg);
  border: 1px solid var(--tabbed-border);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-top: 20px;
}
#host {
  align-self: center;
}
.close {
  float: right;
  padding: 0px;
  position: relative;
  top: -10px;
  right: -10px;
}
</style>

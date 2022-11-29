<script>
import RulePath from '@shell/edit/networking.k8s.io.ingress/RulePath';
import { LabeledInput } from '@components/Form/LabeledInput';
import { random32 } from '@shell/utils/string';

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
    },
    rules: {
      default: () => ({
        requestHost: [],
        path:        [],
        port:        [],
        target:      []
      }),
      type: Object,
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

      this.$nextTick(() => {
        if ((this.paths?.length === 1 && this.pathObjectIsEmpty(this.paths[0])) || this.paths?.length === 0) {
          delete out.http;
        }
        this.$emit('input', out);
      });
    },
    pathObjectIsEmpty(pathObject) {
      const servicePort = Number.parseInt(pathObject.servicePort) || pathObject.servicePort;
      const serviceName = pathObject.serviceName;
      const path = pathObject.path;
      const pathType = pathObject.pathType;

      if (!servicePort && !serviceName && !path && pathType === 'Prefix') {
        return true;
      }

      return false;
    },
    addPath(ev) {
      if (ev) {
        ev.preventDefault();
      }
      this.paths = [...this.paths, { id: random32(1) }];
      this.$nextTick(() => {
        if (this.$refs.paths && this.$refs.paths.length > 0) {
          const path = this.$refs.paths[this.$refs.paths.length - 1];

          path.focus();
        }
        this.update();
      });
    },
    removePath(idx) {
      const neu = [...this.paths];

      neu.splice(idx, 1);
      this.paths = neu;
      this.update();
    },
    removeRule() {
      this.$emit('remove');
    },
    focus() {
      this.$refs.host.focus();
    },
    makePathKey(i) {
      return JSON.stringify(this.paths[i]);
    }
  },
};
</script>

<template>
  <div class="rule">
    <div class="row mb-20">
      <div
        id="host"
        class="col span-6"
      >
        <LabeledInput
          ref="host"
          v-model="host"
          :label="t('ingress.rules.requestHost.label')"
          :placeholder="t('ingress.rules.requestHost.placeholder')"
          :rules="rules.requestHost"
          @input="update"
        />
      </div>
      <div
        id="spacer"
        class="col span-5"
      />
    </div>
    <div class="rule-path-headings row">
      <div
        class="col"
        :class="{'span-6': ingress.showPathType, 'span-4': !ingress.showPathType}"
      >
        <label>{{ t("ingress.rules.path.label") }}</label>
      </div>
      <div
        class="col"
        :class="{'span-3': ingress.showPathType, 'span-4': !ingress.showPathType}"
      >
        <label>{{ t("ingress.rules.target.label") }}</label>
      </div>
      <div
        class="col"
        :class="{'span-2': ingress.showPathType, 'span-3': !ingress.showPathType}"
        :style="{ 'margin-right': '0px' }"
      >
        <label>{{ t("ingress.rules.port.label") }}</label>
      </div>
      <div class="col" />
    </div>
    <template v-for="(path, i) in paths">
      <RulePath
        ref="paths"
        :key="path.id"
        v-model="paths[i]"
        class="row mb-10"
        :rule-mode="ruleMode"
        :service-targets="serviceTargets"
        :ingress="ingress"
        :rules="{path: rules.path, port: rules.port, target: rules.target}"
        @remove="(e) => removePath(i)"
        @input="update"
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

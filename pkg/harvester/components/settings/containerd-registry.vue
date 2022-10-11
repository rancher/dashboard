<script>
import { LabeledInput } from '@components/Form/LabeledInput';
import { _EDIT } from '@shell/config/query-params';
import { randomStr } from '@shell/utils/string';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import KeyValue from '@shell/components/form/KeyValue';
import InfoBox from '@shell/components/InfoBox';
import { clone } from '@shell/utils/object';

export default {
  name: 'HarvesterContainerdRegistry',

  components: {
    InfoBox,
    KeyValue,
    LabeledInput,
    LabeledSelect,
  },

  props: {
    mode: {
      type:    String,
      default: _EDIT,
    },

    value: {
      type:    Object,
      default: () => {
        return {};
      },
    },

    registerBeforeHook: {
      type:     Function,
      required: true,
    },
  },

  data() {
    const originMirror = {
      Endpoints: [],
      Rewrites:  {}
    };

    const originConfig = {
      Auth: {
        Username:      '',
        Password:      '',
        Auth:          '',
        IdentityToken: ''
      },
      TLS: { InsecureSkipVerify: false }
    };

    let originValue = {};
    const baseValue = {
      Mirrors: { '': clone(originMirror) },
      Configs: {}
    };

    try {
      originValue = JSON.parse(this.value.value);
    } catch (error) {
      originValue = baseValue;
    }

    if (!Object.keys(originValue).length) {
      originValue = baseValue;
    }

    const _mirrors = originValue.Mirrors || {};
    const _configs = originValue.Configs || {};
    const mirrorsKeys = Object.keys(_mirrors);
    const configsKeys = Object.keys(_configs);
    const mirrors = mirrorsKeys.map((key) => {
      return {
        key,
        value: originValue.Mirrors[key],
        idx:   randomStr(5).toLowerCase()
      };
    });

    const configs = configsKeys.map((key) => {
      if (!originValue.Configs[key]?.Auth) {
        originValue.Configs[key].Auth = originConfig.Auth;
      }

      return {
        key,
        value: originValue.Configs[key],
        idx:   randomStr(5).toLowerCase()
      };
    });

    return {
      mirrors,
      configs,
      originMirror,
      originConfig,
      mirrorsKeys,
      configsKeys,
      errors: [],
    };
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.willSave, 'willSave');
    }
  },

  computed: {
    insecureSkipVerifyOption() {
      return [{
        label: 'True',
        value: true
      }, {
        label: 'False',
        value: false
      }];
    },
  },

  methods: {
    willSave() {
      const errors = [];

      if (this.value.value) {
        try {
          JSON.parse(this.value.value);

          this.mirrors.forEach((mirror) => {
            if (!mirror.key) {
              errors.push(this.t('validation.required', { key: this.t('harvester.setting.containerdRegistry.mirrors.registryName') }, true));
            }

            if (mirror.value.Endpoints.length === 0) {
              errors.push(this.t('validation.required', { key: this.t('harvester.setting.containerdRegistry.mirrors.endpoints') }, true));
            }
          });

          this.configs.forEach((config) => {
            if (!config.key) {
              errors.push(this.t('validation.required', { key: this.t('harvester.setting.containerdRegistry.configs.registryEDQNorIP') }, true));
            }
          });
        } catch (e) {

        }
      }

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },

    update() {
      const _mirrors = {};
      const _configs = {};

      this.mirrors.forEach((mirror) => {
        _mirrors[mirror.key] = mirror.value;
      });

      this.configs.forEach((config) => {
        _configs[config.key] = config.value;
      });

      const out = {
        Mirrors: _mirrors,
        Configs: _configs
      };

      if (!Object.keys(_mirrors).length) {
        delete out.Mirrors;
      }

      if (!Object.keys(_configs).length) {
        delete out.Configs;
      }

      const value = Object.keys(out).length ? JSON.stringify(out) : '';

      this.$set(this.value, 'value', value);
    },

    addMirror() {
      this.mirrors.push({
        key: '', value: clone(this.originMirror), idx: randomStr(5).toLowerCase()
      });
      this.update();
    },

    addConfig() {
      this.configs.push({
        key: '', value: clone(this.originConfig), idx: randomStr(5).toLowerCase()
      });
      this.update();
    },

    remove(type, idx) {
      this[type].splice(idx, 1);
      this.update();
    }
  },

  watch: {
    value: {
      handler(value) {
        if (!value.value) { // useDefaultVale
          this.$set(this, 'mirrors', []);
          this.$set(this, 'configs', []);
          this.update();
        }
      },
      deep: true,
    }
  }
};
</script>

<template>
  <div>
    <h3>{{ t('harvester.setting.containerdRegistry.mirrors.mirrors') }}</h3>
    <div>
      <InfoBox v-for="mirror, idx in mirrors" :key="mirror.idx" class="box">
        <button type="button" class="role-link btn btn-sm remove" @click="remove('mirrors', idx)">
          <i class="icon icon-2x icon-x" />
        </button>

        <div class="row mb-20">
          <div class="col span-12">
            <LabeledInput
              v-model="mirror.key"
              :mode="mode"
              required
              label-key="harvester.setting.containerdRegistry.mirrors.registryName"
              @keydown.native.enter.prevent="()=>{}"
              @input="update"
            />
          </div>
        </div>

        <div class="mb-20">
          <LabeledSelect
            :key="mirror.idx"
            v-model="mirror.value.Endpoints"
            :mode="mode"
            required
            label-key="harvester.setting.containerdRegistry.mirrors.endpoints"
            :multiple="true"
            :taggable="true"
            :searchable="true"
            :options="[]"
            @keydown.native.enter.prevent="()=>{}"
            @input="update"
          />
        </div>

        <div class="row mb-20">
          <KeyValue
            v-model="mirror.value.Rewrites"
            :add-label="t('harvester.setting.containerdRegistry.mirrors.rewrite.addRewrite')"
            :mode="mode"
            :title="t('harvester.setting.containerdRegistry.mirrors.rewrite.rewrite')"
            :read-allowed="false"
            :value-can-be-empty="true"
            @keydown.native.enter.prevent="()=>{}"
            @input="update"
          />
        </div>
      </infobox>
    </div>

    <button class="btn btn-sm role-primary" @click.self="addMirror">
      {{ t('harvester.setting.containerdRegistry.mirrors.addMirror') }}
    </button>

    <hr class="divider mt-20 mb-20" />

    <h3>{{ t('harvester.setting.containerdRegistry.configs.configs') }}</h3>
    <div>
      <InfoBox v-for="config, idx in configs" :key="config.idx" class="box">
        <button type="button" class="role-link btn btn-sm remove" @click="remove('configs', idx)">
          <i class="icon icon-2x icon-x" />
        </button>

        <div class="row mb-20">
          <div class="col span-12">
            <div class="col span-12">
              <LabeledInput
                v-model="config.key"
                :mode="mode"
                :placeholder="t('harvester.setting.containerdRegistry.configs.registryPlaceholder')"
                label-key="harvester.setting.containerdRegistry.configs.registryEDQNorIP"
                @input="update"
              />
            </div>
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="config.value.Auth.Username"
              :mode="mode"
              label-key="harvester.setting.containerdRegistry.configs.username"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="config.value.Auth.Password"
              :mode="mode"
              label-key="harvester.setting.containerdRegistry.configs.password"
              @input="update"
            />
          </div>
        </div>

        <div class="row mb-20">
          <div class="col span-6">
            <LabeledInput
              v-model="config.value.Auth.Auth"
              :mode="mode"
              type="multiline"
              :min-height="150"
              label-key="harvester.setting.containerdRegistry.configs.auth"
              @input="update"
            />
          </div>

          <div class="col span-6">
            <LabeledInput
              v-model="config.value.Auth.IdentityToken"
              :mode="mode"
              type="multiline"
              :min-height="150"
              label-key="harvester.setting.containerdRegistry.configs.identityToken"
              @input="update"
            />
          </div>
        </div>

        <div class="row">
          <LabeledSelect
            v-model="config.value.TLS.InsecureSkipVerify"
            :mode="mode"
            label-key="harvester.setting.containerdRegistry.configs.insecureSkipVerify"
            :options="insecureSkipVerifyOption"
            @input="update"
          />
        </div>
      </infobox>

      <button class="btn btn-sm role-primary" @click="addConfig">
        {{ t('harvester.setting.containerdRegistry.configs.addConfig') }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box {
  position: relative;
  padding-top: 40px;
}
.remove {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 0px;
}
</style>

<script>
import Tab from '@shell/components/Tabbed/Tab';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Tabbed from '@shell/components/Tabbed';
import KeyValue from '@shell/components/form/KeyValue';
import { _VIEW } from '@shell/config/query-params';
import jsyaml from 'js-yaml';
import cloneDeep from 'lodash/cloneDeep';
import merge from 'lodash/merge';
import GpuResources from './GpuResources.vue';
const defaultConfig = {
  version: 'v1',
  sharing: {
    timeSlicing: {
      renameByDefault:            false,
      failRequestsGreaterThanOne: false,
      resources:                  [] // { name: '', replicas: 1 }
    }
  },
  flags: {
    migStrategy:      'none', // none,single,mixed
    failOnInitError:  true,
    nvidiaDriverRoot: '/',
    plugin:           {
      passDeviceSpecs:    false,
      deviceListStrategy: 'envvar', // envvar|volume-mounts
      deviceIDStrategy:   'uuid', // uuid | index
    }
  }
};

export default {
  components: {
    Tabbed,
    Tab,
    LabeledInput,
    Checkbox,
    LabeledSelect,
    KeyValue,
    GpuResources,
  },
  hasTabs: true,
  props:   {
    value: {
      type:    Object,
      default: () => {
        return {};
      }
    },
    mode: {
      type:    String,
      default: 'create',
    },
  },
  data() {
    return {
      selectedDefaultConfig: true,
      configs:               [],
      lastIdx:               0,
      migStrategies:         [
        { label: 'None', value: 'none' },
        { label: 'Single', value: 'single' },
        { label: 'Mixed', value: 'mixed' }
      ],
      deviceListStrategies: [
        { label: 'EnvVar', value: 'envvar' },
        { label: 'Volume Mounts', value: 'volume-mounts' }
      ],
      deviceIDStrategies: [
        { label: 'UUID', value: 'uuid' },
        { label: 'Index', value: 'index' }
      ],
      sharedAccessEnabledMap: {}
    };
  },
  computed: {
    isView() {
      return this.mode === _VIEW;
    },
    gfdImageRepo: {
      get() {
        return this.value.gfd?.image?.repository ?? '';
      },
      set(v) {
        if (!this.value.gfd.image) {
          this.$set(this.value.gfd, 'image', { repository: v });
        } else {
          this.$set(this.value.gfd.image, 'repository', v);
        }
      },
    },
    gfdImageTag: {
      get() {
        return this.value.gfd?.image?.tag ?? '';
      },
      set(v) {
        if (!this.value.gfd.image) {
          this.$set(this.value.gfd, 'image', { tag: v });
        } else {
          this.$set(this.value.gfd.image, 'tag', v);
        }
      },
    },
    nfdImageRepo: {
      get() {
        return this.value.nfd?.image?.repository ?? '';
      },
      set(v) {
        if (!this.value.nfd.image) {
          this.$set(this.value.nfd, 'image', { repository: v });
        } else {
          this.$set(this.value.nfd.image, 'repository', v);
        }
      },
    },
    nfdImageTag: {
      get() {
        return this.value.nfd?.image?.tag ?? '';
      },
      set(v) {
        if (!this.value.nfd.image) {
          this.$set(this.value.nfd, 'image', { tag: v });
        } else {
          this.$set(this.value.nfd.image, 'tag', v);
        }
      },
    },
  },
  watch: {
    configs: {
      handler() {
        this.syncConfigs();
      },
      deep: true,
    },
  },
  created() {
    this.$emit('register-before-hook', this.validateBeforeSave);
    this.updateConfigs();
    this.syncConfigs();
    this.initLastIndex();
  },
  methods: {
    validateBeforeSave() {
      if (this.configs.length === 0) {
        return Promise.reject(new Error(`'Device Plugin Options' is Required`));
      }
      const allNames = this.configs.map(c => c.name);

      if (allNames.some(item => item.trim() === '')) {
        return Promise.reject(new Error('Config name is required'));
      }
      const names = new Set(allNames);

      if (names.size === allNames.length) {
        return Promise.resolve(true);
      }
      const duplicateNames = [];

      names.forEach((n) => {
        if (allNames.indexOf(n) !== allNames.lastIndexOf(n)) {
          duplicateNames.push(n);
        }
      });

      return Promise.reject(new Error(`Duplicate configuration name${ duplicateNames.length > 1 ? 's' : '' } (${ duplicateNames.join(', ') }) in 'Device Plugin Options'`));
    },
    initLastIndex() {
      const indexReg = /^config(\d+)$/;
      const indexes = Object.keys(this.value.config.map).reduce((t, c) => {
        const i = indexReg.exec(c);

        if (i?.length === 2) {
          t.push(parseInt(i[1]));
        }

        return t;
      }, []);

      if ( indexes.length === 0 ) {
        this.lastIdx = 0;

        return;
      }
      this.lastIdx = Math.max(...indexes);
    },
    updateConfigs() {
      this.sharedAccessEnabledMap = {};
      const configs = Object.entries(this.value.config.map)
        .map(([name, value]) => {
          const config = {
            id: name, name, config: {}, error: null
          };

          try {
            const v = jsyaml.load(value);

            merge(config.config, cloneDeep(defaultConfig), v);
          } catch (error) {
            config.error = error;
          }

          return config;
        });
      const index = configs.findIndex(c => c.name === 'default');

      if (index > -1) {
        const d = configs.splice(index, 1);

        configs.unshift(d[0]);
      } else {
        configs.unshift({
          name:   'default',
          id:     'default',
          config: cloneDeep(defaultConfig)
        });
      }
      configs.forEach((c) => {
        let enabled = false;

        if (c.config?.sharing?.timeSlicing?.resources?.length > 0) {
          enabled = true;
        }
        this.$set(this.sharedAccessEnabledMap, c.id, enabled);
      });
      this.configs = configs;
    },
    syncConfigs() {
      this.value.config.map = this.configs.reduce((t, c) => {
        try {
          const config = cloneDeep(c.config);

          if (!this.sharedAccessEnabledMap[c.id] || config.sharing?.timeSlicing?.resources?.length === 0) {
            delete config.sharing;
          }
          t[c.name] = jsyaml.dump(config);
        } catch (e) {
        }

        return t;
      }, {});
    },
    addConfig() {
      const configs = this.configs;

      if (configs.length === 0) {
        const name = 'default';
        const c = {
          name,
          id:     name,
          config: cloneDeep(defaultConfig)
        };

        configs.push(c);
        this.$set(this.sharedAccessEnabledMap, c.id, false);
        this.$nextTick(() => {
          if ( this.$refs.configs?.select ) {
            this.$refs.configs.select(name);
          }
        });

        return;
      }
      // if (configs[idx]) {
      //   const c = cloneDeep(configs[idx]);
      //   const name = `config${ ++this.lastIdx }`;

      //   c.name = name;
      //   c.id = name;
      //   configs.push(c);
      //   this.$set(this.sharedAccessEnabledMap, c.id, false);
      //   this.$nextTick(() => {
      //     if ( this.$refs.configs?.select ) {
      //       this.$refs.configs.select(name);
      //     }
      //   });

      //   return;
      // }
      const name = `config${ ++this.lastIdx }`;
      const c = {
        name,
        id:     name,
        config: cloneDeep(defaultConfig)
      };

      configs.push(c);
      this.$set(this.sharedAccessEnabledMap, c.id, false);
      this.$nextTick(() => {
        if ( this.$refs.configs?.select ) {
          this.$refs.configs.select(name);
        }
      });
    },
    removeConfig(idx) {
      const [c] = this.configs.splice(idx, 1);

      this.$delete(this.sharedAccessEnabledMap, c.id);
    },
    handleConfigTabChange({ tab }) {
      this.selectedDefaultConfig = tab.name === 'default';
    },
    updateResources(r, c) {
      c.config.sharing.timeSlicing.resources = r.filter(item => item.name && item.replicas);
    },
  }
};
</script>
<template>
  <div>
    <Tab
      name="container-images"
      :label="t('rancher-nvidia-k8s-device-plugin.titles.image')"
      :weight="4"
    >
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="value.image.repository"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.repository.label')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="value.image.tag"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.tag.label')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="gfdImageRepo"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.gfdRepository.label')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="gfdImageTag"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.gfdTag.label')"
            :mode="mode"
          />
        </div>
      </div>
      <div class="row mb-10">
        <div class="col span-6">
          <LabeledInput
            v-model="nfdImageRepo"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.nfdRepository.label')"
            :mode="mode"
          />
        </div>
        <div class="col span-6">
          <LabeledInput
            v-model="nfdImageTag"
            :label="t('rancher-nvidia-k8s-device-plugin.containerImage.nfdTag.label')"
            :mode="mode"
          />
        </div>
      </div>
    </Tab>
    <Tab
      name="device-plugin-options"
      :label="t('rancher-nvidia-k8s-device-plugin.titles.plugin')"
      :weight="3"
    >
      <div class="mt-40 ml-20">
        <Tabbed
          ref="configs"
          :side-tabs="true"
          @changed="handleConfigTabChange"
        >
          <template #tab-row-extras>
            <div class="side-tablist-controls">
              <button
                v-if="!isView"
                type="button"
                class="btn-sm role-link"
                @click="addConfig"
              >
                {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.addConfig') }}
              </button>
            </div>
          </template>
          <template v-for="(c, index) in configs">
            <Tab
              :key="c.id"
              :name="c.id"
              :label="c.name"
              :weight="-index"
            >
              <template
                #tab-header-right
                class="tab-content-controls"
              >
                <button
                  v-if="c.id !== 'default' && !isView"
                  type="button"
                  class="btn-sm role-link"
                  @click="removeConfig(index)"
                >
                  {{ t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.removeConfig') }}
                </button>
              </template>
              <div
                v-if="c.id !== 'default'"
                class="row mb-10"
              >
                <div class="col span-6">
                  <LabeledInput
                    v-model="c.name"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.configName.label')"
                    :mode="mode"
                  />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledSelect
                    v-model="c.config.flags.migStrategy"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.migStrategy.label')"
                    :mode="mode"
                    :options="migStrategies"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.migStrategy.tip', {}, true)" />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <Checkbox
                    v-model="c.config.flags.failOnInitError"
                    :mode="mode"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.failOnInitError.label')"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.failOnInitError.tip', {}, true)" />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledInput
                    v-model="c.config.flags.nvidiaDriverRoot"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.nvidiaDriverRoot.label')"
                    :mode="mode"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.nvidiaDriverRoot.tip', {}, true)" />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <Checkbox
                    v-model="c.config.flags.plugin.passDeviceSpecs"
                    :mode="mode"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.passDeviceSpecs.label')"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.passDeviceSpecs.tip', {}, true)" />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledSelect
                    v-model="c.config.flags.plugin.deviceListStrategy"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.deviceListStrategy.label')"
                    :mode="mode"
                    :options="deviceListStrategies"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.deviceListStrategy.tip', {}, true)" />
                </div>
              </div>
              <div class="row mb-10">
                <div class="col span-6">
                  <LabeledSelect
                    v-model="c.config.flags.plugin.deviceIDStrategy"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.deviceIDStrategy.label')"
                    :mode="mode"
                    :options="deviceIDStrategies"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.deviceIDStrategy.tip', {}, true)" />
                </div>
              </div>
              <hr class="mb-20 mt-20">
              <div class="row mb-10">
                <div class="col span-6">
                  <Checkbox
                    v-model="sharedAccessEnabledMap[c.id]"
                    :mode="mode"
                    :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.sharedAccess.label')"
                  />
                </div>
                <div class="col span-6">
                  <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.sharedAccess.tip', {}, true)" />
                </div>
              </div>
              <div v-show="sharedAccessEnabledMap[c.id]">
                <div class="row mb-10">
                  <div class="col span-6">
                    <Checkbox
                      v-model="c.config.sharing.timeSlicing.renameByDefault"
                      :mode="mode"
                      :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.renameByDefault.label')"
                    />
                  </div>
                </div>
                <div class="row mb-10">
                  <div class="col span-6">
                    <Checkbox
                      v-model="c.config.sharing.timeSlicing.failRequestsGreaterThanOne"
                      :mode="mode"
                      :label="t('rancher-nvidia-k8s-device-plugin.devicePluginOptions.failRequestsGreaterThanOne.label')"
                    />
                  </div>
                </div>
                <div class="row mb-10">
                  <div class="col span-6">
                    <GpuResources
                      :value="c.config.sharing.timeSlicing.resources"
                      :mode="mode"
                      @input="updateResources($event, c)"
                    />
                  </div>
                </div>
              </div>
            </Tab>
          </template>
        </Tabbed>
      </div>
    </Tab>
    <Tab
      name="gfd-options"
      :label="t('rancher-nvidia-k8s-device-plugin.titles.gfd')"
      :weight="2"
    >
      <div class="row">
        <div class="col span-6">
          <Checkbox
            v-model="value.gfd.enabled"
            :mode="mode"
            :label="t('rancher-nvidia-k8s-device-plugin.gfdOptions.enabled.label')"
          />
        </div>
        <div class="col span-6">
          <span v-clean-html="t('rancher-nvidia-k8s-device-plugin.gfdOptions.enabled.tip', {}, true)" />
        </div>
      </div>
    </Tab>
    <Tab
      name="schedule-options"
      :label="t('rancher-nvidia-k8s-device-plugin.titles.schedule')"
      :weight="1"
    >
      <div class="row">
        <div class="col span-10">
          <KeyValue
            v-model="value.nodeSelector"
            :add-label="t('labels.addLabel')"
            :mode="mode"
            :title="t('rancher-nvidia-k8s-device-plugin.scheduleOptions.nodeSelector.title')"
            :read-allowed="false"
            :value-can-be-empty="true"
          />
        </div>
      </div>
    </Tab>
  </div>
</template>
<style scoped>
.side-tablist-controls {
  border-top: 1px solid var(--border);
  padding: 15px;
}
</style>

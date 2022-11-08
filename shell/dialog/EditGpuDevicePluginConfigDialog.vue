<template>
  <div>
    <Card class="edit-gpu-device-plugin-config-dialog" :show-highlight-border="false">
      <h4 slot="title" class="text-default-text">
        {{ t('editGpuDevicePluginConfigDialog.title', { name: nodeName }) }}
      </h4>
      <div slot="body" class="pr-10 pl-10" style="min-height: 300px;">
        <h5>{{ t('editGpuDevicePluginConfigDialog.subtitle') }}</h5>
        <div class="mb-20 row">
          <div class="col span-6">
            <LabeledSelect
              v-model="config"
              :label="t('editGpuDevicePluginConfigDialog.config.label')"
              :placeholder="t('editGpuDevicePluginConfigDialog.config.placeholder')"
              :options="configs"
              clearable
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-12">
            <YamlEditor
              v-if="configContent"
              ref="yamlEditor"
              class="yaml-editor"
              :value="configContent"
              editor-mode="VIEW_CODE"
            />
          </div>
        </div>
      </div>
      <div slot="actions" class="bottom">
        <Banner v-for="(err, i) in errors" :key="i" color="error" :label="err" />
        <div class="buttons">
          <button class="mr-10 btn role-secondary" @click="close">
            {{ t('generic.cancel') }}
          </button>
          <AsyncButton
            :disabled="loading || !pluginConfigMap"
            @click="save"
          />
        </div>
      </div>
    </Card>
  </div>
</template>

<script>
import { Card } from '@components/Card';
import AsyncButton from '@shell/components/AsyncButton';
import { Banner } from '@components/Banner';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { stringify } from '@shell/utils/error';
import { CONFIG_MAP } from '@shell/config/types';
import YamlEditor from '@shell/components/YamlEditor';
const pluginConfigMapId = 'nvidia-device-plugin/rancher-nvidia-k8s-device-plugin-configs';
const pluginConfigLabelKey = 'nvidia.com/device-plugin.config';

export default {
  props: {
    resources: {
      type:     Array,
      required: true
    },
  },
  data() {
    return {
      loading:         false,
      errors:          [],
      pluginConfigMap: null,
      config:          '',
      model:           null,
    };
  },
  async fetch() {
    const inStore = this.$store.getters['currentStore'](this.$route.params.resource);

    this.model = await this.$store.dispatch(`${ inStore }/clone`, { resource: this.node });
    try {
      this.pluginConfigMap = await this.$store.dispatch('cluster/find', { type: CONFIG_MAP, id: pluginConfigMapId });
    } catch (err) {
      this.errors = [stringify(err)];
    }
    this.config = this.model.metadata?.labels?.[pluginConfigLabelKey] ?? 'default';
  },
  computed: {
    node() {
      return this.resources?.[0];
    },
    nodeName() {
      return this.model?.metadata?.name;
    },
    configs() {
      const options = Object.keys(this.pluginConfigMap?.data ?? {}).map(item => ({
        label:   item,
        value:   item,
        content: this.pluginConfigMap?.data[item],
      }));

      return options;
    },
    configContent() {
      const config = this.config;
      const c = this.configs.find(item => item.value === config);

      if (!c) {
        return '';
      }

      return c.content;
    },
    nodeGpuPluginConfigLabel() {
      return this.model?.metadata?.labels[pluginConfigLabelKey];
    }
  },
  watch: {
    nodeGpuPluginConfigLabel: {
      handler(v) {
        this.config = v;
      },
      immediate: true
    },
    configContent(v) {
      this.$refs.yamlEditor?.updateValue(v);
    }
  },
  methods: {
    close() {
      this.$emit('close');
    },
    async save(buttonDone) {
      this.loading = true;
      try {
        if (!this.config || this.config === 'default') {
          if (this.model.metadata?.labels) {
            delete this.model.metadata.labels[pluginConfigLabelKey];
          }
        } else {
          if (!this.model.metadata.labels) {
            this.model.metadata.labels = {};
          }
          this.model.metadata.labels[pluginConfigLabelKey] = this.config;
        }
        await this.model.save();
        buttonDone(true);
        this.close();
      } catch (err) {
        buttonDone(false);
        if (err.status === 403) {
          this.errors = [this.t('editGpuDevicePluginConfigDialog.errors.noPermission')];
        } else {
          this.errors = [stringify(err)];
        }
      }
      this.loading = false;
    },
  },
  components: {
    Card,
    AsyncButton,
    Banner,
    LabeledSelect,
    YamlEditor
  }
};
</script>
<style lang="scss" scoped>
.edit-gpu-device-plugin-config-dialog {
  margin: 0;
  .bottom {
    display: block;
    width: 100%;
  }
  .banner {
    margin-top: 0
  }
  .buttons {
    display: flex;
    justify-content: flex-end;
    width: 100%;
  }
}
</style>

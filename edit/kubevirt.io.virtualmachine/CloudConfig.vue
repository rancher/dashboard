<script>
import { mapGetters } from 'vuex';
import YamlEditor, { EDITOR_MODES } from '@/components/YamlEditor';
import { _CREATE, _EDIT } from '@/config/query-params';
import { CONFIG_MAP } from '@/config/types';
import Select from '@/components/form/Select';
import { HCI } from '@/config/labels-annotations';

export default {
  components: { YamlEditor, Select },

  props: {
    userScript: {
      type:    String,
      default: ''
    },
    networkScript: {
      type:    String,
      default: ''
    },
    mode: {
      type:    String,
      default: 'create'
    }
  },

  async fetch() {
    this.configmaps = await this.$store.dispatch('cluster/findAll', { type: CONFIG_MAP });
  },

  data() {
    return {
      userData:         this.userScript,
      networkData:      this.networkScript,
      cloudInitUser:    '',
      cloudInitNetwork: '',
      configmaps:       []
    };
  },

  computed: {
    editorMode() {
      return (this.isCreate || this.isEdit) ? EDITOR_MODES.EDIT_CODE : EDITOR_MODES.VIEW_CODE;
    },
    isCreate() {
      return this.mode === _CREATE;
    },
    isEdit() {
      return this.mode === _EDIT;
    },
    cloudInitConfigs() {
      const out = {
        user:    [],
        network: []
      };

      for (const m of this.configmaps) {
        const template = m.metadata?.labels?.[HCI.CLOUD_INIT];
        const isUser = template === 'user';
        const isNetwork = template === 'network';
        let item;

        if (!!template) {
          item = {
            label: m.metadata?.name,
            value: m.data.cloudInit
          };
        }

        if (isUser) {
          out.user.push(item);
        }

        if (isNetwork) {
          out.network.push(item);
        }
      }

      out.user.unshift({
        label: this.t('harvester.vmPage.cloudConfig.cloudInit.placeholder'),
        value: ''
      });

      out.network.unshift({
        label: this.t('harvester.vmPage.cloudConfig.cloudInit.placeholder'),
        value: ''
      });

      return out;
    },
    ...mapGetters({ t: 'i18n/t' })
  },

  watch: {
    userScript(neu) {
      this.userData = neu;
    },

    networkData(neu) {
      this.networkData = neu;
    },

    cloudInitUser(neu) {
      if (!neu) {
        this.userData = '';

        return;
      }

      this.userData = neu;
    },

    cloudInitNetwork(neu) {
      if (!neu) {
        this.networkData = '';

        return;
      }

      this.networkData = neu;
    },
  },

  methods: {
    update() {
      this.$emit('updateCloudConfig', this.userData, this.networkData);
    },
    onChanges(cm, changes) {
      this.update();
      if ( changes.length !== 1 ) {
        return;
      }

      const change = changes[0];

      if ( change.from.line !== change.to.line ) {
        return;
      }

      let line = change.from.line;
      let str = cm.getLine(line);
      let maxIndent = indentChars(str);

      if ( maxIndent === null ) {
        return;
      }

      cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

      while ( line > 0 ) {
        line--;
        str = cm.getLine(line);
        const indent = indentChars(str);

        if ( indent === null ) {
          break;
        }

        if ( indent < maxIndent ) {
          cm.replaceRange('', { line, ch: 0 }, { line, ch: 1 }, '+input');

          if ( indent === 0 ) {
            break;
          }

          maxIndent = indent;
        }
      }

      function indentChars(str) {
        const match = str.match(/^#(\s+)/);

        if ( match ) {
          return match[1].length;
        }

        return null;
      }
    },
    refresh() {
      this.$refs.yamlUser.refresh();
      this.$refs.yamlNetwork.refresh();
    },
  }
};
</script>

<template>
  <div @input="update">
    <h2>{{ t('harvester.vmPage.cloudConfig.title') }}</h2>
    <div class="mb-20">
      <h3>{{ t('harvester.vmPage.cloudConfig.userData.title') }}</h3>
      <h5>
        <t k="harvester.vmPage.cloudConfig.userData.tip" :raw="true" />
      </h5>

      <div class="row mb-20">
        <div class="col span-3">
          <Select v-if="isCreate || isEdit" v-model="cloudInitUser" :clearable="true" :options="cloudInitConfigs.user" />
        </div>
      </div>

      <div class="resource-yaml">
        <YamlEditor
          ref="yamlUser"
          v-model="userData"
          class="yaml-editor"
          :editor-mode="editorMode"
          @onChanges="onChanges"
        />
      </div>
    </div>

    <div>
      <h3>{{ t('harvester.vmPage.cloudConfig.networkData.title') }}</h3>
      <h5>
        <t k="harvester.vmPage.cloudConfig.networkData.tip" :raw="true" />
      </h5>

      <div class="row mb-20">
        <div class="col span-3">
          <Select v-if="isCreate || isEdit" v-model="cloudInitNetwork" :clearable="true" :options="cloudInitConfigs.network" />
        </div>
      </div>

      <div class="resource-yaml">
        <YamlEditor
          ref="yamlNetwork"
          v-model="networkData"
          class="yaml-editor"
          :editor-mode="editorMode"
          @onChanges="onChanges"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$yaml-height: 200px;

.resource-yaml {
  flex: 1;
  display: flex;
  flex-direction: column;

  & .yaml-editor{
    flex: 1;
    min-height: $yaml-height;
    & .code-mirror .CodeMirror {
      position: initial;
      height: auto;
      min-height: $yaml-height;
    }
  }

  footer .actions {
    text-align: center;
  }
}
</style>

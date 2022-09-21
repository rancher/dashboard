<script>
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import YamlEditor from '@shell/components/YamlEditor';

import CreateEditView from '@shell/mixins/create-edit-view';
import { HCI } from '@shell/config/labels-annotations';

export default {
  name: 'HarvesterEditCloudTemplate',

  components: {
    Tab,
    Tabbed,
    YamlEditor,
    CruResource,
    LabeledSelect,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  data() {
    return {
      config: this.value.data?.cloudInit || '',
      type:   this.value?.metadata?.labels?.[HCI.CLOUD_INIT] || 'user',
    };
  },

  computed: {
    types() {
      return [{
        label: 'User Data',
        value: 'user'
      }, {
        label: 'Network Data',
        value: 'network'
      }];
    },
  },

  created() {
    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateBeforeSave);
    }
  },

  methods: {
    update() {
      this.value.data = { cloudInit: this.config };
    },

    updateBeforeSave() {
      if (this.isCreate) {
        this.value.metadata.labels = {
          ...this.value.metadata.labels,
          [HCI.CLOUD_INIT]: this.type,
        };

        this.value.data = { cloudInit: this.config };
      }
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="true"
    />

    <Tabbed :side-tabs="true">
      <Tab name="basics" :label="t('harvester.host.tabs.basics')" :weight="1">
        <div class="mb-20">
          <LabeledSelect
            v-model="type"
            :label="t('harvester.cloudTemplate.templateType')"
            :disabled="!isCreate"
            :options="types"
          />
        </div>

        <div class="resource-yaml">
          <YamlEditor
            ref="yamlUser"
            v-model="config"
            class="yaml-editor"
            :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
            @onChanges="update"
          />
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
  $yaml-height: 200px;

  ::v-deep .yaml-editor{
    flex: 1;
    min-height: $yaml-height;
    & .code-mirror .CodeMirror {
      position: initial;
      height: auto;
      min-height: $yaml-height;
    }
  }
</style>

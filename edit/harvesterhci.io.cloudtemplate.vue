<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';
import YamlEditor from '@/components/YamlEditor';

import CreateEditView from '@/mixins/create-edit-view';
import { HCI } from '@/config/labels-annotations';

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

  methods: {
    async saveConfig(buttonCb) {
      if (this.isCreate) {
        this.value.metadata.labels = {
          ...this.value.metadata.labels,
          [HCI.CLOUD_INIT]: this.type,
          [HCI.CREATOR]:    this.$cookies.get('username') || ''
        };
      }

      await this.save(buttonCb);
    },

    update() {
      this.value.data = { cloudInit: this.config };
    },
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :can-yaml="false"
    :errors="errors"
    @finish="saveConfig"
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

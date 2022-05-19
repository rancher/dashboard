<script>
import Tab from '@shell/components/Tabbed/Tab';
import CruResource from '@shell/components/CruResource';
import UnitInput from '@shell/components/form/UnitInput';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { get } from '@shell/utils/object';
import { HCI } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { saferDump } from '@shell/utils/create-yaml';
import { InterfaceOption } from '@shell/config/harvester-map';
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';

export default {
  name: 'HarvesterVolume',

  components: {
    Tab,
    UnitInput,
    CruResource,
    ResourceTabs,
    LabeledSelect,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    await this.$store.dispatch('harvester/findAll', { type: HCI.IMAGE });
  },

  data() {
    if (this.mode === _CREATE) {
      this.value.spec.volumeMode = 'Block';
      this.value.spec.accessModes = ['ReadWriteMany'];
    }

    const storage = this.value?.spec?.resources?.requests?.storage || null;
    const imageId = get(this.value, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_ID }"`);
    const source = !imageId ? 'blank' : 'url';

    return {
      source,
      storage,
      imageId,
    };
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  computed: {
    isBlank() {
      return this.source === 'blank';
    },

    isVMImage() {
      return this.source === 'url';
    },

    sourceOption() {
      return [{
        value: 'blank',
        label: this.t('harvester.volume.sourceOptions.new')
      }, {
        value: 'url',
        label: this.t('harvester.volume.sourceOptions.vmImage')
      }];
    },

    interfaceOption() {
      return InterfaceOption;
    },

    imageOption() {
      const choices = this.$store.getters['harvester/all'](HCI.IMAGE);

      return sortBy(
        choices
          .filter(obj => obj.isReady)
          .map((obj) => {
            return {
              label: obj.spec.displayName,
              value: obj.id
            };
          }),
        'label'
      );
    },
  },

  methods: {
    willSave() {
      this.update();
    },
    update() {
      let imageAnnotations = '';
      let storageClassName = 'longhorn';

      if (this.isVMImage && this.imageId) {
        imageAnnotations = {
          ...this.value.metadata.annotations,
          [HCI_ANNOTATIONS.IMAGE_ID]: this.imageId
        };
        storageClassName = `longhorn-${ this.imageId.split('/')[1] }`;
      } else {
        imageAnnotations = { ...this.value.metadata.annotations };
      }

      const spec = {
        ...this.value.spec,
        resources: { requests: { storage: this.storage } },
        storageClassName
      };

      this.value.setAnnotations(imageAnnotations);

      this.$set(this.value, 'spec', spec);
    },

    generateYaml() {
      const out = saferDump(this.value);

      return out;
    },
  }
};
</script>

<template>
  <div>
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :errors="errors"
      :generate-yaml="generateYaml"
      :apply-hooks="applyHooks"
      @finish="save"
    >
      <NameNsDescription :value="value" :namespaced="true" :mode="mode" />

      <ResourceTabs
        v-model="value"
        class="mt-15"
        :need-conditions="false"
        :need-related="false"
        :side-tabs="true"
        :mode="mode"
      >
        <Tab name="basic" :label="t('harvester.volume.tabs.basics')" :weight="3" class="bordered-table">
          <LabeledSelect
            v-model="source"
            :label="t('harvester.volume.source')"
            :options="sourceOption"
            :disabled="!isCreate"
            required
            :mode="mode"
            class="mb-20"
            @input="update"
          />

          <LabeledSelect
            v-if="isVMImage"
            v-model="imageId"
            :label="t('harvester.volume.image')"
            :options="imageOption"
            :disabled="!isCreate"
            required
            :mode="mode"
            class="mb-20"
            @input="update"
          />

          <UnitInput
            v-model="storage"
            :label="t('harvester.volume.size')"
            :input-exponent="3"
            :output-modifier="true"
            :increment="1024"
            :mode="mode"
            required
            class="mb-20"
            @input="update"
          />
        </Tab>
      </ResourceTabs>
    </CruResource>
  </div>
</template>

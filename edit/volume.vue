<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import CruResource from '@/components/CruResource';
import UnitInput from '@/components/form/UnitInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';

import { get } from '@/utils/object';
import { HCI } from '@/config/types';
import { sortBy } from '@/utils/sort';
import { InterfaceOption } from '@/config/harvester-map';
import { _CREATE } from '@/config/query-params';
import { formatSi, parseSi } from '@/utils/units';
import CreateEditView from '@/mixins/create-edit-view';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

export default {
  name: 'Volume',

  components: {
    Tab,
    Tabbed,
    UnitInput,
    CruResource,
    LabeledSelect,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true,
    },

    mode: {
      type:     String,
      required: true,
    },
  },

  async fetch() {
    await this.$store.dispatch('virtual/findAll', { type: HCI.IMAGE });
  },

  data() {
    if (this.mode === _CREATE) {
      this.value.spec.volumeMode = 'Block';
      this.value.spec.accessModes = ['ReadWriteMany'];
    }

    const storage = this.getSize(this.value.spec.resources.requests.storage);
    const imageId = get(this.value, `metadata.annotations."${ HCI_ANNOTATIONS.IMAGE_ID }"`);
    const source = !imageId ? 'blank' : 'url';

    return {
      source,
      storage,
      imageId,
    };
  },

  computed: {
    isCreate() {
      return this.mode === 'create';
    },

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
      const choices = this.$store.getters['virtual/all'](HCI.IMAGE);

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
        resources: { requests: { storage: `${ this.storage }Gi` } },
        storageClassName
      };

      this.value.setAnnotations(imageAnnotations);

      this.$set(this.value, 'spec', spec);
    },

    getSize(storage, addSuffix = false) {
      if (!storage) {
        return null;
      }

      const kibUnitSize = parseSi(storage);

      return formatSi(kibUnitSize, {
        addSuffix,
        increment:   1024,
        minExponent: 3,
        maxExponent: 3
      });
    }
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
      :apply-hooks="applyHooks"
      @finish="save"
    >
      <NameNsDescription :value="value" :namespaced="true" :mode="mode" />

      <Tabbed v-bind="$attrs" class="mt-15" :side-tabs="true">
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
            suffix="iB"
            :input-exponent="3"
            :output-exponent="3"
            :mode="mode"
            required
            class="mb-20"
            @input="update"
          />
        </Tab>
      </Tabbed>
    </CruResource>
  </div>
</template>

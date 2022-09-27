<script>
import Tab from '@shell/components/Tabbed/Tab';
import SortableTable from '@shell/components/SortableTable';
import CruResource from '@shell/components/CruResource';
import UnitInput from '@shell/components/form/UnitInput';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import { allHash } from '@shell/utils/promise';
import { get } from '@shell/utils/object';
import { HCI, VOLUME_SNAPSHOT } from '../types';
import { STORAGE_CLASS } from '@shell/config/types';
import { sortBy } from '@shell/utils/sort';
import { saferDump } from '@shell/utils/create-yaml';
import { InterfaceOption, VOLUME_DATA_SOURCE_KIND } from '../config/harvester-map';
import { _CREATE } from '@shell/config/query-params';
import CreateEditView from '@shell/mixins/create-edit-view';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { STATE, NAME, AGE, NAMESPACE } from '@shell/config/table-headers';

export default {
  name: 'HarvesterVolume',

  components: {
    Tab,
    UnitInput,
    CruResource,
    SortableTable,
    ResourceTabs,
    LabeledSelect,
    LabeledInput,
    NameNsDescription,
  },

  mixins: [CreateEditView],

  async fetch() {
    const _hash = {
      images:    this.$store.dispatch('harvester/findAll', { type: HCI.IMAGE }),
      snapshots: this.$store.dispatch('harvester/findAll', { type: VOLUME_SNAPSHOT }),
      storages:  this.$store.dispatch(`harvester/findAll`, { type: STORAGE_CLASS }),
    };
    const hash = await allHash(_hash);

    this.snapshots = hash.snapshots;

    const defaultStorage = this.$store.getters[`harvester/all`](STORAGE_CLASS).find( O => O.isDefault);

    this.$set(this.value.spec, 'storageClassName', this.value?.spec?.storageClassName || defaultStorage?.metadata?.name || 'longhorn');
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
      snapshots: [],
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

    associatedSnapshots() {
      return this.snapshots.filter((snapshot) => {
        const ownerReferences = snapshot.metadata?.ownerReferences?.[0];

        return ownerReferences.name === this.value.metadata?.name && ownerReferences.kind === 'PersistentVolumeClaim';
      });
    },

    snapshotHeaders() {
      return [
        STATE,
        NAME,
        NAMESPACE,
        {
          name:          'size',
          labelKey:      'tableHeaders.size',
          value:         'status.restoreSize',
          sort:          'size',
          formatter:     'Si',
          formatterOpts: {
            opts: {
              increment: 1024, addSuffix: true, maxExponent: 3, minExponent: 3, suffix: 'i',
            },
            needParseSi: true
          },
        },
        {
          name:      'readyToUse',
          labelKey:  'tableHeaders.readyToUse',
          value:     'status.readyToUse',
          align:     'left',
          formatter: 'Checked',
        },
        AGE
      ];
    },

    dataSourceKind() {
      return VOLUME_DATA_SOURCE_KIND[this.value.spec?.dataSource?.kind];
    },

    storageClassOptions() {
      const inStore = this.$store.getters['currentProduct'].inStore;
      const storages = this.$store.getters[`${ inStore }/all`](STORAGE_CLASS);

      const out = storages.filter(s => !s.parameters?.backingImage).map((s) => {
        const label = s.isDefault ? `${ s.name } (${ this.t('generic.default') })` : s.name;

        return {
          label,
          value: s.name,
        };
      }) || [];

      return out;
    },
  },

  methods: {
    willSave() {
      this.update();
    },
    update() {
      let imageAnnotations = '';
      let storageClassName = this.value.spec.storageClassName;

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

        <LabeledSelect
          v-if="source === 'blank'"
          v-model="value.spec.storageClassName"
          :options="storageClassOptions"
          :label="t('harvester.storage.storageClass.label')"
          :mode="mode"
          class="mb-20"
          :disabled="!isCreate"
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
      <Tab v-if="!isCreate" name="instances" :label="t('harvester.volume.tabs.snapshots')" :weight="2" class="bordered-table">
        <SortableTable
          v-bind="$attrs"
          :headers="snapshotHeaders"
          default-sort-by="age"
          :rows="associatedSnapshots"
          key-field="_key"
          v-on="$listeners"
        />
      </Tab>
      <Tab v-if="!isCreate && value.spec.dataSource" name="datasource" :label="t('harvester.volume.tabs.datasource')" :weight="1" class="bordered-table">
        <LabeledInput v-model="dataSourceKind" class="mb-20" :mode="mode" :disabled="true" :label="t('harvester.volume.kind')" />
        <LabeledInput v-model="value.spec.dataSource.name" :mode="mode" :disabled="true" :label="t('nameNsDescription.name.label')" />
      </Tab>
    </ResourceTabs>
  </CruResource>
</template>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ArrayList from '@shell/components/form/ArrayList';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import Loading from '@shell/components/Loading';

import { _CREATE, _VIEW } from '@shell/config/query-params';
import { mapFeature, UNSUPPORTED_STORAGE_DRIVERS } from '@shell/store/features';
import { STORAGE_CLASS, LONGHORN } from '@shell/config/types';
import { allHash } from '@shell/utils/promise';

const PROVISIONER_OPTIONS = [
  {
    labelKey:  'storageClass.longhorn.title',
    value:     'driver.longhorn.io',
    supported: true
  },
];

export default {
  name: 'HarvesterStorage',

  components: {
    ArrayList,
    CruResource,
    LabeledSelect,
    NameNsDescription,
    RadioGroup,
    Tab,
    Tabbed,
    Loading,
  },

  mixins: [CreateEditView],

  data() {
    const reclaimPolicyOptions = [
      {
        label: this.t('storageClass.customize.reclaimPolicy.delete'),
        value: 'Delete'
      },
      {
        label: this.t('storageClass.customize.reclaimPolicy.retain'),
        value: 'Retain'
      }];

    const allowVolumeExpansionOptions = [
      {
        label: this.t('generic.enabled'),
        value: true
      },
      {
        label: this.t('generic.disabled'),
        value: false
      }
    ];

    const volumeBindingModeOptions = [
      {
        label: this.t('storageClass.customize.volumeBindingMode.now'),
        value: 'Immediate'
      },
      {
        label: this.t('harvester.storage.customize.volumeBindingMode.later'),
        value: 'WaitForFirstConsumer'
      }
    ];

    this.$set(this.value, 'parameters', this.value.parameters || {});
    this.$set(this.value, 'provisioner', this.value.provisioner || PROVISIONER_OPTIONS[0].value);
    this.$set(this.value, 'allowVolumeExpansion', this.value.allowVolumeExpansion || allowVolumeExpansionOptions[0].value);
    this.$set(this.value, 'reclaimPolicy', this.value.reclaimPolicy || reclaimPolicyOptions[0].value);
    this.$set(this.value, 'volumeBindingMode', this.value.volumeBindingMode || volumeBindingModeOptions[0].value);

    return {
      reclaimPolicyOptions,
      allowVolumeExpansionOptions,
      volumeBindingModeOptions,
      mountOptions:           [],
      provisioner:            PROVISIONER_OPTIONS[0].value,
      STORAGE_CLASS,
    };
  },

  async fetch() {
    const inStore = this.$store.getters['currentProduct'].inStore;

    const hash = {
      storages:      this.$store.dispatch(`${ inStore }/findAll`, { type: STORAGE_CLASS }),
      longhornNodes: this.$store.dispatch(`${ inStore }/findAll`, { type: LONGHORN.NODES }),
    };

    await allHash(hash);
  },

  computed: {
    showUnsupportedStorage: mapFeature(UNSUPPORTED_STORAGE_DRIVERS),

    modeOverride() {
      return this.isCreate ? _CREATE : _VIEW;
    },

    provisionerWatch() {
      return this.value.provisioner;
    },

    provisioners() {
      return PROVISIONER_OPTIONS.filter(provisioner => this.showUnsupportedStorage || provisioner.supported);
    },

    schema() {
      const inStore = this.$store.getters['currentProduct'].inStore;

      return this.$store.getters[`${ inStore }/schemaFor`](STORAGE_CLASS);
    },
  },

  watch: {
    provisionerWatch() {
      this.$set(this.value, 'parameters', {});
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    getComponent(name) {
      try {
        return require(`./provisioners/${ name }`).default;
      } catch {
        return require(`./provisioners/driver.longhorn.io`).default;
      }
    },

    updateProvisioner(event) {
      const provisioner = event.labelKey ? event.labelKey : event;

      this.$set(this.value, 'provisioner', provisioner);
      this.$set(this.value, 'allowVolumeExpansion', provisioner === 'driver.longhorn.io');
    },
    willSave() {
      Object.keys(this.value.parameters).forEach((key) => {
        if (this.value.parameters[key] === null) {
          delete this.value.parameters[key];
        }
      });
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="errors"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :namespaced="false"
      :value="value"
      :mode="modeOverride"
      :register-before-hook="registerBeforeHook"
    />
    <LabeledSelect
      :value="value.provisioner"
      label="Provisioner"
      :options="provisioners"
      :localized-label="true"
      option-label="labelKey"
      :mode="modeOverride"
      :searchable="true"
      :taggable="true"
      class="mb-20"
      @input="updateProvisioner($event)"
    />
    <Tabbed :side-tabs="true">
      <Tab name="parameters" :label="t('storageClass.parameters.label')" :weight="2">
        <component
          :is="getComponent(value.provisioner)"
          :key="value.provisioner"
          :value="value"
          :mode="modeOverride"
        />
      </Tab>
      <Tab name="customize" :label="t('storageClass.customize.label')">
        <div class="row mt-20">
          <div class="col span-6">
            <RadioGroup
              v-model="value.reclaimPolicy"
              name="reclaimPolicy"
              :label="t('storageClass.customize.reclaimPolicy.label')"
              :mode="modeOverride"
              :options="reclaimPolicyOptions"
            />
          </div>
          <div class="col span-6">
            <RadioGroup
              v-model="value.allowVolumeExpansion"
              name="allowVolumeExpansion"
              :label="t('storageClass.customize.allowVolumeExpansion.label')"
              :mode="mode"
              :options="allowVolumeExpansionOptions"
            />
          </div>
        </div>
        <div class="row mt-20">
          <div class="col span-6">
            <RadioGroup
              v-model="value.volumeBindingMode"
              name="volumeBindingMode"
              :label="t('storageClass.customize.volumeBindingMode.label')"
              :mode="modeOverride"
              :options="volumeBindingModeOptions"
            />
          </div>
        </div>
      </Tab>
    </Tabbed>
  </CruResource>
</template>

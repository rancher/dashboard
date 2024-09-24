<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ArrayList from '@shell/components/form/ArrayList';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import Banner from '@components/Banner/Banner.vue';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { PROVISIONER_OPTIONS } from '@shell/models/storage.k8s.io.storageclass';
import { mapFeature, UNSUPPORTED_STORAGE_DRIVERS } from '@shell/store/features';
import { CSI_DRIVER, LONGHORN_DRIVER } from '@shell/config/types';

export default {
  name:         'StorageClass',
  inheritAttrs: false,
  components:   {
    ArrayList,
    CruResource,
    LabeledSelect,
    NameNsDescription,
    RadioGroup,
    Tab,
    Tabbed,
    Banner
  },

  mixins: [CreateEditView],

  async fetch() {
    if (this.$store.getters['cluster/schemaFor'](CSI_DRIVER)) {
      this.csiDrivers = await this.$store.dispatch('cluster/findAll', { type: CSI_DRIVER });
    }
  },

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
        label: this.t('storageClass.customize.volumeBindingMode.later'),
        value: 'WaitForFirstConsumer'
      }
    ];

    this.value['parameters'] = this.value.parameters || {};
    this.value['provisioner'] = this.value.provisioner || PROVISIONER_OPTIONS[0].value;
    this.value['allowVolumeExpansion'] = this.value.allowVolumeExpansion || allowVolumeExpansionOptions[1].value;
    this.value['reclaimPolicy'] = this.value.reclaimPolicy || reclaimPolicyOptions[0].value;
    this.value['volumeBindingMode'] = this.value.volumeBindingMode || volumeBindingModeOptions[0].value;

    return {
      reclaimPolicyOptions,
      allowVolumeExpansionOptions,
      volumeBindingModeOptions,
      mountOptions: [],
      csiDrivers:   [],
    };
  },

  computed: {
    showUnsupportedStorage: mapFeature(UNSUPPORTED_STORAGE_DRIVERS),

    modeOverride() {
      return this.isCreate ? _CREATE : _VIEW;
    },

    provisionerWatch() {
      return this.value.provisioner;
    },

    // PROVISIONER_OPTIONS are provs with custom components: all the in-tree types + longhorn and harvester
    // CSI drivers are third party provisioner options - this.csiDrivers is a list of the ones that are currently installed on this cluster
    provisioners() {
      const dropdownOptions = [];
      const provisionerOptionsDrivers = [];

      PROVISIONER_OPTIONS.forEach((opt) => {
        provisionerOptionsDrivers.push(opt.value);
        if (this.showUnsupportedStorage || opt.supported) {
          let label = this.t(opt.labelKey);

          if (opt.value.includes('kubernetes')) {
            label += ` ${ this.t('persistentVolume.plugin.inTree') }`;
          }
          if (!opt.supported) {
            label += ` ${ this.t('persistentVolume.plugin.unsupported') }`;
          }
          dropdownOptions.push({
            value:      opt.value,
            label,
            deprecated: opt.deprecated
          });
        }
      });

      this.csiDrivers.forEach((driver) => {
        // if a csiDriver is in PROVISIONER_OPTIONS, it's already in the dropdown list; dont add again
        if (driver.metadata.name === LONGHORN_DRIVER || provisionerOptionsDrivers.includes(driver.metadata.name)) {
          return;
        }
        const fallback = `${ driver.metadata.name }  ${ this.t('persistentVolume.csi.suffix') }`;

        dropdownOptions.push({
          value: driver.metadata.name,
          label: this.$store.getters['i18n/withFallback'](`persistentVolume.csi.drivers.${ driver.metadata.name.replaceAll('.', '-') }`, null, fallback)
        });
      });
      const out = dropdownOptions.sort((a, b) => a.label.toLowerCase() > b.label.toLowerCase() ? 1 : -1);

      return out;
    },

    provisionerIsDeprecated() {
      const provisionerOpt = PROVISIONER_OPTIONS.find((opt) => opt.value === this.value.provisioner);

      return provisionerOpt && provisionerOpt.deprecated !== undefined;
    },

    provisionerIsHideCustomize() {
      const provisionerOpt = PROVISIONER_OPTIONS.find((opt) => opt.value === this.value.provisioner);

      return provisionerOpt && provisionerOpt.hideCustomize !== undefined;
    },
  },

  watch: {
    provisionerWatch() {
      this.value['parameters'] = {};
    }
  },

  created() {
    this.registerBeforeHook(this.willSave, 'willSave');
  },

  methods: {
    getComponent(name) {
      const isCustom = !PROVISIONER_OPTIONS.find((o) => o.value === name);
      const provisioner = isCustom ? 'custom' : name;

      return require(`./provisioners/${ provisioner }`).default;
    },

    updateProvisioner(event) {
      const provisioner = event.labelKey ? event.labelKey : event;

      this.value['provisioner'] = provisioner;
      this.value['allowVolumeExpansion'] = provisioner === 'driver.longhorn.io';
    },
    willSave() {
      Object.keys(this.value.parameters).forEach((key) => {
        if (this.value.parameters[key] === null) {
          delete this.value.parameters[key];
        }
      });
    },
    provisionerLabel(provisioner) {
      const provisionerOpt = PROVISIONER_OPTIONS.find((opt) => opt.value === provisioner);

      return provisionerOpt?.labelKey ? this.t(provisionerOpt.labelKey) : provisioner;
    },
    getOptionLabel(opt) {
      if (opt.deprecated) {
        return `${ opt.label } ${ this.t('storageClass.deprecated.title') }`;
      }

      return opt.label;
    }
  }
};
</script>

<template>
  <CruResource
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
      :get-option-label="getOptionLabel"
      :mode="modeOverride"
      :searchable="true"
      :taggable="true"
      class="mb-20"
      @update:value="updateProvisioner($event)"
    />
    <Banner
      v-if="provisionerIsDeprecated"
      color="warning"
    >
      <t
        k="storageClass.deprecated.warning"
        raw
        :provisioner="provisionerLabel(value.provisioner)"
      />
    </Banner>
    <Tabbed :side-tabs="true">
      <Tab
        name="parameters"
        :label="t('storageClass.parameters.label')"
        :weight="2"
      >
        <component
          :is="getComponent(value.provisioner)"
          :key="value.provisioner"
          :value="value"
          :mode="modeOverride"
        />
      </Tab>
      <Tab
        v-if="!provisionerIsHideCustomize"
        name="customize"
        :label="t('storageClass.customize.label')"
      >
        <div class="row mt-20">
          <div class="col span-6">
            <div class="row mb-20">
              <div class="col span-12">
                <RadioGroup
                  v-model:value="value.reclaimPolicy"
                  name="reclaimPolicy"
                  :label="t('storageClass.customize.reclaimPolicy.label')"
                  :mode="modeOverride"
                  :options="reclaimPolicyOptions"
                />
              </div>
            </div>
            <div class="row mb-20">
              <div class="col span-12">
                <RadioGroup
                  v-model:value="value.allowVolumeExpansion"
                  name="allowVolumeExpansion"
                  :label="t('storageClass.customize.allowVolumeExpansion.label')"
                  :mode="mode"
                  :options="allowVolumeExpansionOptions"
                />
              </div>
            </div>
          </div>
          <div class="col span-6">
            <h3>{{ t('storageClass.customize.mountOptions.label') }}</h3>
            <ArrayList
              v-model:value="value.mountOptions"
              :mode="mode"
              :label="t('storageClass.customize.mountOptions.label')"
              :add-label="t('storageClass.customize.mountOptions.addLabel')"
            />
          </div>
        </div>
        <div class="row">
          <div class="col span-6">
            <RadioGroup
              v-model:value="value.volumeBindingMode"
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

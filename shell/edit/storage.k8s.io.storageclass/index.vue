<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import CruResource from '@shell/components/CruResource';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import ArrayList from '@shell/components/form/ArrayList';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import { RadioGroup } from '@components/Form/Radio';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { _CREATE, _VIEW } from '@shell/config/query-params';
import { PROVISIONER_OPTIONS } from '@shell/models/storage.k8s.io.storageclass';
import { mapFeature, UNSUPPORTED_STORAGE_DRIVERS } from '@shell/store/features';

export default {
  name: 'StorageClass',

  components: {
    ArrayList,
    CruResource,
    LabeledSelect,
    NameNsDescription,
    RadioGroup,
    Tab,
    Tabbed,
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
        label: this.t('storageClass.customize.volumeBindingMode.later'),
        value: 'WaitForFirstConsumer'
      }
    ];

    this.$set(this.value, 'parameters', this.value.parameters || {});
    this.$set(this.value, 'provisioner', this.value.provisioner || PROVISIONER_OPTIONS[0].value);
    this.$set(this.value, 'allowVolumeExpansion', this.value.allowVolumeExpansion || allowVolumeExpansionOptions[1].value);
    this.$set(this.value, 'reclaimPolicy', this.value.reclaimPolicy || reclaimPolicyOptions[0].value);
    this.$set(this.value, 'volumeBindingMode', this.value.volumeBindingMode || volumeBindingModeOptions[0].value);

    return {
      reclaimPolicyOptions,
      allowVolumeExpansionOptions,
      volumeBindingModeOptions,
      mountOptions: [],
      provisioner:  PROVISIONER_OPTIONS[0].value,
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

    provisioners() {
      return PROVISIONER_OPTIONS.filter(provisioner => this.showUnsupportedStorage || provisioner.supported);
    }
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
      const isCustom = !PROVISIONER_OPTIONS.find(o => o.value === name);
      const provisioner = isCustom ? 'custom' : name;

      return require(`./provisioners/${ provisioner }`).default;
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
      option-label="labelKey"
      :mode="modeOverride"
      :searchable="true"
      :taggable="true"
      class="mb-20"
      @input="updateProvisioner($event)"
    />
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
        name="customize"
        :label="t('storageClass.customize.label')"
      >
        <div class="row mt-20">
          <div class="col span-6">
            <div class="row mb-20">
              <div class="col span-12">
                <RadioGroup
                  v-model="value.reclaimPolicy"
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
                  v-model="value.allowVolumeExpansion"
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
              v-model="value.mountOptions"
              :mode="mode"
              :label="t('storageClass.customize.mountOptions.label')"
              :add-label="t('storageClass.customize.mountOptions.addLabel')"
            />
          </div>
        </div>
        <div class="row">
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

<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';
import ArrayList from '@/components/form/ArrayList';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledSelect from '@/components/form/LabeledSelect';
import { _CREATE, _VIEW } from '@/config/query-params';
import { PROVISIONER_OPTIONS } from '@/models/storage.k8s.io.storageclass';

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
        label: 'Delete volumes and underlying device when volume claim is deleted',
        value: 'Delete'
      },
      {
        label: 'Retain the volume for manual cleanup',
        value: 'Retain'
      }];

    const allowVolumeExpansionOptions = [
      {
        label: 'Enabled',
        value: true
      },
      {
        label: 'Disabled',
        value: false
      }
    ];

    const volumeBindingModeOptions = [
      {
        label: 'Bind and provision a persistent volume once the PersistentVolumeClaim is created',
        value: 'Immediate'
      },
      {
        label: 'Bind and provision a persistent volume once a Pod using the PersistentVolumeClaim is created',
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
      PROVISIONER_OPTIONS,
      mountOptions:         [],
      provisioner:          PROVISIONER_OPTIONS[0].value,
    };
  },

  computed: {
    modeOverride() {
      return this.isCreate ? _CREATE : _VIEW;
    },
    provisionerWatch() {
      return this.value.provisioner;
    },
  },

  watch: {
    provisionerWatch() {
      this.$set(this.value, 'parameters', {});
    }
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
    }
  }
};
</script>

<template>
  <CruResource
    :done-route="doneRoute"
    :mode="modeOverride"
    :resource="value"
    :subtypes="[]"
    :validation-passed="true"
    :errors="[]"
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
      :options="PROVISIONER_OPTIONS"
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
        <component :is="getComponent(value.provisioner)" :key="value.provisioner" :value="value" :mode="modeOverride" />
      </Tab>
      <Tab name="customize" :label="t('storageClass.customize.label')">
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
                  :mode="modeOverride"
                  :options="allowVolumeExpansionOptions"
                />
              </div>
            </div>
          </div>
          <div class="col span-6">
            <h3>Mount Options</h3>
            <ArrayList
              v-model="value.mountOptions"
              :mode="modeOverride"
              :label="t('storageClass.customize.mountOptions.label')"
              add-label="Add Option"
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

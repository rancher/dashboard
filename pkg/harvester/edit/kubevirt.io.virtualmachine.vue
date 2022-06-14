<script>
import isEqual from 'lodash/isEqual';
import { mapGetters } from 'vuex';

import { Banner } from '@components/Banner';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import { Checkbox } from '@components/Form/Checkbox';
import CruResource from '@shell/components/CruResource';
import { RadioGroup } from '@components/Form/Radio';
import { LabeledInput } from '@components/Form/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import UnitInput from '@shell/components/form/UnitInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';

import SSHKey from '../components/VirtualMachineSSHKey';
import Volume from '../components/VirtualMachineVolume';
import Network from '../components/VirtualMachineNetwork';
import CpuMemory from '../components/VirtualMachineCpuMemory';
import CloudConfig from '../components/VirtualMachineCloudConfig';
import NodeScheduling from '@shell/components/form/NodeScheduling';
import AccessCredentials from '../components/VirtualMachineAccessCredentials';

import { clear } from '@shell/utils/array';
import { clone } from '@shell/utils/object';
import { HCI } from '@shell/config/types';
import { RunStrategys } from '@shell/config/harvester-map';
import { saferDump } from '@shell/utils/create-yaml';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { HCI as HCI_ANNOTATIONS } from '@shell/config/labels-annotations';
import { BEFORE_SAVE_HOOKS, AFTER_SAVE_HOOKS } from '@shell/mixins/child-hook';

import VM_MIXIN from '../mixins/harvester-vm';
import CreateEditView from '@shell/mixins/create-edit-view';

export default {
  name: 'HarvesterEditVM',

  components: {
    Tab,
    Tabbed,
    Banner,
    Checkbox,
    RadioGroup,
    CruResource,
    LabeledInput,
    LabeledSelect,
    UnitInput,
    NameNsDescription,
    Volume,
    SSHKey,
    Network,
    CpuMemory,
    CloudConfig,
    NodeScheduling,
    AccessCredentials,
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const cloneVM = clone(this.value);
    const isRestartImmediately = this.value.actualState === 'Running';

    const hostname = this.value.spec.template.spec.hostname || '';

    return {
      cloneVM,
      count:                 2,
      templateId:            '',
      templateVersionId:     '',
      namePrefix:            '',
      isSingle:              true,
      useTemplate:           false,
      hostname,
      isRestartImmediately,
      RunStrategys,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    machineTypeOptions() {
      return [{
        label: 'None',
        value: ''
      }, {
        label: 'q35',
        value: 'q35'
      }, {
        label: 'pc',
        value: 'pc'
      }];
    },

    templateOptions() {
      return this.templates.map( (T) => {
        return {
          label: T.id,
          value: T.id
        };
      });
    },

    versionOptions() {
      const defaultVersion = this.curTemplateResource?.defaultVersion;

      return this.versions.filter( O => O.templateId === this.templateId).map( (T) => {
        const version = T.version;

        const label = defaultVersion === version ? `${ version } (${ this.t('generic.default') })` : version;
        const value = T.id;

        return { label, value };
      });
    },

    curTemplateResource() {
      return this.templates.find( O => O.id === this.templateId);
    },

    nameLabel() {
      return this.isSingle ? 'harvester.virtualMachine.instance.single.nameLabel' : 'harvester.virtualMachine.instance.multiple.nameLabel';
    },

    hostnameLabel() {
      return this.isSingle ? 'harvester.virtualMachine.instance.single.host.label' : 'harvester.virtualMachine.instance.multiple.host.label';
    },

    hostPlaceholder() {
      return this.isSingle ? this.t('harvester.virtualMachine.instance.single.host.placeholder') : this.t('harvester.virtualMachine.instance.multiple.host.placeholder');
    },

    secretNamePrefix() {
      return this.value?.metadata?.name;
    },

    isQemuInstalled() {
      return this.value.isQemuInstalled;
    }
  },

  watch: {
    templateId: {
      async handler(id, old) {
        if (!id) {
          return;
        }
        if (id !== old && !this.templateVersionId) {
          const templates = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_TEMPLATE });

          this.templateVersionId = templates.find( O => O.id === id)?.spec?.defaultVersionId;
        }
      },
      immediate: false
    },

    templateVersionId: {
      async handler(id) {
        if (!id) {
          return;
        }
        const versions = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_VERSION });
        const curVersion = versions.find( V => V.id === id);
        const cloneVersionVM = clone(curVersion.spec.vm);

        delete cloneVersionVM.spec?.template?.spec?.accessCredentials;
        delete cloneVersionVM.spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.DYNAMIC_SSHKEYS_NAMES];
        delete cloneVersionVM.spec?.template?.metadata?.annotations?.[HCI_ANNOTATIONS.DYNAMIC_SSHKEYS_USERS];

        this.getInitConfig({ value: cloneVersionVM });
        this.$set(this, 'hasCreateVolumes', []); // When using the template, all volume names need to be newly created

        const claimTemplate = this.getVolumeClaimTemplates(cloneVersionVM);

        this.value.metadata.annotations[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE] = JSON.stringify(claimTemplate);
      }
    },

    useTemplate(neu) {
      if (neu === false) {
        this.templateId = '';
        this.templateVersionId = '';
        this.value.applyDefaults();
        this.getInitConfig({ value: this.value });
      }
    },
  },

  created() {
    this.registerAfterHook(async() => {
      this.restartVM();
      const id = `${ this.value.metadata.namespace }/${ this.value.metadata.name }`;

      const res = this.$store.getters['harvester/byId'](HCI.VM, id);

      try {
        await this.saveSecret(res);
        await this.saveAccessCredentials(res);
      } catch (e) {
        this.errors.push(...exceptionToErrorsArray(e));
      }

      if (!this.errors.length && this.isSingle) {
        this.done();
      }
    });

    if (this.registerBeforeHook) {
      this.registerBeforeHook(this.updateBeforeSave);
    }
  },

  mounted() {
    this.imageId = this.$route.query?.image || this.imageId;

    const diskRows = this.getDiskRows(this.value);

    this.$set(this, 'diskRows', diskRows);
    const templateId = this.$route.query.templateId;
    const templateVersionId = this.$route.query.versionId;

    if (templateId && templateVersionId) {
      this.templateId = templateId;
      this.templateVersionId = templateVersionId;
      this.useTemplate = true;
    }
  },

  methods: {
    saveVM(buttonCb) {
      clear(this.errors);

      if (this.isSingle) {
        this.saveSingle(buttonCb);
      } else {
        this.saveMultiple(buttonCb);
      }
    },

    async saveSingle(buttonCb) {
      this.parseVM();
      this.value.spec.template.spec.hostname = this.hostname ? this.hostname : this.value.metadata.name;
      await this._save(this.value, buttonCb);
      if (!this.errors.length) {
        buttonCb(true);
      } else {
        buttonCb(false);
      }
    },

    async saveMultiple(buttonCb) {
      this.namePrefix = this.value.metadata.name || '';
      const join = this.namePrefix.endsWith('-') ? '' : '-';
      const baseHostname = this.hostname ? this.hostname : this.namePrefix;

      if (this.count < 1) {
        this.errors = [this.t('harvester.virtualMachine.instance.multiple.countTip')];
        buttonCb(false);

        return;
      }

      const cloneValue = clone(this.value);

      for (let i = 1; i <= this.count; i++) {
        this.$set(this.value, 'spec', cloneValue.spec);
        this.$set(this, 'spec', cloneValue.spec);
        const suffix = i < 10 ? `0${ i }` : i;

        this.value.cleanForNew();
        this.value.metadata.name = `${ this.namePrefix }${ join }${ suffix }`;
        this.$set(this.value.spec.template.spec, 'hostname', `${ baseHostname }${ join }${ suffix }`);
        this.secretName = '';
        await this.parseVM();
        const basicValue = await this.$store.dispatch('harvester/clone', { resource: this.value });

        await this._save(basicValue, buttonCb);

        if (i === this.count && !this.errors.length) {
          buttonCb(true);
          this.done();
        } else if (i === this.count) {
          this.value.metadata.name = this.namePrefix;
          buttonCb(false);
        }
      }
    },

    async _save(value, buttonCb) {
      try {
        await this.applyHooks(BEFORE_SAVE_HOOKS);
        await value.save();
        await this.applyHooks(AFTER_SAVE_HOOKS);
      } catch (e) {
        this.errors.push(...exceptionToErrorsArray(e));
        buttonCb(false);
      }
    },

    restartVM() {
      if ( this.mode === 'edit' && (this.value.hasAction('restart') || this.value.hasAction('start'))) {
        const cloneDeepNewVM = clone(this.value);

        delete cloneDeepNewVM?.metadata;
        delete this.cloneVM?.metadata;

        const oldVM = JSON.parse(JSON.stringify(this.cloneVM));
        const newVM = JSON.parse(JSON.stringify(cloneDeepNewVM));

        if (!isEqual(oldVM, newVM) && this.isRestartImmediately) {
          this.value.doActionGrowl('restart', {});
        }
      }
    },

    updateBeforeSave() {
      if (this.isSingle) {
        if (!this.value.spec.template.spec.hostname) {
          this.$set(this.value.spec.template.spec, 'hostname', this.value.metadata.name);
        }
      }

      const errors = this.getAccessCredentialsValidation();

      if (errors.length > 0) {
        return Promise.reject(errors);
      } else {
        return Promise.resolve();
      }
    },

    validateCount(count) {
      if (count > 10) {
        this.$set(this, 'count', 10);
      }
    },

    updateTemplateId() {
      this.templateVersionId = '';
    },

    onTabChanged({ tab }) {
      if (tab.name === 'advanced') {
        this.$refs.yamlEditor?.refresh();
      }
    },

    generateYaml() {
      this.parseVM();
      const out = saferDump(this.value);

      return out;
    },
  },
};
</script>

<template>
  <div v-if="spec" id="vm">
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :mode="mode"
      :can-yaml="isSingle ? true : false"
      :errors="errors"
      :generate-yaml="generateYaml"
      :apply-hooks="applyHooks"
      @finish="saveVM"
    >
      <RadioGroup
        v-if="isCreate"
        v-model="isSingle"
        class="mb-20 vm-radio-group"
        name="createInstanceMode"
        :options="[true,false]"
        :labels="[t('harvester.virtualMachine.instance.single.label'), t('harvester.virtualMachine.instance.multiple.label')]"
      />

      <NameNsDescription
        v-model="value"
        :mode="mode"
        :has-extra="!isSingle"
        :name-label="nameLabel"
        :namespaced="true"
        :name-placeholder="isSingle ? 'nameNsDescription.name.placeholder' : 'harvester.virtualMachine.instance.multiple.nameNsDescription'"
        :extra-columns="isSingle ? [] :['type']"
      >
        <template v-slot:type>
          <LabeledInput
            v-if="!isSingle"
            v-model.number="count"
            v-int-number
            type="number"
            :label="t('harvester.virtualMachine.instance.multiple.count')"
            required
            @input="validateCount"
          />
        </template>
      </NameNsDescription>

      <Checkbox
        v-if="isCreate"
        v-model="useTemplate"
        class="check mb-20"
        type="checkbox"
        label-key="harvester.virtualMachine.useTemplate.label"
      />

      <div v-if="useTemplate" class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="templateId"
            label-key="harvester.virtualMachine.useTemplate.template.label"
            :options="templateOptions"
            @input="updateTemplateId"
          />
        </div>

        <div class="col span-6">
          <LabeledSelect
            v-model="templateVersionId"
            label-key="harvester.virtualMachine.useTemplate.version.label"
            :options="versionOptions"
          />
        </div>
      </div>

      <Tabbed :side-tabs="true" @changed="onTabChanged">
        <Tab name="basics" :label="t('harvester.virtualMachine.detail.tabs.basics')">
          <CpuMemory
            :cpu="cpu"
            :memory="memory"
            :mode="mode"
            @updateCpuMemory="updateCpuMemory"
          />

          <SSHKey
            v-model="sshKey"
            class="mb-20"
            :namespace="value.metadata.namespace"
            :mode="mode"
            :disabled="isWindows"
            @update:sshKey="updateSSHKey"
            @register-after-hook="registerAfterHook"
          />
        </Tab>

        <Tab name="Volume" :label="t('harvester.tab.volume')" :weight="-1">
          <Volume
            v-model="diskRows"
            :mode="mode"
            :custom-volume-mode="customVolumeMode"
            :namespace="value.metadata.namespace"
            :resource-type="value.type"
            :vm="value"
            :validate-required="true"
          />
        </Tab>

        <Tab name="Network" :label="t('harvester.tab.network')" :weight="-2">
          <Network v-model="networkRows" :mode="mode" />
        </Tab>

        <Tab name="nodeScheduling" :label="t('workload.container.titles.nodeScheduling')" :weight="-3">
          <NodeScheduling :mode="mode" :value="spec.template.spec" :nodes="nodesIdOptions" />
        </Tab>

        <Tab v-if="isEdit" :label="t('harvester.tab.accessCredentials')" name="accessCredentials" :weight="-4">
          <AccessCredentials v-model="accessCredentials" :mode="mode" :resource="value" :is-qemu-installed="isQemuInstalled" />
        </Tab>

        <Tab
          name="advanced"
          :label="t('harvester.tab.advanced')"
          :weight="-5"
        >
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledSelect
                v-model="runStrategy"
                label-key="harvester.virtualMachine.runStrategy"
                :options="RunStrategys"
                :mode="mode"
              />
            </div>

            <div class="col span-6">
              <LabeledSelect
                v-model="osType"
                label-key="harvester.virtualMachine.osType"
                :options="OS"
                :disabled="!isCreate"
              />
            </div>
          </div>

          <div class="row mb-20">
            <a v-if="showAdvanced" v-t="'harvester.generic.showMore'" role="button" @click="toggleAdvanced" />
            <a v-else v-t="'harvester.generic.showMore'" role="button" @click="toggleAdvanced" />
          </div>

          <div v-if="showAdvanced" class="mb-20">
            <div class="row mb-20">
              <div class="col span-6">
                <LabeledInput
                  v-model="hostname"
                  :label-key="hostnameLabel"
                  :placeholder="hostPlaceholder"
                  :mode="mode"
                />
              </div>

              <div class="col span-6">
                <LabeledSelect
                  v-model="machineType"
                  label-key="harvester.virtualMachine.input.MachineType"
                  :options="machineTypeOptions"
                  :mode="mode"
                />
              </div>
            </div>

            <div class="col span-6">
              <UnitInput
                v-model="reservedMemory"
                v-int-number
                :label="t('harvester.virtualMachine.input.reservedMemory')"
                :mode="mode"
                :input-exponent="2"
                :increment="1024"
                :output-modifier="true"
              />
            </div>
          </div>

          <CloudConfig
            ref="yamlEditor"
            :user-script="userScript"
            :mode="mode"
            :view-code="isWindows"
            :namespace="value.metadata.namespace"
            :network-script="networkScript"
            @updateUserData="updateUserData"
            @updateNetworkData="updateNetworkData"
            @updateDataTemplateId="updateDataTemplateId"
          />

          <Checkbox
            v-model="installUSBTablet"
            class="check mt-20"
            type="checkbox"
            tooltip-key="harvester.virtualMachine.usbTip"
            label-key="harvester.virtualMachine.enableUsb"
            :mode="mode"
          />

          <Checkbox
            v-model="installAgent"
            class="check"
            type="checkbox"
            :disabled="isWindows"
            label-key="harvester.virtualMachine.installAgent"
            :mode="mode"
            @input="updateAgent"
          />

          <Checkbox
            v-model="efiEnabled"
            class="check"
            type="checkbox"
            :label="t('harvester.virtualMachine.efiEnabled')"
            :mode="mode"
          />

          <Checkbox
            v-if="efiEnabled"
            v-model="secureBoot"
            class="check"
            type="checkbox"
            :label="t('harvester.virtualMachine.secureBoot')"
            :mode="mode"
          />
        </Tab>
      </Tabbed>

      <div class="mt-20">
        <span v-if="isEdit" class="restart">
          <Banner color="warning" class="banner-right">
            {{ t('harvester.virtualMachine.restartTip') }}

            <Checkbox
              v-model="isRestartImmediately"
              class="check ml-20"
              type="checkbox"
              label-key="harvester.virtualMachine.restartNow"
            />
          </Banner>
        </span>
      </div>
    </CruResource>
  </div>
</template>

<style lang="scss" scoped>
#vm {
  ::v-deep .vm-radio-group .radio-group {
    display: flex;
    .radio-container {
      margin-right: 30px;
    }
  }

  .restart {
    display: flex;
    justify-content: flex-end;
  }

  .banner-right {
    width: auto;
    display: flex;
    justify-items: center;
  }
}
</style>

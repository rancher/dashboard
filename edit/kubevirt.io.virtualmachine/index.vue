<script>
import isEqual from 'lodash/isEqual';
import { mapGetters } from 'vuex';

import Banner from '@/components/Banner';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';

import SSHKey from '@/edit/kubevirt.io.virtualmachine/VirtualMachineSSHKey';
import Volume from '@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume';
import Network from '@/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/VirtualMachineCpuMemory';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/VirtualMachineCloudConfig';
import NodeScheduling from '@/components/form/NodeScheduling';

import { clone } from '@/utils/object';
import { HCI } from '@/config/types';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

import VM_MIXIN from '@/mixins/harvester-vm';
import CreateEditView from '@/mixins/create-edit-view';

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
    NameNsDescription,
    Volume,
    SSHKey,
    Network,
    CpuMemory,
    CloudConfig,
    NodeScheduling,
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const cloneDeepVM = clone(this.value);
    const isRestartImmediately = this.value.actualState === 'Running';

    return {
      cloneDeepVM,
      count:                 2,
      realHostname:          '',
      templateId:            '',
      templateVersionId:       '',
      isSingle:              true,
      isRunning:             true,
      useTemplate:           false,
      isRestartImmediately,
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

    curVersionResource() {
      return this.versions.find( O => O.id === this.templateVersionId);
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

    hostname: {
      get() {
        return this.spec.template.spec?.hostname;
      },

      set(neu) {
        if (neu) {
          this.$set(this.spec.template.spec, 'hostname', neu);
        }
      }
    },
  },

  watch: {
    templateId: {
      async handler(id, old) {
        if (!id) {
          return;
        }
        if (id !== old && !this.templateVersionId) {
          const templates = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_TEMPLATE });

          this.templateVersionId = templates.find( O => O.id === id)?.defaultVersionId;
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

        if (curVersion?.spec?.vm) {
          const sshKey = curVersion.spec.keyPairIds || [];

          const cloudScript = this.getCloudInitScript(curVersion.spec.vm);

          this.$set(this, 'userScript', cloudScript?.userData);
          this.$set(this, 'networkScript', cloudScript?.networkData);
          this.$set(this, 'sshKey', sshKey);
          this.value.spec = curVersion.spec.vm.spec;
          this.$set(this, 'spec', curVersion.spec.vm.spec);
          const claimTemplate = this.getVolumeClaimTemplates(curVersion.spec.vm);

          this.value.metadata.annotations[HCI_ANNOTATIONS.VOLUME_CLAIM_TEMPLATE] = JSON.stringify(claimTemplate);
        }
        this.changeSpec();
      }
    },

    useTemplate(neu) {
      if (neu === false) {
        this.templateId = '';
        this.templateVersionId = '';
        this.value.applyDefaults();
        this.changeSpec();
      }
    },
  },

  created() {
    this.registerBeforeHook(() => {
      Object.assign(this.value.metadata.labels, {
        ...this.value.metadata.labels,
        [HCI_ANNOTATIONS.CREATOR]: 'harvester',
      });

      Object.assign(this.value.spec.template.metadata.annotations, {
        ...this.value.spec.template.metadata.annotations,
        [HCI_ANNOTATIONS.SSH_NAMES]: JSON.stringify(this.sshKey)
      });

      Object.assign(this.value.metadata.annotations, {
        ...this.value.metadata.annotations,
        [HCI_ANNOTATIONS.NETWORK_IPS]: JSON.stringify(this.value.networkIps)
      });
    });

    this.registerAfterHook(() => {
      this.restartVM();
    });
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
      if (this.isSingle) {
        this.saveSingle(buttonCb);
      } else {
        this.saveMultiple(buttonCb);
      }
    },

    async saveSingle(buttonCb) {
      this.parseVM();
      if (!this.value.spec.template.spec.hostname) {
        this.$set(this.value.spec.template.spec, 'hostname', this.value.metadata.name);
      }

      await this.save(buttonCb);
    },

    async saveMultiple(buttonCb) {
      const namePrefix = this.value.metadata.name || '';
      const baseHostname = this.value?.spec?.template?.spec?.hostname ? this.value.spec.template.spec.hostname : this.value.metadata.name;
      const join = namePrefix.endsWith('-') ? '' : '-';

      if (this.count < 1) {
        this.errors = [this.t('harvester.virtualMachine.instance.multiple.countTip')];
        buttonCb(false);

        return;
      }

      for (let i = 1; i <= this.count; i++) {
        this.$set(this.value, 'type', HCI.VM);

        const suffix = i < 10 ? `0${ i }` : i;

        this.value.cleanForNew();
        this.value.metadata.name = `${ namePrefix }${ join }${ suffix }`;
        const hostname = `${ baseHostname }${ join }${ suffix }`;

        this.$set(this.value.spec.template.spec, 'hostname', hostname);

        this.parseVM();

        try {
          await this.save(buttonCb);
        } catch (err) {
          return Promise.reject(new Error(err));
        }
      }
      this.value.id = '';
    },

    restartVM() {
      if ( this.mode === 'edit' && this.value.hasAction('restart')) {
        const cloneDeepNewVM = clone(this.value);

        delete cloneDeepNewVM.type;
        delete cloneDeepNewVM?.metadata;
        delete this.cloneDeepVM.type;
        delete this.cloneDeepVM?.metadata;

        const oldVM = JSON.parse(JSON.stringify(this.cloneDeepVM));
        const newVM = JSON.parse(JSON.stringify(cloneDeepNewVM));

        if (!isEqual(oldVM, newVM) && this.isRestartImmediately) {
          this.value.doAction('restart', {});
        }
      }
    },

    changeSpec() {
      const diskRows = this.getDiskRows(this.value);
      const networkRows = this.getNetworkRows(this.value);
      const imageId = this.getRootImageId(this.value);

      this.$set(this, 'spec', this.value.spec);
      this.$set(this, 'diskRows', diskRows);
      this.$set(this, 'networkRows', networkRows);
      this.$set(this, 'imageId', imageId);
    },

    validataCount(count) {
      if (count > 10) {
        this.$set(this, 'count', 10);
      }
    },

    updateCpuMemory(cpu, memory) {
      this.$set(this.spec.template.spec.domain.cpu, 'cores', cpu);
      this.$set(this, 'memory', memory);
    },

    onTabChanged({ tab }) {
      if (tab.name === 'advanced' && this.$refs.yamlEditor?.refresh) {
        this.$refs.yamlEditor.refresh();
      }
    },

    updateTemplateId() {
      this.templateVersionId = '';
    }
  },
};
</script>

<template>
  <div id="vm">
    <CruResource
      :done-route="doneRoute"
      :resource="value"
      :can-yaml="false"
      :mode="mode"
      :errors="errors"
      :apply-hooks="applyHooks"
      @finish="saveVM"
    >
      <RadioGroup
        v-if="isCreate"
        v-model="isSingle"
        class="mb-20"
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
            @input="validataCount"
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
            :cpu="spec.template.spec.domain.cpu.cores"
            :memory="memory"
            :mode="mode"
            @updateCpuMemory="updateCpuMemory"
          />

          <SSHKey
            v-model="sshKey"
            class="mb-20"
            :namespace="value.metadata.namespace"
            :mode="mode"
            @update:sshKey="updateSSHKey"
          />
        </Tab>

        <Tab
          name="Volume"
          :label="t('harvester.tab.volume')"
          :weight="-1"
        >
          <Volume
            v-model="diskRows"
            :mode="mode"
            :custom-volume-mode="customVolumeMode"
            :namespace="value.metadata.namespace"
            :vm="value"
          />
        </Tab>

        <Tab
          name="Network"
          :label="t('harvester.tab.network')"
          :weight="-2"
        >
          <Network v-model="networkRows" :mode="mode" />
        </Tab>

        <Tab :label="t('workload.container.titles.nodeScheduling')" name="nodeScheduling" :weight="-3">
          <NodeScheduling :mode="mode" :value="spec.template.spec" :nodes="nodesIdOptions" />
        </Tab>

        <Tab
          name="advanced"
          :label="t('harvester.tab.advanced')"
          :weight="-4"
        >
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="hostname"
                :label-key="hostnameLabel"
                :placeholder="hostPlaceholder"
                required
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

          <CloudConfig
            ref="yamlEditor"
            :user-script="userScript"
            :mode="mode"
            :network-script="networkScript"
            @updateCloudConfig="updateCloudConfig"
          />

          <Checkbox
            v-model="isUseMouseEnhancement"
            class="check mt-20"
            type="checkbox"
            label-key="harvester.virtualMachine.enableUsb"
            :mode="mode"
          />

          <Checkbox
            v-model="installAgent"
            class="check"
            type="checkbox"
            label-key="harvester.virtualMachine.installAgent"
            :mode="mode"
          />
        </Tab>
      </Tabbed>

      <div class="mt-20">
        <Checkbox
          v-if="!isEdit"
          v-model="isRunning"
          class="check mb-20"
          type="checkbox"
          label-key="harvester.virtualMachine.createRunning"
          :mode="mode"
        />

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
  ::v-deep .radio-group {
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

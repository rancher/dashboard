<script>
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { mapGetters } from 'vuex';
import { safeLoad, safeDump } from 'js-yaml';

import Banner from '@/components/Banner';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import RadioGroup from '@/components/form/RadioGroup';
import LabeledInput from '@/components/form/LabeledInput';
import LabeledSelect from '@/components/form/LabeledSelect';
import NameNsDescription from '@/components/form/NameNsDescription';

import SSHKey from '@/edit/kubevirt.io.virtualmachine/SSHKey';
import Volume from '@/edit/kubevirt.io.virtualmachine/volume';
import Network from '@/edit/kubevirt.io.virtualmachine/network';
import ImageSelect from '@/edit/kubevirt.io.virtualmachine/Image';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/CpuMemory';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/CloudConfig';

import { HCI } from '@/config/types';
import { cleanForNew } from '@/plugins/steve/normalize';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

import VM_MIXIN from '@/mixins/vm';
import CreateEditView from '@/mixins/create-edit-view';

export default {
  name: 'EditVM',

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
    ImageSelect,
    CloudConfig,
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    const cloneDeepVM = cloneDeep(this.value);
    const isRestartImmediately = this.value.actualState === 'Running';

    return {
      cloneDeepVM,
      count:                 1,
      realHostname:          '',
      templateId:          '',
      templateVersion:       '',
      isSingle:              true,
      isRunning:             true,
      useTemplate:           false,
      isRestartImmediately,
    };
  },

  computed: {
    ...mapGetters({ t: 'i18n/t' }),

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

    curTemplateResource() {
      return this.templates.find( O => O.id === this.templateId);
    },

    curVersionResource() {
      return this.versions.find( O => O.id === this.templateVersion);
    },

    nameLabel() {
      return this.isSingle ? 'harvester.vmPage.nameNsDescription.name.singleLabel' : 'harvester.vmPage.nameNsDescription.name.multipleLabel';
    },

    hostnameLabel() {
      return this.isSingle ? 'harvester.vmPage.hostName.label' : 'harvester.vmPage.hostPrefixName.label';
    },

    hostname: { // 待分析
      get() {
        return this.spec?.template?.spec?.hostname;
      },

      set(neu) {
        try {
          this.useCustomHostname = false;
          if (neu || neu.length > 0) {
            this.useCustomHostname = true;
            const oldCloudConfig = safeLoad(this.getCloudInit());

            oldCloudConfig.hostname = neu;

            this.$set(this.spec.template.spec, 'hostname', neu);
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log('---watch hostname has error');
        }
      }
    },
  },

  watch: {
    templateId(id) {
      if (!id) {
        return;
      }

      this.templateVersion = this.templates.find( O => O.id === id)?.defaultVersionId;
    },

    templateVersion(id) {
      if (!id) {
        return;
      }

      const curVersion = this.versions.find( V => V.id === id);
      const sshKey = curVersion.spec?.keyPairIds || []; // 这里面后端好像没保存keyPairIds

      const cloudScript = curVersion?.spec?.vm?.template?.spec?.volumes?.find( (V) => {
        return V.cloudInitNoCloud !== undefined;
      })?.cloudInitNoCloud; // TODO: use modals

      this.$set(this, 'userScript', cloudScript?.userData);
      this.$set(this, 'networkScript', cloudScript?.networkData);
      this.$set(this, 'sshKey', sshKey);
      // this.$refs.ssh.updateSSH(sshKey);
      this.value.spec = curVersion?.spec?.vm;
      this.changeSpec();
    },

    useTemplate(neu) {
      if (neu === false) {
        this.value.applyDefaults();
        this.changeSpec();
        this.templateId = '';
        this.templateVersion = '';
      }
    },

    installAgent(neu) {
      let parsed = {};

      if (neu) {
        parsed = this.mergeGuestAgent(cloneDeep(this.userScript));
      } else {
        parsed = this.deleteGuestAgent(cloneDeep(this.userScript));
      }
      let out = safeDump(parsed);

      if (parsed === '') {
        out = undefined;
      }

      this.$set(this, 'userScript', out);
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

    this.registerFailureHook(() => {
      this.$set(this.value, 'type', HCI.VM);
    });

    this.registerAfterHook(() => { // may need to restart VM when editing
      if ( this.mode === 'edit' && this.value.hasAction('restart')) {
        const cloneDeepNewVM = cloneDeep(this.value);

        delete cloneDeepNewVM.type;
        delete this.cloneDeepVM.type;
        delete cloneDeepNewVM?.metadata;
        delete this.cloneDeepVM?.metadata;

        const dataVolumeTemplates = this.cloneDeepVM?.spec?.dataVolumeTemplates || [];

        for (let i = 0; i < dataVolumeTemplates.length; i++) {
          delete this.cloneDeepVM.spec.dataVolumeTemplates[i]?.metadata?.creationTimestamp;
        }

        const oldValue = JSON.parse(JSON.stringify(this.cloneDeepVM));
        const newValue = JSON.parse(JSON.stringify(cloneDeepNewVM));

        if (!isEqual(oldValue, newValue) && this.isRestartImmediately) {
          this.value.doAction('restart', {});
        }
      }
    });
  },

  mounted() {
    this.imageName = this.$route.query?.image || this.imageName;

    const templateId = this.$route.query?.templateId;
    const templateVersion = this.$route.query?.version;

    if (templateId && templateVersion) {
      this.templateId = templateId;
      this.templateVersion = templateVersion;
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
      const url = `v1/${ HCI.VM }s`;

      this.normalizeSpec();
      const realHostname = this.useCustomHostname ? this.value.spec.template.spec.hostname : this.value.metadata.name;

      this.$set(this.value.spec.template.spec, 'hostname', realHostname);
      await this.save(buttonCb, url);
    },

    async saveMultiple(buttonCb) {
      const baseName = this.value.metadata.name || '';
      const baseHostname = this.useCustomHostname ? this.value.spec.template.spec.hostname : this.value.metadata.name;
      const join = baseName.endsWith('-') ? '' : '-';
      const countLength = this.count.toString().length;

      if (this.count < 1 || this.count === undefined) {
        this.errors = ['"Count" should be between 1 and 10'];
        buttonCb(false);

        return;
      }

      for (let i = 1; i <= this.count; i++) {
        this.$set(this.value, 'type', HCI.VM);

        const suffix = i?.toString()?.padStart(countLength, '0');

        cleanForNew(this.value);
        this.value.metadata.name = `${ baseName }${ join }${ suffix }`;
        const hostname = `${ baseHostname }${ join }${ suffix }`;

        this.normalizeSpec();
        this.$set(this.value.spec.template.spec, 'hostname', hostname);

        try {
          await this.save(buttonCb);
        } catch (err) {
          return Promise.reject(new Error(err));
        }
      }
      this.value.id = '';
    },

    changeSpec() {
      const spec = this.value.spec;
      const diskRows = this.getDiskRows(spec);
      const networkRows = this.getNetworkRows(spec);
      const imageName = this.getRootImage(spec);

      if (imageName) {
        this.autoChangeForImage = false;
      }

      this.$set(this, 'spec', spec);
      this.$set(this, 'diskRows', diskRows);
      this.$set(this, 'networkRows', networkRows);
      this.$set(this, 'imageName', imageName);
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
      @apply-hooks="applyHooks"
      @finish="saveVM"
    >
      <div v-if="isCreate" class="mb-20">
        <RadioGroup
          v-model="isSingle"
          name="createInstanceMode"
          :options="[true,false]"
          :labels="[t('harvester.vmPage.input.singleInstance'), t('harvester.vmPage.input.multipleInstance')]"
        />
      </div>

      <NameNsDescription
        v-model="value"
        :mode="mode"
        :has-extra="!isSingle"
        :name-label="nameLabel"
        :namespaced="true"
        :name-placeholder="isSingle ? 'nameNsDescription.name.placeholder' : 'harvester.vmPage.multipleVMInstance.nameNsDescription'"
        :extra-columns="isSingle ? [] :['type']"
      >
        <template v-slot:type>
          <LabeledInput
            v-if="!isSingle"
            v-model.number="count"
            v-int-number
            type="number"
            :label="t('harvester.fields.count')"
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
        label-key="harvester.vmPage.useTemplate"
      />

      <div v-if="useTemplate" class="row mb-20">
        <div class="col span-6">
          <LabeledSelect
            v-model="templateId"
            label-key="harvester.vmPage.input.template"
            :options="templateOptions"
          />
        </div>

        <div class="col span-6">
          <LabeledSelect
            v-model="templateVersion"
            label-key="harvester.vmPage.input.version"
            :options="versionOptions"
          />
        </div>
      </div>

      <Tabbed :side-tabs="true" @changed="onTabChanged">
        <Tab name="Basics" :label="t('harvester.vmPage.detail.tabs.basics')">
          <CpuMemory :cpu="spec.template.spec.domain.cpu.cores" :memory="memory" @updateCpuMemory="updateCpuMemory" />

          <div class="mb-20">
            <ImageSelect v-model="imageName" :disk-rows="diskRows" :disabled="!isCreate" />
          </div>

          <div class="mb-20">
            <SSHKey v-model="sshKey" :namespace="value.metadata.namespace" @update:sshKey="updateSSHKey" />
          </div>
        </Tab>

        <Tab
          name="Volume"
          :label="t('harvester.tab.volume')"
          :weight="-1"
        >
          <Volume v-model="diskRows" :mode="mode" :custom-volume-mode="customVolumeMode" />
        </Tab>

        <Tab
          name="Network"
          :label="t('harvester.tab.network')"
          :weight="-2"
        >
          <Network v-model="networkRows" :mode="mode" />
        </Tab>

        <Tab
          name="advanced"
          :label="t('harvester.tab.advanced')"
          :weight="-3"
        >
          <div class="row mb-20">
            <div class="col span-6">
              <LabeledInput
                v-model="hostname"
                :label-key="hostnameLabel"
                :placeholder="t('harvester.vmPage.hostName.placeholder')"
                required
              />
            </div>

            <div class="col span-6">
              <LabeledSelect
                v-model="machineType"
                label-key="harvester.vmPage.input.MachineType"
                :options="machineTypeOptions"
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

          <div class="spacer"></div>
          <Checkbox v-model="isUseMouseEnhancement" class="check" type="checkbox" :label="t('harvester.vmPage.enableUsb')" />

          <Checkbox v-model="installAgent" class="check" type="checkbox" label="Install guest agent" />
        </Tab>
      </Tabbed>

      <template #extend>
        <div class="mt-20">
          <div v-if="!isEdit">
            <Checkbox v-model="isRunning" class="check mb-20" type="checkbox" :label="t('harvester.vmPage.createRunning')" />
          </div>

          <div v-if="isEdit" class="restart">
            <div class="banner-content">
              <Banner color="warning" class="banner-right">
                Restart the virtual machine now to take effect of the configuration changes.

                <Checkbox v-model="isRestartImmediately" class="check ml-20" type="checkbox" label="Restart Now" />
              </Banner>
            </div>
          </div>
        </div>
      </template>
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
    display: flex;
    justify-content: flex-end;
  }

  .banner-content {
    display: inline-block;
  }
}
</style>

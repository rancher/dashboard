<script>
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Checkbox from '@/components/form/Checkbox';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';

import Volume from '@/edit/kubevirt.io.virtualmachine/VirtualMachineVolume';
import Network from '@/edit/kubevirt.io.virtualmachine/VirtualMachineNetwork';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/VirtualMachineCpuMemory';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/VirtualMachineCloudConfig';
import SSHKey from '@/edit/kubevirt.io.virtualmachine/VirtualMachineSSHKey';

import { HCI } from '@/config/types';
import { randomStr } from '@/utils/string';
import { _CONFIG, _EDIT, _VIEW } from '@/config/query-params';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';

import VM_MIXIN from '@/mixins/harvester-vm';
import CreateEditView from '@/mixins/create-edit-view';

export default {
  name: 'HarvesterEditVMTemplate',

  components: {
    Tab,
    SSHKey,
    Volume,
    Tabbed,
    Network,
    Checkbox,
    CpuMemory,
    CruResource,
    CloudConfig,
    NameNsDescription
  },

  mixins: [CreateEditView, VM_MIXIN],

  props: {
    value: {
      type:     Object,
      required: true,
    },
  },

  data() {
    if (this.mode === _EDIT) {
      this.value = this.value.cleanForNew();
    }

    const templateId = this.value.templateId || this.$route.query.templateId;

    return {
      templateId,
      templateValue:    null,
      templateSpec:     null,
      versionName:      '',
      description:      '',
      defaultVersion:   null,
      isDefaultVersion: false,
      keyPairIds:       [],
    };
  },

  computed: {
    isConfig() {
      return this.$route.query?.as === _CONFIG;
    },

    realTemplateMode() {
      return this.templateId ? _VIEW : this.mode;
    }
  },

  watch: {
    sshKey: {
      handler(neu) {
        this.keyPairIds = neu;
      },
      immediate: true
    },

    templateId: {
      async handler(neu) {
        const templates = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_TEMPLATE });
        let templateValue = templates.find( V => V.id === neu) || null;
        let templateSpec = templateValue?.spec;

        if (!templateValue) {
          templateSpec = {
            description:      '',
            defaultVersionId: ''
          };

          templateValue = await this.$store.dispatch('harvester/create', {
            metadata: {
              name:      '',
              namespace: ''
            },
            spec:     templateSpec,
            type:     HCI.VM_TEMPLATE
          });
        }

        this.templateValue = templateValue;
        this.templateSpec = templateSpec;
      },
      immediate: true
    }
  },

  created() {
    this.registerBeforeHook(() => {
      Object.assign(this.spec.template.metadata.annotations, { [HCI_ANNOTATIONS.SSH_NAMES]: JSON.stringify(this.sshKey) });
    });

    this.registerAfterHook(async() => {
      if (this.isDefaultVersion) {
        // Set the default version according to annotation:[HCI_ANNOTATIONS.TEMPLATE_VERSION_CUSTOM_NAME]
        const versions = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_VERSION, opt: { force: true } });

        const version = versions.find( V => V?.metadata?.annotations?.[HCI_ANNOTATIONS.TEMPLATE_VERSION_CUSTOM_NAME] === this.customName);

        if (version) {
          try {
            this.templateValue.defaultVersionId = version.id;

            const data = [{
              op: 'replace', path: '/spec/defaultVersionId', value: version.id
            }];

            await this.templateValue.patch( data, { url: this.templateValue.linkFor('view') });
          } catch (err) {
            return Promise.reject(new Error(err.message));
          }
        }
      }
    });
  },

  mounted() {
    this.imageId = this.diskRows[0].image || '';
  },

  methods: {
    async saveVMT(buttonCb) {
      this.parseVM();

      const templates = await this.$store.dispatch('harvester/findAll', { type: HCI.VM_TEMPLATE });
      const template = templates.find( O => O.metadata.name === this.templateValue.metadata.name);

      if (!this.templateId) {
        if (this.templateValue?.metadata?.name) {
          try {
            await this.templateValue.save();
          } catch (err) {
            this.errors = [err];
          }
        } else {
          this.errors = ['"Name" is required'];
          buttonCb(false);

          return;
        }
      } else {
        template.save();
      }

      this.value.cleanForNew();
      this.customName = randomStr(10);
      this.$set(this.value.metadata, 'annotations', {
        ...this.value.metadata.annotations,
        [HCI_ANNOTATIONS.TEMPLATE_VERSION_CUSTOM_NAME]: this.customName
      });

      const name = this.templateValue.metadata.name || template.metadata.name;
      const namespace = this.templateValue.metadata.namespace || template.metadata.namespace;

      if (this.isCreate) {
        this.value.metadata.namespace = namespace;
      }

      this.$set(this.value.spec, 'templateId', `${ namespace }/${ name }`);
      this.$set(this.value.spec, 'keyPairIds', this.keyPairIds);
      this.$set(this.value.spec.vm, 'spec', this.spec);
      await this.save(buttonCb);
    },

    updateCpuMemory(cpu, memory) {
      this.$set(this.spec.template.spec.domain.cpu, 'cores', cpu);
      this.$set(this, 'memory', memory);
    },

    onTabChanged({ tab }) {
      if (tab.name === 'advanced' && this.$refs.yamlEditor?.refresh) {
        this.$refs.yamlEditor.refresh();
      }
    }
  },
};
</script>

<template>
  <CruResource
    v-if="templateSpec"
    :done-route="doneRoute"
    :resource="value"
    :can-yaml="false"
    :mode="mode"
    :errors="errors"
    :apply-hooks="applyHooks"
    @finish="saveVMT"
  >
    <NameNsDescription
      v-model="templateValue"
      :mode="realTemplateMode"
      name-label="harvester.vmTemplate.nameNsDescription.name"
      :namespaced="true"
    />

    <Checkbox v-if="templateId" v-model="isDefaultVersion" class="mb-20" :label="t('tableHeaders.defaultVersion')" type="checkbox" />

    <Tabbed :side-tabs="true" @changed="onTabChanged">
      <Tab name="Basics" :label="t('harvester.vmTemplate.tabs.basics')">
        <CpuMemory :cpu="spec.template.spec.domain.cpu.cores" :memory="memory" :mode="mode" :disabled="isConfig" @updateCpuMemory="updateCpuMemory" />

        <div class="mb-20">
          <SSHKey v-model="sshKey" :disable-create="isView" @update:sshKey="updateSSHKey" />
        </div>
      </Tab>

      <Tab name="Volume" :label="t('harvester.tab.volume')" :weight="-1">
        <Volume v-model="diskRows" :mode="mode" :namespace="value.metadata.namespace" :existing-volume-disabled="true" />
      </Tab>

      <Tab name="Network" :label="t('harvester.tab.network')" :weight="-2">
        <Network v-model="networkRows" :mode="mode" />
      </Tab>

      <Tab name="advanced" :label="t('harvester.tab.advanced')" :weight="-3">
        <CloudConfig ref="yamlEditor" :user-script="userScript" :network-script="networkScript" @updateCloudConfig="updateCloudConfig" />

        <div class="spacer"></div>
        <Checkbox v-model="isUseMouseEnhancement" class="check" type="checkbox" :label="t('harvester.virtualMachine.enableUsb')" />

        <Checkbox
          v-model="installAgent"
          class="check"
          type="checkbox"
          label-key="harvester.virtualMachine.installAgent"
          :mode="mode"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

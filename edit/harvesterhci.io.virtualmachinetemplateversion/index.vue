<script>
import cloneDeep from 'lodash/cloneDeep';
import randomstring from 'randomstring';
import Checkbox from '@/components/form/Checkbox';
import Tabbed from '@/components/Tabbed';
import Tab from '@/components/Tabbed/Tab';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import NameNsDescription from '@/components/form/NameNsDescription';

import Volume from '@/edit/kubevirt.io.virtualmachine/volume';
import Network from '@/edit/kubevirt.io.virtualmachine/network';
import CpuMemory from '@/edit/kubevirt.io.virtualmachine/CpuMemory';
import CloudConfig from '@/edit/kubevirt.io.virtualmachine/CloudConfig';
import ImageSelect from '@/edit/kubevirt.io.virtualmachine/Image';
import SSHKey from '@/edit/kubevirt.io.virtualmachine/SSHKey';

import { HCI } from '@/config/types';
import { allHash } from '@/utils/promise';
import { _CONFIG } from '@/config/query-params';
import { HCI as HCI_ANNOTATIONS } from '@/config/labels-annotations';
import { cleanForNew } from '@/plugins/steve/normalize';

import CreateEditView from '@/mixins/create-edit-view';
import VM_MIXIN from '@/mixins/vm';

export default {
  name: 'EditVMTemplate',

  components: {
    Loading,
    Volume,
    Network,
    CruResource,
    CpuMemory,
    ImageSelect,
    SSHKey,
    Checkbox,
    Tabbed,
    Tab,
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

  async fetch() {
    const hash = await allHash({
      templates:  this.$store.dispatch('cluster/findAll', { type: HCI.VM_TEMPLATE }),
      versions:   this.$store.dispatch('cluster/findAll', { type: HCI.VM_VERSION }),
    });

    let templateId = this.$route.query.templateId;
    let versionId = this.$route.query.versionId;

    if (this.$route.query?.as === _CONFIG) {
      templateId = this?.value?.spec?.templateId;
      versionId = this?.value?.id;
    }

    let templateValue = hash.templates.find( V => V.id === templateId) || null;
    let templateSpec = templateValue?.spec;

    if (!templateValue) {
      templateSpec = {
        description:      '',
        defaultVersionId: ''
      };

      templateValue = await this.$store.dispatch('cluster/create', {
        metadata: {
          name:      '',
          namespace: 'default'
        },
        spec:     templateSpec,
        type:     HCI.VM_TEMPLATE
      });
    }

    if (versionId) {
      const versionValue = hash.versions.find( V => V.id === versionId);

      const cloneDeepVersion = cloneDeep(versionValue);

      this.value.spec = cloneDeepVersion.spec;
      this.value.spec.vm = cloneDeepVersion.spec.vm;
    }

    this.templateId = templateId;
    this.versionId = versionId;
    this.templateValue = templateValue;
    this.templateSpec = templateSpec;
  },

  data() {
    return {
      templateId:       '',
      templateValue:    {},
      templateSpec:     {},
      versionName:      '',
      description:      '',
      defaultVersion:   null,
      isDefaultVersion: false,
      keyPairIds:       [],
    };
  },

  computed: {
    isEditVersion() {
      return !!this.$route.query.templateId;
    },

    isConfig() {
      return this.$route.query?.as === _CONFIG;
    },
  },

  watch: {
    sshKey(neu) {
      const out = [];

      this.ssh.map( (I) => {
        if (neu.includes(I.metadata.name)) {
          const name = `${ I.metadata.namespace }/${ I.metadata.name }`;

          out.push(name);
        }
      });

      this.keyPairIds = out;
    }
  },

  created() {
    this.registerBeforeHook(() => {
      Object.assign(this.spec.template.metadata.annotations, { [HCI_ANNOTATIONS.SSH_NAMES]: JSON.stringify(this.sshKey) });
    });

    this.registerAfterHook(async() => {
      if (this.isDefaultVersion) {
        // Set the default version according to annotation:[HCI_ANNOTATIONS.TEMPLATE_VERSION_CUSTOM_NAME]
        const versions = await this.$store.dispatch('cluster/findAll', { type: HCI.VM_VERSION, opt: { force: true } });

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
    const imageName = this.diskRows[0].image || '';

    this.imageName = imageName;
  },

  methods: {
    async saveVMT(buttonCb) {
      this.normalizeSpec();

      const templates = await this.$store.dispatch('cluster/findAll', { type: HCI.VM_TEMPLATE });
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

      cleanForNew(this.value);
      this.customName = randomstring.generate(10);
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
      this.$set(this.value.spec, 'vm', this.spec);
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
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :done-route="doneRoute"
    :resource="value"
    :can-yaml="false"
    :mode="mode"
    :errors="errors"
    @apply-hooks="applyHooks"
    @finish="saveVMT"
  >
    <NameNsDescription
      v-model="templateValue"
      :mode="mode"
      :name-disabled="isEditVersion || isConfig"
      :namespace-disabled="isEditVersion || isConfig"
      name-label="harvester.templatePage.name"
      :namespaced="true"
    />

    <Checkbox v-if="isEditVersion" v-model="isDefaultVersion" class="mb-20" :label="t('harvester.templatePage.defaultVersion')" type="checkbox" />

    <Tabbed :side-tabs="true" @changed="onTabChanged">
      <Tab name="Basics" :label="t('harvester.vmPage.detail.tabs.basics')">
        <CpuMemory :cpu="spec.template.spec.domain.cpu.cores" :memory="memory" :disabled="isConfig" @updateCpuMemory="updateCpuMemory" />

        <div class="mb-20">
          <ImageSelect v-model="imageName" :disk-rows="diskRows" :required="false" :disabled="!isCreate" />
        </div>

        <div class="mb-20">
          <SSHKey v-model="sshKey" :disable-create="isView" @update:sshKey="updateSSHKey" />
        </div>
      </Tab>

      <Tab
        name="Volume"
        :label="t('harvester.tab.volume')"
        :weight="-1"
      >
        <Volume v-model="diskRows" :mode="mode" />
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
        <CloudConfig ref="yamlEditor" :user-script="userScript" :network-script="networkScript" @updateCloudConfig="updateCloudConfig" />

        <div class="spacer"></div>
        <Checkbox v-model="isUseMouseEnhancement" class="check" type="checkbox" :label="t('harvester.vmPage.enableUsb')" />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

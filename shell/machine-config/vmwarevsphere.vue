<script>
import Loading from '@shell/components/Loading';
import CreateEditView from '@shell/mixins/create-edit-view';
import LabeledSelect from '@shell/components/form/LabeledSelect';
// import { Checkbox } from '@components/Form/Checkbox';
import { exceptionToErrorsArray, stringify } from '@shell/utils/error';
import { Banner } from '@components/Banner';
import UnitInput from '@shell/components/form/UnitInput';
import { Card } from '@components/Card';
import { RadioGroup } from '@components/Form/Radio';
import KeyValue from '@shell/components/form/KeyValue';
import { LabeledInput } from '@components/Form/LabeledInput';
import ArrayListSelect from '@shell/components/form/ArrayListSelect';
import YamlEditor from '@shell/components/YamlEditor';
import { get, set } from '@shell/utils/object';
import { integerString, keyValueStrings } from '@shell/utils/computed';
import { _CREATE } from '@shell/config/query-params';

const SENTINEL = '__SENTINEL__';
const VAPP_MODE = {
  DISABLED: 'disabled',
  AUTO:     'auto',
  MANUAL:   'manual'
};
const CREATION_METHOD = {
  TEMPLATE: 'template',
  LIBRARY:  'library',
  VM:       'vm',
  LEGACY:   'legacy'
};
const BOOT_2_DOCKER_URL = 'https://releases.rancher.com/os/latest/rancheros-vmware.iso';
const INITIAL_VAPP_OPTIONS = {
  vappIpprotocol:         '',
  vappIpallocationpolicy: '',
  vappTransport:          '',
  vappProperty:           []
};
const OS_OPTIONS = [
  'linux',
  'windows'
];
const DEFAULT_CFGPARAM = ['disk.enableUUID=TRUE'];

const getDefaultVappOptions = (networks) => {
  return {
    vappIpprotocol:         'IPv4',
    vappIpallocationpolicy: 'fixedAllocated',
    vappTransport:          'com.vmware.guestInfo',
    vappProperty:           networksToVappProperties(networks)
  };
};

const stringsToParams = (params, str) => {
  const index = str.indexOf('=');

  if ( index > -1 ) {
    params.push({
      key:   str.slice(0, index),
      value: str.slice(index + 1),
    });
  }

  return params;
};

const networksToVappProperties = (networks) => {
  if (networks.length === 0) {
    return [];
  }

  return networks.reduce(networkToVappProperties, [
    `guestinfo.dns.servers=\${dns:${ networks[0] }}`,
    `guestinfo.dns.domains=\${searchPath:${ networks[0] }}`
  ]);
};

const networkToVappProperties = (props, network, i) => {
  const n = i.toString();

  props.push(
    `guestinfo.interface.${ n }.ip.0.address=ip:${ network }`,
    `guestinfo.interface.${ n }.ip.0.netmask=\${netmask:${ network }}`,
    `guestinfo.interface.${ n }.route.0.gateway=\${gateway:${ network }}`
  );

  return props;
};

const getInitialVappMode = (c) => {
  const vappProperty = c.vappProperty || [];

  if (
    !c.vappIpprotocol &&
    !c.vappIpallocationpolicy &&
    !c.vappTransport &&
    vappProperty.length === 0
  ) {
    return VAPP_MODE.DISABLED;
  }

  const d = getDefaultVappOptions(c.network);

  if (
    c.vappIpprotocol === d.vappIpprotocol &&
    c.vappIpallocationpolicy === d.vappIpallocationpolicy &&
    c.vappTransport === d.vappTransport &&
    vappProperty.length === d.vappProperty.length &&
    vappProperty.join() === d.vappProperty.join()
  ) {
    return VAPP_MODE.AUTO;
  }

  return VAPP_MODE.MANUAL;
};

/**
 * passing 'datacenter' yields
 *
 * {
 *    datacenter() {
 *       return this.datacenterResults || [];
 *    },
 *    datacenterLoading() {
 *       return this.datacenterLoading === null;
 *    }
 * }
 */
function createOptionHelpers(name) {
  return {
    [name]() {
      return this[`${ name }Results`] || [];
    },
    [`${ name }Loading`]() {
      return this[`${ name }Results`] === null;
    }
  };
}

export default {
  components: {
    ArrayListSelect, Card, KeyValue, Loading, LabeledInput, LabeledSelect, Banner, UnitInput, RadioGroup, YamlEditor
  },

  mixins: [CreateEditView],

  props: {
    credentialId: {
      type:     String,
      required: true,
    },
    disabled: {
      type:    Boolean,
      default: false
    },
  },

  async fetch() {
    this.errors = [];

    try {
      const datacenterAlreadySet = !!this.value.datacenter;

      await this.loadDataCenters();

      if (datacenterAlreadySet) {
        this.loadAllDatacenterResources();
      }
    } catch (e) {
      this.errors = exceptionToErrorsArray(e);
    }
  },

  data() {
    const vAppOptions = [
      {
        label: this.t('cluster.machineConfig.vsphere.vAppOptions.disable'),
        value: VAPP_MODE.DISABLED
      },
      {
        label: this.t('cluster.machineConfig.vsphere.vAppOptions.auto'),
        value: VAPP_MODE.AUTO
      },
      {
        label: this.t('cluster.machineConfig.vsphere.vAppOptions.manual'),
        value: VAPP_MODE.MANUAL
      },
    ];

    const creationMethods = [
      {
        label: this.t('cluster.machineConfig.vsphere.creationMethods.template'),
        value: CREATION_METHOD.TEMPLATE
      },
      {
        label: this.t('cluster.machineConfig.vsphere.creationMethods.library'),
        value: CREATION_METHOD.LIBRARY
      },
      {
        label: this.t('cluster.machineConfig.vsphere.creationMethods.vm'),
        value: CREATION_METHOD.VM
      },
      {
        label: this.t('cluster.machineConfig.vsphere.creationMethods.legacy'),
        value: CREATION_METHOD.LEGACY
      },
    ];

    if (this.mode === _CREATE && !this.value.initted) {
      Object.defineProperty(this.value, 'initted', { value: true, enumerable: false });

      set(this.value, 'creationType', creationMethods[0].value);
      set(this.value, 'cpuCount', '2');
      set(this.value, 'diskSize', '20000');
      set(this.value, 'memorySize', '4096');
      set(this.value, 'hostsystem', '');
      set(this.value, 'cloudConfig', '#cloud-config\n\n');
      set(this.value, 'cfgparam', DEFAULT_CFGPARAM);
      set(this.value, 'vappProperty', this.value.vappProperty);
      set(this.value, 'os', OS_OPTIONS[0]);
      Object.entries(INITIAL_VAPP_OPTIONS).forEach(([key, value]) => {
        set(this.value, key, value);
      });
    }

    return {
      initted:                  false,
      credential:               null,
      creationMethods,
      dataCentersResults:       null,
      resourcePoolsResults:     null,
      dataStoresResults:        null,
      dataStoreClustersResults: null,
      foldersResults:           null,
      hostsResults:             null,
      templatesResults:         null,
      contentLibrariesResults:  null,
      libraryTemplatesResults:  null,
      virtualMachinesResults:   null,
      showTemplatesResults:     null,
      tagsResults:              null,
      attributeKeysResults:     null,
      networksResults:          null,
      haveTags:                 null,
      haveAttributes:           null,
      haveTemplates:            null,
      vAppOptions,
      vappMode:                 getInitialVappMode(this.value),
      osOptions:                OS_OPTIONS,
    };
  },

  computed: {
    ...createOptionHelpers('dataCenters'),
    ...createOptionHelpers('resourcePools'),
    ...createOptionHelpers('dataStores'),
    ...createOptionHelpers('dataStoreClusters'),
    ...createOptionHelpers('folders'),
    ...createOptionHelpers('hosts'),
    ...createOptionHelpers('templates'),
    ...createOptionHelpers('contentLibraries'),
    ...createOptionHelpers('libraryTemplates'),
    ...createOptionHelpers('virtualMachines'),
    ...createOptionHelpers('showTemplates'),
    ...createOptionHelpers('tags'),
    ...createOptionHelpers('attributeKeys'),
    ...createOptionHelpers('networks'),

    showTemplate() {
      return this.value.creationType === 'template';
    },

    showContentLibrary() {
      return this.value.creationType === 'library';
    },

    showVirtualMachines() {
      return this.value.creationType === 'vm';
    },

    showIso() {
      return this.value.creationType === 'legacy';
    },

    showManual() {
      return this.vappMode === 'manual';
    },

    failedToLoadTemplates() {
      return !this.templatesLoading && !this.haveTemplates;
    },

    templateStatus() {
      return this.failedToLoadTemplates ? 'error' : null;
    },

    templateTooltip() {
      return this.failedToLoadTemplates ? this.t('cluster.machineConfig.vsphere.instanceOptions.template.none') : null;
    },

    host: {
      get() {
        return this.value.hostsystem === '' ? SENTINEL : this.value.hostsystem;
      },
      set(value) {
        const newValue = value === SENTINEL ? '' : value;

        set(this.value, 'hostsystem', newValue);
      }
    },

    customAttribute: keyValueStrings('value.customAttribute'),
    vappProperty:    keyValueStrings('value.vappProperty'),
    cfgparam:        keyValueStrings('value.cfgparam'),

    cpuCount:   integerString('value.cpuCount'),
    memorySize: integerString('value.memorySize'),
    diskSize:   integerString('value.diskSize'),

    showCloudConfigYaml() {
      return this.value.creationType !== 'legacy';
    },
  },

  watch: {
    credentialId(neu, old) {
      if ( neu !== old ) {
        this.$fetch();
      }
    },
    'value.datacenter'() {
      this.loadAllDatacenterResources();
    },
    'value.contentLibrary'() {
      this.loadLibraryTemplates();
    },
    'value.creationType'(value) {
      set(this.value, 'cloneFrom', '');
      const boot2dockerUrl = value === CREATION_METHOD.LEGACY ? BOOT_2_DOCKER_URL : '';

      set(this.value, 'boot2dockerUrl', boot2dockerUrl);
    },
    vappMode(value) {
      if (value === VAPP_MODE.AUTO) {
        const defaultVappOptions = getDefaultVappOptions(this.value.network);

        return this.updateVappOptions(defaultVappOptions);
      }

      this.updateVappOptions(INITIAL_VAPP_OPTIONS);
    }
  },

  methods: {
    stringify,
    async requestOptions(resource, dataCenter, library) {
      const datacenterLessResources = ['tag-categories', 'tags', 'data-centers', 'custom-attributes'];

      if (!this.credentialId || (!datacenterLessResources.includes(resource) && !dataCenter)) {
        return [];
      }

      const queryParams = Object.entries({
        cloudCredentialId: this.credentialId,
        dataCenter,
        library
      })
        .filter(entry => entry[1])
        .map(entry => `${ entry[0] }=${ entry[1] }`)
        .join('&');

      const url = `/meta/vsphere/${ resource }?${ queryParams }`;

      const result = await this.$store.dispatch('management/request', {
        url,
        redirectUnauthorized: false,
      }, { root: true });

      return result.data;
    },

    async loadDataCenters() {
      const options = await this.requestOptions('data-centers');
      const content = this.mapPathOptionsToContent(options);
      const valueInContent = content.find(c => c.value === this.value.datacenter );

      if (!valueInContent) {
        set(this.value, 'datacenter', options[0]);
        set(this.value, 'cloneFrom', undefined);
        set(this.value, 'useDataStoreCluster', false);
      }

      set(this, 'dataCentersResults', content);
    },

    async loadTags() {
      try {
        set(this, 'tagsResults', null);

        const categoriesPromise = this.requestOptions('tag-categories');
        const optionsPromise = this.requestOptions('tags');

        const [categories, options] = await Promise.all([categoriesPromise, optionsPromise]);
        const content = this.mapTagsToContent(options).map(option => ({
          ...option,
          category: categories.find(c => c.name === option.category)
        }));

        this.resetValueIfNecessary('tag', content, options, true);

        set(this, 'tagsResults', content);
        this.haveTags = true;
      } catch (e) {
        this.haveTags = false;
      }
    },

    async loadCustomAttributes() {
      try {
        set(this, 'attributeKeysResults', null);

        const options = await this.requestOptions('custom-attributes');

        set(this, 'attributeKeysResults', this.mapCustomAttributesToContent(options));
        this.haveAttributes = true;
      } catch (e) {
        this.haveAttributes = false;
      }
    },

    async loadHosts() {
      set(this, 'hostsResults', null);

      const options = await this.requestOptions('hosts', this.value.datacenter);
      const content = this.mapHostOptionsToContent(options);

      this.resetValueIfNecessary('hostsystem', content, options);

      set(this, 'hostsResults', content);
    },

    async loadResourcePools() {
      set(this, 'resourcePoolsResults', null);

      const options = await this.requestOptions('resource-pools', this.value.datacenter);

      const content = this.mapPoolOptionsToContent(options);

      this.resetValueIfNecessary('pool', content, options);

      set(this, 'resourcePoolsResults', content);
    },

    async loadDataStores() {
      set(this, 'dataStoresResults', null);

      const options = await this.requestOptions('data-stores', this.value.datacenter);
      const content = this.mapPathOptionsToContent(options);

      this.resetValueIfNecessary('datastore', content, options);

      set(this, 'dataStoresResults', content);
    },

    async loadDataStoreClusters() {
      set(this, 'dataStoreResults', null);

      const options = await this.requestOptions('data-store-clusters', this.value.datacenter);
      const content = this.mapPathOptionsToContent(options);

      this.resetValueIfNecessary('datastoreCluster', content, options);

      set(this, 'dataStoreClustersResults', content);
    },

    async loadFolders() {
      set(this, 'foldersResults', null);

      const options = await this.requestOptions('folders', this.value.datacenter);
      const content = this.mapFolderOptionsToContent(options);

      this.resetValueIfNecessary('folder', content, options);

      set(this, 'foldersResults', content);
    },

    async loadNetworks() {
      set(this, 'networksResults', null);

      const options = await this.requestOptions('networks', this.value.datacenter);
      const content = this.mapPathOptionsToContent(options);

      this.resetValueIfNecessary('network', content, options, true);

      set(this, 'networksResults', content);
    },

    async loadContentLibraries() {
      set(this, 'contentLibrariesResults', null);

      const options = await this.requestOptions('content-libraries', this.value.datacenter);
      const content = this.mapPathOptionsToContent(options)
        .filter(item => item.value !== '');

      this.resetValueIfNecessary('contentLibrary', content, options);

      set(this, 'contentLibrariesResults', content);
    },

    async loadLibraryTemplates() {
      set(this, 'libraryTemplatesResults', null);

      const contentLibrary = this.value.contentLibrary;

      if (!contentLibrary) {
        return [];
      }

      const options = await this.requestOptions('library-templates', this.value.datacenter, contentLibrary);
      const content = this.mapPathOptionsToContent(options);

      if (this.showContentLibrary) {
        this.resetValueIfNecessary('cloneFrom', content, options);
      }

      set(this, 'libraryTemplatesResults', content);
    },

    async loadVirtualMachines() {
      set(this, 'virtualMachinesResults', null);

      const options = await this.requestOptions('virtual-machines', this.value.datacenter);

      const content = this.mapPathOptionsToContent(options);

      if (this.showVirtualMachines) {
        this.resetValueIfNecessary('cloneFrom', content, options);
      }

      set(this, 'virtualMachinesResults', content);
    },

    async loadTemplates() {
      try {
        set(this, 'templatesResults', null);

        const options = await this.requestOptions('templates', this.value.datacenter);

        const content = this.mapPathOptionsToContent(options);

        if (this.showTemplate) {
          this.resetValueIfNecessary('cloneFrom', content, options);
        }

        set(this, 'templatesResults', content);
        this.haveTemplates = true;
      } catch (e) {
        this.haveTemplates = false;
      }
    },

    loadAllDatacenterResources() {
      this.loadResourcePools();
      this.loadDataStores();
      this.loadFolders();
      this.loadHosts();
      this.loadTemplates();
      this.loadTags();
      this.loadCustomAttributes();
      this.loadContentLibraries();
      this.loadLibraryTemplates();
      this.loadVirtualMachines();
      this.loadNetworks();
    },

    resetValueIfNecessary(key, content, options, isArray = false) {
      const isValueInContent = () => {
        if (isArray) {
          return this.value[key].every(value => content.find(c => c.value === value));
        }

        return content.find(c => c.value === this.value[key] );
      };

      if (!isValueInContent()) {
        const value = isArray ? [] : content[0]?.value;

        if (value !== SENTINEL) {
          set(this.value, key, value);
        }
      }
    },

    mapPathOptionsToContent(pathOptions) {
      return (pathOptions || []).map((pathOption) => {
        const split = pathOption.split('/');

        return {
          label: split[split.length - 1],
          value: pathOption
        };
      });
    },

    mapHostOptionsToContent(hostOptions) {
      return this.mapPathOptionsToContent(hostOptions)
        .map(c => c.value === '' ? {
          label: this.t('cluster.machineConfig.vsphere.hostOptions.any'),
          value: SENTINEL
        } : c);
    },

    mapFolderOptionsToContent(folderOptions) {
      return folderOptions.map(option => ({
        label: option || '\u00A0',
        value: option || ''
      }));
    },

    mapPoolOptionsToContent(pathOptions) {
      return pathOptions.map((pathOption) => {
        const splitOptions = pathOption.split('/');
        const label = splitOptions.slice(2).join('/');

        return {
          label,
          value: pathOption
        };
      });
    },

    mapCustomAttributesToContent(customAttributes) {
      return customAttributes.map(customAttribute => ({
        label: customAttribute.name,
        value: customAttribute.key.toString()
      }));
    },

    mapTagsToContent(tags) {
      return tags.map(tag => ({
        ...tag,
        label: `${ tag.category } / ${ tag.name }`,
        value: tag.id
      }));
    },

    initKeyValueParams(pairsKey, paramsKey) {
      set(this, paramsKey, (get(this, pairsKey) || []).reduce(stringsToParams, []));
    },

    updateVappOptions(opts) {
      set(this.value, 'vappIpprotocol', opts.vappIpprotocol);
      set(this.value, 'vappIpallocationpolicy', opts.vappIpallocationpolicy);
      set(this.value, 'vappTransport', opts.vappTransport);
      set(this.value, 'vappProperty', opts.vappProperty);
      this.initKeyValueParams('value.vappProperty', 'initVappArray');
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" :delayed="true" />
  <div v-else-if="errors.length">
    <div
      v-for="(err, idx) in errors"
      :key="idx"
    >
      <Banner
        color="error"
        :label="stringify(err)"
      />
    </div>
  </div>
  <div v-else>
    <Card class="m-0 mt-20" :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text mb-5">
        {{ t('cluster.machineConfig.vsphere.scheduling.label') }}
        <p class="text-muted text-small">
          {{ t('cluster.machineConfig.vsphere.scheduling.description') }}
        </p>
      </h4>
      <div slot="body">
        <div class="row">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.datacenter"
              :loading="dataCentersLoading"
              :mode="mode"
              :options="dataCenters"
              :label="t('cluster.machineConfig.vsphere.scheduling.dataCenter')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="value.pool"
              :loading="resourcePoolsLoading"
              :mode="mode"
              :options="resourcePools"
              :label="t('cluster.machineConfig.vsphere.scheduling.resourcePool')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <LabeledSelect
              v-model="value.datastore"
              :loading="dataStoresLoading"
              :mode="mode"
              :options="dataStores"
              :label="t('cluster.machineConfig.vsphere.scheduling.dataStore')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="value.folder"
              :loading="foldersLoading"
              :mode="mode"
              :options="folders"
              :label="t('cluster.machineConfig.vsphere.scheduling.folder')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-12">
            <LabeledSelect
              v-model="host"
              :loading="hostsLoading"
              :mode="mode"
              :options="hosts"
              :label="t('cluster.machineConfig.vsphere.scheduling.host.label')"
              :disabled="disabled"
            />
            <p class="text-muted mt-5">
              {{ t('cluster.machineConfig.vsphere.scheduling.host.note') }}
            </p>
          </div>
        </div>
      </div>
    </Card>
    <Card class="m-0 mt-20" :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text mb-5">
        {{ t('cluster.machineConfig.vsphere.instanceOptions.label') }}
        <p class="text-muted text-small">
          {{ t('cluster.machineConfig.vsphere.instanceOptions.description') }}
        </p>
      </h4>
      <div slot="body">
        <div class="row mt-10">
          <div class="col span-6">
            <UnitInput
              v-model="cpuCount"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.cpus')"
              :suffix="t('suffix.cores')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-6">
            <UnitInput
              v-model="memorySize"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.memory')"
              :suffix="t('suffix.mib')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-6">
            <UnitInput
              v-model="diskSize"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.disk')"
              :suffix="t('suffix.mib')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-6">
            <LabeledSelect
              v-model="value.os"
              :mode="mode"
              :options="osOptions"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.os')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col" :class="showContentLibrary ? 'span-4' : 'span-6'">
            <LabeledSelect
              v-model="value.creationType"
              :mode="mode"
              :options="creationMethods"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.creationMethod')"
              :disabled="disabled"
            />
          </div>
          <div v-if="showTemplate" class="col span-6">
            <LabeledSelect
              v-model="value.cloneFrom"
              :loading="templatesLoading"
              :mode="mode"
              :options="templates"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.template.label')"
              :disabled="disabled"
              :status="templateStatus"
              :tooltip="templateTooltip"
            />
          </div>
          <div v-if="showContentLibrary" class="col span-4">
            <LabeledSelect
              v-model="value.contentLibrary"
              :loading="contentLibrariesLoading"
              :mode="mode"
              :options="contentLibraries"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.contentLibrary')"
              :disabled="disabled"
            />
          </div>
          <div v-if="showContentLibrary" class="col span-4">
            <LabeledSelect
              v-model="value.cloneFrom"
              :loading="libraryTemplatesLoading"
              :mode="mode"
              :options="libraryTemplates"
              :searchable="true"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.libraryTemplate')"
              :disabled="disabled"
            />
          </div>
          <div v-if="showVirtualMachines" class="col span-6">
            <LabeledSelect
              v-model="value.cloneFrom"
              :loading="virtualMachinesLoading"
              :mode="mode"
              :options="virtualMachines"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.virtualMachine')"
              :disabled="disabled"
            />
          </div>
          <div v-if="showIso" class="col span-6">
            <LabeledInput
              v-model="value.boot2dockerUrl"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.osIsoUrl.label')"
              :placeholder="t('cluster.machineConfig.vsphere.instanceOptions.osIsoUrl.placeholder')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div v-if="showIso" class="row mt-10">
          <div class="col span-12">
            <LabeledInput
              v-model="value.cloudinit"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.instanceOptions.cloudInit.label')"
              :placeholder="t('cluster.machineConfig.vsphere.instanceOptions.cloudInit.placeholder')"
              :disabled="disabled"
            />
            <p class="text-muted mt-5">
              {{ t('cluster.machineConfig.vsphere.instanceOptions.cloudInit.note') }}
            </p>
          </div>
        </div>
        <div v-if="showCloudConfigYaml" class="row mt-10">
          <div class="col span-12">
            <label class="text-label mt-0">{{ t('cluster.machineConfig.vsphere.instanceOptions.cloudConfigYaml') }}</label>
            <YamlEditor
              ref="yaml-additional"
              v-model="value.cloudConfig"
              :editor-mode="mode === 'view' ? 'VIEW_CODE' : 'EDIT_CODE'"
              :disabled="disabled"
              initial-yaml-values="# Additional Manifest YAML"
              class="yaml-editor"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-12">
            <label class="text-label mt-0">
              {{ t('cluster.machineConfig.vsphere.networks.label') }}
            </label>
            <ArrayListSelect
              v-model="value.network"
              :options="networks"
              :array-list-props="{ addLabel: t('cluster.machineConfig.vsphere.networks.add') }"
              :loading="networksLoading"
              :disabled="disabled"
            />
          </div>
        </div>
        <div class="row mt-10">
          <div class="col span-12">
            <label class="text-label mt-0">
              {{ t('cluster.machineConfig.vsphere.guestinfo.label') }}
            </label>
            <KeyValue
              v-model="cfgparam"
              :add-label="t('cluster.machineConfig.vsphere.guestinfo.add')"
              :key-placeholder="t('cluster.machineConfig.vsphere.guestinfo.keyPlaceholder')"
              :value-placeholder="t('cluster.machineConfig.vsphere.guestinfo.valuePlaceholder')"
              :read-allowed="false"
              :disabled="disabled"
            />
          </div>
        </div>
      </div>
    </Card>
    <Card v-if="haveTags" class="m-0 mt-20" :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text mb-5">
        {{ t('cluster.machineConfig.vsphere.tags.label') }}
        <p class="text-muted text-small">
          {{ t('cluster.machineConfig.vsphere.tags.description') }}
        </p>
      </h4>
      <div slot="body">
        <ArrayListSelect
          v-model="value.tag"
          :options="tags"
          :array-list-props="{ addLabel: t('cluster.machineConfig.vsphere.tags.addTag') }"
          :loading="tagsLoading"
          :disabled="disabled"
        />
      </div>
    </Card>
    <Card v-if="haveAttributes" class="m-0 mt-20" :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text mb-5">
        {{ t('cluster.machineConfig.vsphere.customAttributes.label') }}
        <p class="text-muted text-small">
          {{ t('cluster.machineConfig.vsphere.customAttributes.description') }}
        </p>
      </h4>
      <div slot="body">
        <KeyValue
          v-model="customAttribute"
          :key-options="attributeKeys"
          :options="tags"
          :add-label="t('cluster.machineConfig.vsphere.customAttributes.add')"
          :read-allowed="false"
          :loading="attributeKeysLoading"
          :key-taggable="false"
          :key-option-unique="true"
          :disabled="disabled"
        />
      </div>
    </Card>
    <Card class="m-0 mt-20" :show-highlight-border="false" :show-actions="false">
      <h4 slot="title" class="text-default-text mb-5">
        {{ t('cluster.machineConfig.vsphere.vAppOptions.label') }}
        <p class="text-muted text-small">
          {{ t('cluster.machineConfig.vsphere.vAppOptions.description') }}
        </p>
      </h4>
      <div slot="body">
        <div class="row mb-10">
          <div class="col span-6">
            <RadioGroup
              v-model="vappMode"
              name="restoreMode"
              :label="t('cluster.machineConfig.vsphere.vAppOptions.restoreType')"
              :options="vAppOptions"
              :disabled="disabled"
            />
          </div>
        </div>
        <div v-if="showManual" class="row mb-10">
          <div class="col span-4">
            <LabeledInput
              v-model="value.vappTransport"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.vAppOptions.transport.label')"
              :tooltip="t('cluster.machineConfig.vsphere.vAppOptions.transport.tooltip')"
              :placeholder="t('cluster.machineConfig.vsphere.vAppOptions.transport.placeholder')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="value.vappIpprotocol"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.vAppOptions.protocol.label')"
              :tooltip="t('cluster.machineConfig.vsphere.vAppOptions.protocol.tooltip')"
              :placeholder="t('cluster.machineConfig.vsphere.vAppOptions.protocol.placeholder')"
              :disabled="disabled"
            />
          </div>
          <div class="col span-4">
            <LabeledInput
              v-model="value.vappIpallocationpolicy"
              :mode="mode"
              :label="t('cluster.machineConfig.vsphere.vAppOptions.allocation.label')"
              :tooltip="t('cluster.machineConfig.vsphere.vAppOptions.allocation.tooltip')"
              :placeholder="t('cluster.machineConfig.vsphere.vAppOptions.allocation.placeholder')"
              :disabled="disabled"
            />
          </div>
        </div>
        <div v-if="showManual" class="row">
          <div class="col span-12">
            <KeyValue
              v-model="vappProperty"
              :title="t('cluster.machineConfig.vsphere.vAppOptions.properties.label')"
              :key-placeholder="t('cluster.machineConfig.vsphere.vAppOptions.properties.keyPlaceholder')"
              :value-placeholder="t('cluster.machineConfig.vsphere.vAppOptions.properties.valuePlaceholder')"
              :add-label="t('cluster.machineConfig.vsphere.vAppOptions.properties.add')"
              :read-allowed="false"
              :disabled="disabled"
            />
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

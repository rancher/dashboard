<script>
// Added by Verrazzano
import AwsElasticBlockStore from '@pkg/components/VolumesTab/AwsElasticBlockStore';
import AzureDisk from '@pkg/components/VolumesTab/AzureDisk';
import CephFS from '@pkg/components/VolumesTab/CephFS';
import Cinder from '@pkg/components/VolumesTab/Cinder';
import ConfigMap from '@pkg/components/VolumesTab/ConfigMap';
import CSIVolume from '@pkg/components/VolumesTab/CSIVolume';
import DownwardAPI from '@pkg/components/VolumesTab/DownwardAPI';
import EmptyDir from '@pkg/components/VolumesTab/EmptyDir';
import FibreChannel from '@pkg/components/VolumesTab/FibreChannel';
import FlexVolume from '@pkg/components/VolumesTab/FlexVolume';
import Flocker from '@pkg/components/VolumesTab/Flocker';
import GCEPersistentDisk from '@pkg/components/VolumesTab/GCEPersistentDisk';
import GlusterFS from '@pkg/components/VolumesTab/GlusterFS';
import HostPath from '@pkg/components/VolumesTab/HostPath';
import ISCSI from '@pkg/components/VolumesTab/ISCSI';
import LabeledInput from '@components/Form/LabeledInput/LabeledInput';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import NFS from '@pkg/components/VolumesTab/NFS';
import PersistentVolumeClaimSource from '@pkg/components/VolumesTab/PersistentVolumeClaimSource';
import PersistentVolumeClaimTemplateTab from '@pkg/components/PersistentVolumeClaimTemplateTab';
import PhotonPersistentDisk from '@pkg/components/VolumesTab/PhotonPersistentDisk';
import PortworxVolume from '@pkg/components/VolumesTab/PortworxVolume';
import ProjectedVolume from '@pkg/components/VolumesTab/ProjectedVolume';
import RadosBlockDevice from '@pkg/components/VolumesTab/RadosBlockDevice';
import ScaleIO from '@pkg/components/VolumesTab/ScaleIO';
import Secret from '@pkg/components/VolumesTab/Secret';
import StorageOS from '@pkg/components/VolumesTab/StorageOS';
import TabDeleteButton from '@pkg/components/TabDeleteButton';
import TreeTab from '@pkg/components/TreeTabbed/TreeTab';
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';
import VSphereVolume from '@pkg/components/VolumesTab/VSphereVolume';
import Vue from 'vue';

export default {
  name:       'VolumeTab',
  components: {
    AwsElasticBlockStore,
    AzureDisk,
    CephFS,
    Cinder,
    ConfigMap,
    CSIVolume,
    DownwardAPI,
    EmptyDir,
    FibreChannel,
    FlexVolume,
    Flocker,
    GCEPersistentDisk,
    GlusterFS,
    HostPath,
    ISCSI,
    LabeledSelect,
    LabeledInput,
    NFS,
    PersistentVolumeClaimSource,
    PersistentVolumeClaimTemplateTab,
    PhotonPersistentDisk,
    PortworxVolume,
    ProjectedVolume,
    RadosBlockDevice,
    ScaleIO,
    Secret,
    StorageOS,
    TabDeleteButton,
    TreeTab,
    VSphereVolume,
  },
  mixins: [VerrazzanoHelper],
  props:  {
    value: {
      type:    Object,
      default: () => ({})
    },
    mode: {
      type:    String,
      default: 'create'
    },
    namespacedObject: {
      type:     Object,
      required: true
    },
    nameIsEditable: {
      type:    Boolean,
      default: false,
    },
    tabName: {
      type:     String,
      required: true
    },
    tabLabel: {
      type:    String,
      default: ''
    },
  },
  data() {
    return {
      treeTabName:  this.tabName,
      treeTabLabel: this.tabLabel,
      volumeType:   '',
      isLoading:    true,
    };
  },
  computed: {
    volumeTypeOptions() {
      return [
        {
          value:     'aws',
          label:     this.t('verrazzano.common.types.volumeType.aws'),
          fieldName: 'awsElasticBlockStore'
        },
        {
          value:     'azure',
          label:     this.t('verrazzano.common.types.volumeType.azure'),
          fieldName: 'azureDisk'
        },
        {
          value: 'cephfs',
          label: this.t('verrazzano.common.types.volumeType.cephfs')
        },
        {
          value: 'cinder',
          label: this.t('verrazzano.common.types.volumeType.cinder')
        },
        {
          value: 'configMap',
          label: this.t('verrazzano.common.types.volumeType.configMap')
        },
        {
          value: 'csi',
          label: this.t('verrazzano.common.types.volumeType.csi')
        },
        {
          value:     'downwardApi',
          label:     this.t('verrazzano.common.types.volumeType.downwardApi'),
          fieldName: 'downwardAPI'
        },
        {
          value: 'emptyDir',
          label: this.t('verrazzano.common.types.volumeType.emptyDir')
        },
        {
          value: 'ephemeral',
          label: this.t('verrazzano.common.types.volumeType.ephemeral')
        },
        {
          value: 'fc',
          label: this.t('verrazzano.common.types.volumeType.fc')
        },
        {
          value:     'flex',
          label:     this.t('verrazzano.common.types.volumeType.flex'),
          fieldName: 'flexVolume'
        },
        {
          value: 'flocker',
          label: this.t('verrazzano.common.types.volumeType.flocker')
        },
        {
          value:     'gce',
          label:     this.t('verrazzano.common.types.volumeType.gce'),
          fieldName: 'gcePersistentDisk'
        },
        {
          value: 'glusterfs',
          label: this.t('verrazzano.common.types.volumeType.glusterfs')
        },
        {
          value: 'hostPath',
          label: this.t('verrazzano.common.types.volumeType.hostPath')
        },
        {
          value: 'iscsi',
          label: this.t('verrazzano.common.types.volumeType.iscsi')
        },
        {
          value: 'nfs',
          label: this.t('verrazzano.common.types.volumeType.nfs')
        },
        {
          value:     'pvc',
          label:     this.t('verrazzano.common.types.volumeType.pvc'),
          fieldName: 'persistentVolumeClaim'
        },
        {
          value:     'photon',
          label:     this.t('verrazzano.common.types.volumeType.photon'),
          fieldName: 'photonPersistentDisk'
        },
        {
          value:     'portworx',
          label:     this.t('verrazzano.common.types.volumeType.portworx'),
          fieldName: 'portworxVolume'
        },
        {
          value: 'projected',
          label: this.t('verrazzano.common.types.volumeType.projected')
        },
        {
          value: 'quobyte',
          label: this.t('verrazzano.common.types.volumeType.quobyte')
        },
        {
          value: 'rbd',
          label: this.t('verrazzano.common.types.volumeType.rbd')
        },
        {
          value: 'scaleIO',
          label: this.t('verrazzano.common.types.volumeType.scaleIO')
        },
        {
          value: 'secret',
          label: this.t('verrazzano.common.types.volumeType.secret')
        },
        {
          value: 'storageos',
          label: this.t('verrazzano.common.types.volumeType.storageOS')
        },
        {
          value:     'vsphere',
          label:     this.t('verrazzano.common.types.volumeType.vsphere'),
          fieldName: 'vsphereVolume'
        },
      ];
    },
    showAws() {
      return this.volumeType === 'aws';
    },
    showAzure() {
      return this.volumeType === 'azure';
    },
    showCephFS() {
      return this.volumeType === 'cephfs';
    },
    showCinder() {
      return this.volumeType === 'cinder';
    },
    showConfigMap() {
      return this.volumeType === 'configMap';
    },
    showCSI() {
      return this.volumeType === 'csi';
    },
    showDownwardAPI() {
      return this.volumeType === 'downwardApi';
    },
    showEmptyDir() {
      return this.volumeType === 'emptyDir';
    },
    showEphemeral() {
      return this.volumeType === 'ephemeral';
    },
    showFC() {
      return this.volumeType === 'fc';
    },
    showFlex() {
      return this.volumeType === 'flex';
    },
    showFlocker() {
      return this.volumeType === 'flocker';
    },
    showGCE() {
      return this.volumeType === 'gce';
    },
    showGlusterFS() {
      return this.volumeType === 'glusterfs';
    },
    showHostPath() {
      return this.volumeType === 'hostPath';
    },
    showIscsi() {
      return this.volumeType === 'iscsi';
    },
    showNFS() {
      return this.volumeType === 'nfs';
    },
    showPVC() {
      return this.volumeType === 'pvc';
    },
    showPhoton() {
      return this.volumeType === 'photon';
    },
    showPostworx() {
      return this.volumeType === 'portworx';
    },
    showProjected() {
      return this.volumeType === 'projected';
    },
    showQuobyte() {
      return this.volumeType === 'quobyte';
    },
    showRBD() {
      return this.volumeType === 'rbd';
    },
    showScaleIO() {
      return this.volumeType === 'scaleIO';
    },
    showSecret() {
      return this.volumeType === 'secret';
    },
    showStorageOS() {
      return this.volumeType === 'storageos';
    },
    showVsphere() {
      return this.volumeType === 'vsphere';
    },
  },
  methods: {
    getVolumeType() {
      const fieldName = Object.keys(this.value).find(key => key !== 'name' && key !== '_id' );

      if (!fieldName) {
        return undefined;
      }

      const record = this.volumeTypeOptions.find((type) => {
        const recordFieldName = type.fieldName ? type.fieldName : type.value;

        return fieldName === recordFieldName;
      });

      return record ? record.value : undefined;
    },
    clearVolumeTypeField(volumeType) {
      const field = this.volumeTypeOptions.find(type => type.value === volumeType);
      const fieldName = field.fieldName ? field.fieldName : field.value;

      Vue.delete(this.value, fieldName);
    },
  },
  created() {
    this.volumeType = this.getVolumeType();

    if (!this.treeTabLabel) {
      this.treeTabLabel = this.value.name || this.t('verrazzano.common.tabs.volume');
    }
  },
  mounted() {
    this.isLoading = false;
  },
  watch: {
    volumeType(neu, old) {
      if (!this.isLoading && old) {
        this.clearVolumeTypeField(old);
      }
    }
  },
};
</script>

<template>
  <TreeTab :name="treeTabName" :label="treeTabLabel">
    <template #beside-header>
      <TabDeleteButton
        :element-name="treeTabLabel"
        :mode="mode"
        @click="$emit('delete', value)"
      />
    </template>
    <template #default>
      <div class="row">
        <div class="col span-4">
          <LabeledInput
            :value="getField('name')"
            :mode="mode"
            required
            :disabled="!nameIsEditable"
            :placeholder="getNotSetPlaceholder(value, 'name')"
            :label="t('verrazzano.common.fields.volumes.name')"
            @input="setFieldIfNotEmpty('name', $event)"
          />
        </div>
        <div class="col span-4">
          <LabeledSelect
            v-model="volumeType"
            :mode="mode"
            required
            :options="volumeTypeOptions"
            option-key="value"
            option-label="label"
            :label="t('verrazzano.common.fields.volumes.type')"
          />
        </div>
      </div>
      <div class="spacer" />
      <div v-if="showAws">
        <h3>{{ t('verrazzano.common.titles.volumes.awsElasticBlockStore') }}</h3>
        <AwsElasticBlockStore
          :value="getField('awsElasticBlockStore')"
          :mode="mode"
          @input="setFieldIfNotEmpty('awsElasticBlockStore', $event)"
        />
        <div class="spacer" />
      </div>
      <div v-else-if="showAzure">
        <h3>{{ t('verrazzano.common.titles.volumes.azureDisk') }}</h3>
        <AzureDisk
          :value="getField('azureDisk')"
          :mode="mode"
          @input="setFieldIfNotEmpty('azureDisk', $event)"
        />
        <div class="spacer" />
      </div>
      <div v-else-if="showCephFS">
        <h3>{{ t('verrazzano.common.titles.volumes.cephfs') }}</h3>
        <CephFS
          :value="getField('cephfs')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('cephfs', $event)"
        />
        <div class="spacer" />
      </div>
      <div v-else-if="showCinder">
        <h3>{{ t('verrazzano.common.titles.volumes.cinder') }}</h3>
        <Cinder
          :value="getField('cinder')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('cinder', $event)"
        />
        <div class="spacer" />
      </div>
      <div v-else-if="showConfigMap">
        <h3>{{ t('verrazzano.common.titles.volumes.configMap') }}</h3>
        <ConfigMap
          :value="getField('configMap')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('configMap', $event)"
        />
      </div>
      <div v-else-if="showCSI">
        <h3>{{ t('verrazzano.common.titles.volumes.csi') }}</h3>
        <CSIVolume
          :value="getField('csi')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('csi', $event)"
        />
      </div>
      <div v-else-if="showDownwardAPI">
        <h3>{{ t('verrazzano.common.titles.volumes.downwardApi.title') }}</h3>
        <DownwardAPI
          :value="getField('downwardAPI')"
          :mode="mode"
          @input="setFieldIfNotEmpty('downwardAPI', $event)"
        />
      </div>
      <div v-else-if="showEmptyDir">
        <h3>{{ t('verrazzano.common.titles.volumes.emptyDir') }}</h3>
        <!-- Do not use setFieldIfNotEmpty because EnptyDir needs to be able to have a field set to an empty string -->
        <EmptyDir
          :value="getField('emptyDir')"
          :mode="mode"
          @input="setField('emptyDir', $event)"
        />
      </div>
      <div v-else-if="showEphemeral">
        <!-- is in the nestedTab section -->
      </div>
      <div v-else-if="showFC">
        <h4>{{ t('verrazzano.common.titles.volumes.fc') }}</h4>
        <FibreChannel
          :value="getField('fc')"
          :mode="mode"
          @input="setFieldIfNotEmpty('fc', $event)"
        />
      </div>
      <div v-else-if="showFlex">
        <h4>{{ t('verrazzano.common.titles.volumes.flex') }}</h4>
        <FlexVolume
          :value="getField('flexVolume')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('flexVolume', $event)"
        />
      </div>
      <div v-else-if="showFlocker">
        <h4>{{ t('verrazzano.common.titles.volumes.flocker') }}</h4>
        <Flocker
          :value="getField('flocker')"
          :mode="mode"
          @input="setFieldIfNotEmpty('flocker', $event)"
        />
      </div>
      <div v-else-if="showGCE">
        <h4>{{ t('verrazzano.common.titles.volumes.gce') }}</h4>
        <GCEPersistentDisk
          :value="getField('gcePersistentDisk')"
          :mode="mode"
          @input="setFieldIfNotEmpty('gcePersistentDisk', $event)"
        />
      </div>
      <div v-else-if="showGlusterFS">
        <h4>{{ t('verrazzano.common.titles.volumes.glusterfs') }}</h4>
        <GlusterFS
          :value="getField('glusterfs')"
          :mode="mode"
          @input="setFieldIfNotEmpty('glusterfs', $event)"
        />
      </div>
      <div v-else-if="showHostPath">
        <h4>{{ t('verrazzano.common.titles.volumes.hostPath') }}</h4>
        <HostPath
          :value="getField('hostPath')"
          :mode="mode"
          @input="setFieldIfNotEmpty('hostPath', $event)"
        />
      </div>
      <div v-else-if="showIscsi">
        <h4>{{ t('verrazzano.common.titles.volumes.iscsi') }}</h4>
        <ISCSI
          :value="getField('iscsi')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('iscsi', $event)"
        />
      </div>
      <div v-else-if="showNFS">
        <h4>{{ t('verrazzano.common.titles.volumes.nfs') }}</h4>
        <NFS
          :value="getField('nfs')"
          :mode="mode"
          @input="setFieldIfNotEmpty('nfs', $event)"
        />
      </div>
      <div v-else-if="showPVC">
        <h4>{{ t('verrazzano.common.titles.volumes.pvc') }}</h4>
        <PersistentVolumeClaimSource
          :value="getField('persistentVolumeClaim')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('persistentVolumeClaim', $event)"
        />
      </div>
      <div v-else-if="showPhoton">
        <h4>{{ t('verrazzano.common.titles.volumes.photon') }}</h4>
        <PhotonPersistentDisk
          :value="getField('photonPersistentDisk')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('photonPersistentDisk', $event)"
        />
      </div>
      <div v-else-if="showPostworx">
        <h4>{{ t('verrazzano.common.titles.volumes.portworx') }}</h4>
        <PortworxVolume
          :value="getField('portworxVolume')"
          :mode="mode"
          @input="setFieldIfNotEmpty('portworxVolume', $event)"
        />
      </div>
      <div v-else-if="showProjected">
        <h4>{{ t('verrazzano.common.titles.volumes.projected.title') }}</h4>
        <ProjectedVolume
          :value="getField('projected')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('projected', $event)"
        />
      </div>
      <div v-else-if="showQuobyte">
        <h4>{{ t('verrazzano.common.titles.volumes.quobyte') }}</h4>
        <PortworxVolume
          :value="getField('quobyte')"
          :mode="mode"
          @input="setFieldIfNotEmpty('quobyte', $event)"
        />
      </div>
      <div v-else-if="showRBD">
        <h4>{{ t('verrazzano.common.titles.volumes.rbd') }}</h4>
        <RadosBlockDevice
          :value="getField('rbd')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('rbd', $event)"
        />
      </div>
      <div v-else-if="showScaleIO">
        <h4>{{ t('verrazzano.common.titles.volumes.scaleIO') }}</h4>
        <ScaleIO
          :value="getField('scaleIO')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('scaleIO', $event)"
        />
      </div>
      <div v-else-if="showSecret">
        <h4>{{ t('verrazzano.common.titles.volumes.secret') }}</h4>
        <Secret
          :value="getField('secret')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('secret', $event)"
        />
      </div>
      <div v-else-if="showStorageOS">
        <h4>{{ t('verrazzano.common.titles.volumes.storageOS') }}</h4>
        <StorageOS
          :value="getField('storageos')"
          :mode="mode"
          :namespaced-object="namespacedObject"
          @input="setFieldIfNotEmpty('storageos', $event)"
        />
      </div>
      <div v-else-if="showVsphere">
        <h4>{{ t('verrazzano.common.titles.volumes.vsphere') }}</h4>
        <VSphereVolume
          :value="getField('vsphereVolume')"
          :mode="mode"
          @input="setFieldIfNotEmpty('vsphereVolume', $event)"
        />
      </div>
    </template>
    <template #nestedTabs>
      <PersistentVolumeClaimTemplateTab
        v-if="showEphemeral"
        :value="getField('ephemeral.volumeClaimTemplate')"
        :mode="mode"
        :tab-name="createTabName(treeTabName, 'ephemeral')"
        :tab-label="t('verrazzano.common.tabs.ephemeralVolumeClaimTemplate')"
        @input="setFieldIfNotEmpty('ephemeral.volumeClaimTemplate', $event)"
        @delete="setField('ephemeral', undefined)"
      />
    </template>
  </TreeTab>
</template>

<style scoped>

</style>

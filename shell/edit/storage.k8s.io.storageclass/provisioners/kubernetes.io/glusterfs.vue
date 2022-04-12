<script>
import LabeledInput from '@shell/components/form/LabeledInput';

export default {
  components: { LabeledInput },
  props:      {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  }
};
</script>
<template>
  <div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.resturl" :placeholder="t('storageClass.glusterfs.restUrl.placeholder')" :label="t('storageClass.glusterfs.restUrl.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.restuser" :placeholder="t('storageClass.glusterfs.restUser.placeholder')" :label="t('storageClass.glusterfs.restUser.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.restuserkey" :placeholder="t('storageClass.glusterfs.restUserKey.placeholder')" :label="t('storageClass.glusterfs.restUserKey.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.secretNamespace" :placeholder="t('storageClass.glusterfs.secretNamespace.placeholder')" :label="t('storageClass.glusterfs.secretNamespace.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.secretName" :placeholder="t('storageClass.glusterfs.secretName.placeholder')" :label="t('storageClass.glusterfs.secretName.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.clusterid" :placeholder="t('storageClass.glusterfs.clusterId.placeholder')" :label="t('storageClass.glusterfs.clusterId.label')" :mode="mode" />
      </div>
    </div>
    <div class="row mb-10">
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.gidMin" :placeholder="t('storageClass.glusterfs.gidMin.placeholder')" :label="t('storageClass.glusterfs.gidMin.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.gidMax" :placeholder="t('storageClass.glusterfs.gidMax.placeholder')" :label="t('storageClass.glusterfs.gidMax.label')" :mode="mode" />
      </div>
      <div class="col span-4">
        <LabeledInput v-model="value.parameters.volumetype" :placeholder="t('storageClass.glusterfs.volumeType.placeholder')" :label="t('storageClass.glusterfs.volumeType.label')" :mode="mode" />
      </div>
    </div>
  </div>
</template>

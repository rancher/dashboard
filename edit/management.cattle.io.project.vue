<script>
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import ResourceQuota from '@/components/form/ResourceQuota';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import NameNsDescription from '@/components/form/NameNsDescription';
import { NORMAN } from '@/config/types';

export default {
  components: {
    ContainerResourceLimit, CruResource, Labels, NameNsDescription, ResourceQuota, Tabbed, Tab
  },
  mixins: [CreateEditView],
  created() {
    this.$set(this.value.metadata, 'namespace', this.$store.getters['currentCluster'].id);
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'containerDefaultResourceLimit', this.value.spec.containerDefaultResourceLimit || {});
  },
  methods: {
    async save(saveCb) {
      try {
        const normanProject = this.isCreate ? await this.createProject() : await this.editProject();

        await normanProject.save();
        saveCb(true);
        this.$router.replace(this.value.listLocation);
      } catch (ex) {
        saveCb(false);
      }
    },

    async createProject() {
      const normanProject = await this.$store.dispatch('rancher/create', {
        type:                          NORMAN.PROJECT,
        name:                          this.value.spec.displayName,
        description:                   this.value.spec.description,
        annotations:                   this.value.metadata.annotations,
        labels:                        this.value.metadata.labels,
        clusterId:                     this.$store.getters['currentCluster'].id,
        creatorId:                     this.$store.getters['auth/principalId'],
        containerDefaultResourceLimit: this.value.spec.containerDefaultResourceLimit,
        namespaceDefaultResourceQuota: this.value.spec.namespaceDefaultResourceQuota,
        resourceQuota:                 this.value.spec.resourceQuota,
      });

      // The backend seemingly required both labels/annotation and metadata.labels/annotations or it doesn't save the labels and annotations
      normanProject.setAnnotations(this.value.metadata.annotations);
      normanProject.setLabels(this.value.metadata.labels);

      return normanProject;
    },

    async editProject() {
      const normanProject = await this.$store.dispatch('rancher/find', {
        type:       NORMAN.PROJECT,
        id:   this.value.id.replace('/', ':'),
      });

      normanProject.setAnnotations(this.value.metadata.annotations);
      normanProject.setLabels(this.value.metadata.labels);
      normanProject.description = this.value.spec.description;
      normanProject.containerDefaultResourceLimit = this.value.spec.containerDefaultResourceLimit;
      normanProject.namespaceDefaultResourceQuota = this.value.spec.namespaceDefaultResourceQuota;
      normanProject.resourceQuota = this.value.spec.resourceQuota;

      return normanProject;
    }
  }
};
</script>
<template>
  <CruResource
    class="project"
    :done-route="'c-cluster-product-projectsnamespaces'"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="false" description-key="spec.description" name-key="spec.displayName" />
    <Tabbed :side-tabs="true">
      <Tab name="resource-quotas" :label="t('project.resourceQuotas')" :weight="9">
        <ResourceQuota v-model="value" :mode="mode" />
      </Tab>
      <Tab name="container-default-resource-limit" :label="t('project.containerDefaultResourceLimit')" :weight="8">
        <ContainerResourceLimit v-model="value.spec.containerDefaultResourceLimit" :mode="mode" :show-tip="false" />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="7"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="mode"
          :display-side-by-side="false"
        />
      </Tab>
    </Tabbed>
  </CruResource>
</template>

<style lang="scss" scoped>
.project ::v-deep .tabs {
  min-width: 250px;
}
</style>

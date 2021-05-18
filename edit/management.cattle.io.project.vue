<script>
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import ResourceQuota from '@/components/form/ResourceQuota';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import NameNsDescription from '@/components/form/NameNsDescription';

export default {
  components: {
    ContainerResourceLimit, CruResource, Labels, NameNsDescription, ResourceQuota, Tabbed, Tab
  },
  mixins:   [CreateEditView],
  computed: {
    doneLocationOverride() {
      return this.value.listLocation;
    }
  },
  created() {
    this.$set(this.value.metadata, 'namespace', this.$store.getters['currentCluster'].id);
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'containerDefaultResourceLimit', this.value.spec.containerDefaultResourceLimit || {});
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
    <NameNsDescription v-model="value" :mode="mode" :namespaced="false" description-key="spec.description" />
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

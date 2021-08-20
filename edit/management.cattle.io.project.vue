<script>
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import ResourceQuota from '@/components/form/ResourceQuota';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import NameNsDescription from '@/components/form/NameNsDescription';
import { MANAGEMENT } from '@/config/types';
import { NAME } from '@/config/product/explorer';
import { PROJECT_ID } from '@/config/query-params';
import ProjectMembershipEditor from '@/components/form/Members/ProjectMembershipEditor';
import { canViewProjectMembershipEditor } from '@/components/form/Members/ProjectMembershipEditor.vue';

export default {
  components: {
    ContainerResourceLimit, CruResource, Labels, NameNsDescription, ProjectMembershipEditor, ResourceQuota, Tabbed, Tab
  },

  mixins: [CreateEditView],

  data() {
    return {
      projectRoleTemplateBindingSchema:         this.$store.getters[`management/schemaFor`](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING),
      createLocation:                   {
        name:   'c-cluster-product-resource-create',
        params: {
          product:  NAME,
          resource: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
        },
        query: { [PROJECT_ID]: this.project?.id?.replace('/', ':') }
      },
      resource:           MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
      saveBindings:       null,
      membershipHasOwner:         false,
      membershipUpdate:   {}
    };
  },
  computed: {
    canManageMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },
  },
  watch: {
    hasOwner() {
      this.errors = this.hasOwner ? [] : [this.t('project.haveOneOwner')];
    }
  },
  created() {
    this.$set(this.value.metadata, 'namespace', this.$store.getters['currentCluster'].id);
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'containerDefaultResourceLimit', this.value.spec.containerDefaultResourceLimit || {});
  },
  methods: {
    async save(saveCb) {
      try {
        const savedProject = await this.value.save();

        if (this.membershipUpdate.save) {
          this.membershipUpdate.save(savedProject.id);
        }

        saveCb(true);
        this.$router.replace(this.value.listLocation);
      } catch (ex) {
        this.errors.push(ex);
        saveCb(false);
      }
    },

    onHasOwnerChanged(hasOwner) {
      this.$set(this, 'membershipHasOwner', hasOwner);
    },

    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
    }
  },
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
      <Tab v-if="canManageMembers" name="members" :label="t('project.members.label')" :weight="10">
        <ProjectMembershipEditor :mode="mode" :parent-id="value.id" @has-owner-changed="onHasOwnerChanged" @membership-update="onMembershipUpdate" />
      </Tab>
      <Tab name="resource-quotas" :label="t('project.resourceQuotas')" :weight="9">
        <ResourceQuota v-model="value" :mode="mode" />
      </Tab>
      <Tab name="container-default-resource-limit" :label="t('project.containerDefaultResourceLimit')" :weight="8">
        <ContainerResourceLimit v-model="value.spec.containerDefaultResourceLimit" :mode="mode" :show-tip="false" :register-before-hook="registerBeforeHook" />
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
.project {
  ::v-deep {
    .tabs {
      min-width: 250px;
    }
  }
}
</style>

<script>
import { mapGetters } from 'vuex';
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import LabeledSelect from '@/components/form/LabeledSelect';
import ResourceQuota from '@/components/form/ResourceQuota/Project';
import { HARVESTER_TYPES, RANCHER_TYPES } from '@/components/form/ResourceQuota/shared';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import NameNsDescription from '@/components/form/NameNsDescription';
import { MANAGEMENT } from '@/config/types';
import { NAME } from '@/config/product/explorer';
import { PROJECT_ID, _VIEW, _CREATE, _EDIT } from '@/config/query-params';
import ProjectMembershipEditor from '@/components/form/Members/ProjectMembershipEditor';
import { canViewProjectMembershipEditor } from '@/components/form/Members/ProjectMembershipEditor.vue';
import { NAME as HARVESTER } from '@/config/product/harvester';
import Banner from '@/components/Banner';

export default {
  components: {
    ContainerResourceLimit, CruResource, Labels, LabeledSelect, NameNsDescription, ProjectMembershipEditor, ResourceQuota, Tabbed, Tab, Banner
  },

  mixins: [CreateEditView],
  async fetch() {
    if ( this.$store.getters['management/canList'](MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE) ) {
      this.allPSPs = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.POD_SECURITY_POLICY_TEMPLATE });
    }
  },
  data() {
    this.$set(this.value, 'spec', this.value.spec || {});
    this.$set(this.value.spec, 'podSecurityPolicyTemplateId', this.value.status?.podSecurityPolicyTemplateId || '');

    return {
      allPSPs:                          [],
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
      membershipUpdate:   {},
      HARVESTER_TYPES,
      RANCHER_TYPES
    };
  },
  computed: {
    ...mapGetters(['currentCluster']),

    canManageMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },

    canEditProject() {
      const projectOptions = this.$store.getters['type-map/optionsFor'](MANAGEMENT.PROJECT);

      return !!(this.value?.links?.update && projectOptions && projectOptions.isEditable);
    },

    canEditTabElements() {
      if (!this.canEditProject) {
        return _VIEW;
      }

      return this.mode;
    },

    showBannerForOnlyManagingMembers() {
      return this.mode === _EDIT && !this.canEditProject;
    },

    isK3s() {
      return (this.currentCluster?.spec?.kubernetesVersion || '').includes('k3s');
    },

    pspOptions() {
      if ( this.isK3s || !this.currentCluster.spec.defaultPodSecurityPolicyTemplateName ) {
        return null;
      }

      const out = [{ label: this.t('project.psp.default'), value: '' }];

      if ( this.allPSPs ) {
        for ( const pspt of this.allPSPs ) {
          out.push({
            label: pspt.nameDisplay,
            value: pspt.id,
          });
        }
      }

      const cur = this.value.status?.podSecurityPolicyTemplateId;

      if ( cur && !out.find(x => x.value === cur) ) {
        out.unshift({ label: this.t('project.psp.current', { value: cur }), value: cur });
      }

      return out;
    },

    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },

    resourceQuotaLabel() {
      if (this.isHarvester) {
        return this.t('project.vmDefaultResourceLimit');
      }

      return this.t('project.containerDefaultResourceLimit');
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
        // clear up of the unused resourceQuotas will now be done on the model side

        if (this.mode === _CREATE) {
          const savedProject = await this.value.save();

          if (this.membershipUpdate.save) {
            this.membershipUpdate.save(savedProject.id);
          }
        } else if (this.mode === _EDIT) {
          if (this.canEditProject) {
            await this.value.save();
          }

          // // we allow users with permissions for projectroletemplatebindings to be able to manage members on projects
          if (this.membershipUpdate.save) {
            const norman = await this.value.norman;

            this.membershipUpdate.save(norman.id);
          }
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
    <Banner
      v-if="showBannerForOnlyManagingMembers"
      color="info"
      :label="t('project.membersEditOnly')"
    />
    <NameNsDescription
      v-model="value"
      :mode="mode"
      :namespaced="false"
      description-key="spec.description"
      :description-disabled="!canEditProject"
      name-key="spec.displayName"
      :normalize-name="false"
    />
    <div class="row">
      <div class="col span-12">
        <LabeledSelect
          v-if="pspOptions"
          v-model="value.spec.podSecurityPolicyTemplateId"
          class="psp"
          :mode="mode"
          :options="pspOptions"
          :label="t('project.psp.label')"
        />
      </div>
    </div>
    <Tabbed :side-tabs="true">
      <Tab
        v-if="canManageMembers"
        name="members"
        :label="t('project.members.label')"
        :weight="10"
      >
        <ProjectMembershipEditor
          :mode="mode"
          :parent-id="value.id"
          @has-owner-changed="onHasOwnerChanged"
          @membership-update="onMembershipUpdate"
        />
      </Tab>
      <Tab
        name="resource-quotas"
        :label="t('project.resourceQuotas')"
        :weight="9"
      >
        <ResourceQuota v-model="value" :mode="canEditTabElements" :types="isHarvester ? HARVESTER_TYPES : RANCHER_TYPES" />
      </Tab>
      <Tab
        name="container-default-resource-limit"
        :label="resourceQuotaLabel"
        :weight="8"
      >
        <ContainerResourceLimit v-model="value.spec.containerDefaultResourceLimit" :mode="canEditTabElements" :show-tip="false" :register-before-hook="registerBeforeHook" />
      </Tab>
      <Tab
        name="labels-and-annotations"
        label-key="generic.labelsAndAnnotations"
        :weight="7"
      >
        <Labels
          default-container-class="labels-and-annotations-container"
          :value="value"
          :mode="canEditTabElements"
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

  .psp {
    position: relative;
    top: -20px;
  }
}
</style>

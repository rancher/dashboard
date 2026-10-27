<script>
import { mapGetters } from 'vuex';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import ResourceQuota from '@shell/components/form/ResourceQuota/Project';
import { HARVESTER_TYPES, RANCHER_TYPES } from '@shell/components/form/ResourceQuota/shared';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { MANAGEMENT } from '@shell/config/types';
import { NAME } from '@shell/config/product/explorer';
import { PROJECT_ID, _VIEW, _CREATE, _EDIT } from '@shell/config/query-params';
import ProjectMembershipEditor, { canViewProjectMembershipList } from '@shell/components/form/Members/ProjectMembershipEditor';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { Banner } from '@components/Banner';
import Loading from '@shell/components/Loading';
import { fetchProjectMembershipPermissions } from '@shell/utils/project-permissions';

export default {
  emits: ['input'],

  components: {
    ContainerResourceLimit, CruResource, Labels, Loading, NameNsDescription, ProjectMembershipEditor, ResourceQuota, Tabbed, Tab, Banner
  },

  inheritAttrs: false,

  mixins: [CreateEditView, FormValidation],

  async fetch() {
    if (!this.isCreate && this.value.id) {
      const permissions = await fetchProjectMembershipPermissions(this.$store, this.value.id);

      this.membershipPermission = permissions[this.value.id] || {};
    }
  },

  data() {
    this.value['spec'] = this.value.spec || {};
    this.value.spec['podSecurityPolicyTemplateId'] = this.value.status?.podSecurityPolicyTemplateId || '';

    return {
      projectRoleTemplateBindingSchema: this.$store.getters[`management/schemaFor`](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING),
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
      membershipHasOwner: false,
      membershipUpdate:   {},
      HARVESTER_TYPES,
      RANCHER_TYPES,
      fvFormRuleSets:     [{ path: 'spec.displayName', rules: ['required'] }],
      isQuotasValid:      true,

      // this project's member permissions; the binding schema only says what the user can do in *some* project
      membershipPermission: {},
    };
  },
  computed: {
    ...mapGetters(['currentCluster', 'isStandaloneHarvester']),

    // Show the Members tab to anyone who can view this project's member list; add/remove are separately
    // gated on full manage rights, so a view-only user gets a read-only members view instead of no tab.
    canViewMembers() {
      return canViewProjectMembershipList(this.$store) && (this.isCreate || !!this.membershipPermission.view);
    },

    canManageMembers() {
      return !!this.membershipPermission.create;
    },

    // Nothing on the page is editable for a user who can neither update the project nor manage its members
    formMode() {
      if (this.mode === _EDIT && !this.canEditProject && !this.canManageMembers) {
        return _VIEW;
      }

      return this.mode;
    },

    canEditProject() {
      return this.value?.links?.update;
    },

    isProjectReadOnly() {
      return (this.mode === _EDIT && !this.canEditProject) || false;
    },

    canEditTabElements() {
      if (this.mode === _EDIT && !this.canEditProject) {
        return _VIEW;
      }

      return this.mode;
    },

    showBannerForOnlyManagingMembers() {
      return this.formMode === _EDIT && !this.canEditProject;
    },

    isK3s() {
      return (this.currentCluster?.spec?.kubernetesVersion || '').includes('k3s');
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
    this.value.metadata['namespace'] = this.$store.getters['currentCluster'].id;
    this.value['spec'] = this.value.spec || {};
    this.value.spec['containerDefaultResourceLimit'] = this.value.spec.containerDefaultResourceLimit || {};
    // norman (and matching steve) resources treat annotations containing `cattle.io` as immutable, so only do this for the create world
    if (this.isCreate && !this.$store.getters['auth/principalId'].includes('local://')) {
      this.value.metadata.annotations[CREATOR_PRINCIPAL_ID] = this.$store.getters['auth/principalId'];
    }
  },
  methods: {
    validateQuotas(isValid) {
      this.isQuotasValid = isValid;
    },
    async save(saveCb) {
      try {
        this.errors = [];

        // clear up of the unused resourceQuotas will now be done on the model side
        if (this.mode === _CREATE) {
          const savedProject = await this.value.save();

          if (this.membershipUpdate.save) {
            await this.membershipUpdate.save(savedProject.id);
          }
        } else if (this.mode === _EDIT) {
          if (this.canEditProject) {
            await this.value.save(true);

            // We updated the Norman resource - re-fetch the Steve resource so we know it is definitely updated in the store
            await this.$store.dispatch('management/find', {
              type: MANAGEMENT.PROJECT,
              id:   this.value.id,
              opt:  { force: true }
            });
          }

          // We allow users with permissions for projectroletemplatebindings to be able to manage members on projects
          if (this.membershipUpdate.save) {
            const norman = await this.value.norman;

            await this.membershipUpdate.save(norman.id);
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
      this['membershipHasOwner'] = hasOwner;
    },

    onMembershipUpdate(update) {
      this['membershipUpdate'] = update;
    },

    onQuotasInput({ projectLimit, nsLimit }) {
      this.value.spec.resourceQuota = { ...this.value.spec.resourceQuota, limit: projectLimit };
      this.value.spec.namespaceDefaultResourceQuota = { ...this.value.spec.namespaceDefaultResourceQuota, limit: nsLimit };
    }
  },
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="project"
    :done-route="value.listLocation"
    :errors="fvUnreportedValidationErrors"
    :mode="formMode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="fvFormIsValid && isQuotasValid"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :name-editable="true"
      :mode="formMode"
      :namespaced="false"
      description-key="spec.description"
      :name-disabled="isProjectReadOnly"
      :description-disabled="isProjectReadOnly"
      name-key="spec.displayName"
      :normalize-name="false"
      :rules="{ name: fvGetAndReportPathRules('spec.displayName'), namespace: [], description: [] }"
      @update:value="$emit('input', $event)"
    />
    <Tabbed
      :side-tabs="true"
      :use-hash="useTabbedHash"
      :default-tab="defaultTab"
    >
      <Tab
        v-if="canViewMembers"
        name="members"
        :label="t('project.members.label')"
        :weight="10"
      >
        <Banner
          v-if="showBannerForOnlyManagingMembers"
          color="info"
          :label="t('project.membersEditOnly')"
        />
        <ProjectMembershipEditor
          :mode="formMode"
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
        <ResourceQuota
          :value="value"
          :mode="canEditTabElements"
          :types="isStandaloneHarvester ? HARVESTER_TYPES : RANCHER_TYPES"
          @input="onQuotasInput"
          @validationChanged="validateQuotas"
        />
      </Tab>
      <Tab
        name="container-default-resource-limit"
        :label="resourceQuotaLabel"
        :weight="8"
      >
        <ContainerResourceLimit
          v-model:value="value.spec.containerDefaultResourceLimit"
          :mode="canEditTabElements"
          :show-tip="false"
          :register-before-hook="registerBeforeHook"
        />
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

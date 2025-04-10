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
import ProjectMembershipEditor, { canViewProjectMembershipEditor } from '@shell/components/form/Members/ProjectMembershipEditor';
import { CREATOR_PRINCIPAL_ID } from '@shell/config/labels-annotations';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';
import { Banner } from '@components/Banner';

export default {
  emits: ['input'],

  components: {
    ContainerResourceLimit, CruResource, Labels, NameNsDescription, ProjectMembershipEditor, ResourceQuota, Tabbed, Tab, Banner
  },

  inheritAttrs: false,

  mixins: [CreateEditView, FormValidation],
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
    };
  },
  computed: {
    ...mapGetters(['currentCluster', 'isStandaloneHarvester']),

    canViewMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },

    canEditProject() {
      return this.value?.links?.update;
    },

    isDescriptionDisabled() {
      return (this.mode === _EDIT && !this.canEditProject) || false;
    },

    canEditTabElements() {
      if (this.mode === _EDIT && !this.canEditProject) {
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

    removeQuota(key) {
      ['resourceQuota', 'namespaceDefaultResourceQuota'].forEach((specProp) => {
        if (this.value?.spec[specProp]?.limit && this.value?.spec[specProp]?.limit[key]) {
          delete this.value?.spec[specProp]?.limit[key];
        }
        if (this.value?.spec[specProp]?.usedLimit && this.value?.spec[specProp]?.usedLimit[key]) {
          delete this.value?.spec[specProp]?.usedLimit[key];
        }
      });
    }
  },
};
</script>
<template>
  <CruResource
    class="project"
    :done-route="value.listLocation"
    :errors="fvUnreportedValidationErrors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="fvFormIsValid"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription
      :value="value"
      :name-editable="true"
      :mode="mode"
      :namespaced="false"
      description-key="spec.description"
      :description-disabled="isDescriptionDisabled"
      name-key="spec.displayName"
      :normalize-name="false"
      :rules="{ name: fvGetAndReportPathRules('spec.displayName'), namespace: [], description: [] }"
      @update:value="$emit('input', $event)"
    />
    <Tabbed :side-tabs="true">
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
        <ResourceQuota
          :value="value"
          :mode="canEditTabElements"
          :types="isStandaloneHarvester ? HARVESTER_TYPES : RANCHER_TYPES"
          @remove="removeQuota"
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

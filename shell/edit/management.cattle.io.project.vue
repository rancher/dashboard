<script>
import { mapGetters } from 'vuex';
import ContainerResourceLimit from '@shell/components/ContainerResourceLimit';
import CreateEditView from '@shell/mixins/create-edit-view';
import FormValidation from '@shell/mixins/form-validation';
import CruResource from '@shell/components/CruResource';
import Labels from '@shell/components/form/Labels';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import ResourceQuota from '@shell/components/form/ResourceQuota/Project';
import { HARVESTER_TYPES, RANCHER_TYPES } from '@shell/components/form/ResourceQuota/shared';
import Tab from '@shell/components/Tabbed/Tab';
import Tabbed from '@shell/components/Tabbed';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import { MANAGEMENT } from '@shell/config/types';
import { NAME } from '@shell/config/product/explorer';
import { PROJECT_ID, _VIEW, _CREATE, _EDIT } from '@shell/config/query-params';
import ProjectMembershipEditor from '@shell/components/form/Members/ProjectMembershipEditor';
import { canViewProjectMembershipEditor } from '@shell/components/form/Members/ProjectMembershipEditor.vue';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/product/harvester-manager';
import { Banner } from '@components/Banner';

export default {
  components: {
    ContainerResourceLimit, CruResource, Labels, LabeledSelect, NameNsDescription, ProjectMembershipEditor, ResourceQuota, Tabbed, Tab, Banner
  },

  mixins: [CreateEditView, FormValidation],
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
    ...mapGetters(['currentCluster']),

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
            await this.membershipUpdate.save(savedProject.id);
          }
        } else if (this.mode === _EDIT) {
          if (this.canEditProject) {
            await this.value.save(true);
          }

          // // we allow users with permissions for projectroletemplatebindings to be able to manage members on projects
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
      this.$set(this, 'membershipHasOwner', hasOwner);
    },

    onMembershipUpdate(update) {
      this.$set(this, 'membershipUpdate', update);
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
      v-model="value"
      :name-editable="true"
      :mode="mode"
      :namespaced="false"
      description-key="spec.description"
      :description-disabled="isDescriptionDisabled"
      name-key="spec.displayName"
      :normalize-name="false"
      :rules="{ name: fvGetAndReportPathRules('spec.displayName'), namespace: [], description: [] }"
    />
    <div class="row mb-20">
      <div class="col span-3">
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
          v-model="value"
          :mode="canEditTabElements"
          :types="isHarvester ? HARVESTER_TYPES : RANCHER_TYPES"
          @remove="removeQuota"
        />
      </Tab>
      <Tab
        name="container-default-resource-limit"
        :label="resourceQuotaLabel"
        :weight="8"
      >
        <ContainerResourceLimit
          v-model="value.spec.containerDefaultResourceLimit"
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

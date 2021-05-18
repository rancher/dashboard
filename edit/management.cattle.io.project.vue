<script>
import ContainerResourceLimit from '@/components/ContainerResourceLimit';
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import Labels from '@/components/form/Labels';
import ResourceQuota from '@/components/form/ResourceQuota';
import Tab from '@/components/Tabbed/Tab';
import Tabbed from '@/components/Tabbed';
import NameNsDescription from '@/components/form/NameNsDescription';
import { MANAGEMENT, NORMAN } from '@/config/types';
import Loading from '@/components/Loading';
import { NAME } from '@/config/product/explorer';
import { PROJECT_ID } from '@/config/query-params';
import ArrayList from '@/components/form/ArrayList';

export default {
  components: {
    ArrayList, ContainerResourceLimit, CruResource, Labels, Loading, NameNsDescription, ResourceQuota, Tabbed, Tab
  },
  mixins: [CreateEditView],

  async fetch() {
    const hydration = [
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
    ];
    const allBindings = this.projectRoleTemplateBindingSchema ? await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING }) : [];
    const projectBindings = allBindings
      .filter(b => !b.user?.isSystem)
      .filter(b => b.project && (b.project.id === this.value.id));

    // Add the current user as the project owner. This will get created by default
    if (projectBindings.length === 0) {
      projectBindings.push(await this.$store.dispatch(`management/create`, {
        type:                  MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateName:      'project-owner',
        userPrincipalName:     this.$store.getters['auth/principalId'],
      }));
    }

    await Promise.all(hydration);
    this.$set(this, 'projectBindings', projectBindings);
    this.$set(this, 'lastSavedProjectBindings', projectBindings);
  },

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
      resource:                 MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
      projectBindings:          [],
      lastSavedProjectBindings: [],
    };
  },

  computed: {
    hasOwnerBinding() {
      return this.projectBindings.some(b => b.roleTemplate.id === 'project-owner');
    }
  },
  watch: {
    hasOwnerBinding() {
      this.errors = this.hasOwnerBinding ? [] : [this.t('project.haveOneOwner')];
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
        const normanProject = this.isCreate ? await this.createProject() : await this.editProject();
        const savedProject = await normanProject.save();

        await this.saveBindings(savedProject.id);

        saveCb(true);
        this.$router.replace(this.value.listLocation);
      } catch (ex) {
        saveCb(false);
      }
    },

    addMember() {
      this.$store.dispatch('cluster/promptModal', { component: 'AddProjectMemberDialog', resources: [this.createBindingsFromMember] });
    },

    async createBindingsFromMember(member) {
      const bindingPromises = member.roleTemplateIds.map(roleTemplateId => this.$store.dispatch(`management/create`, {
        type:                  MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING,
        roleTemplateName:      roleTemplateId,
        userPrincipalName:     member.userPrincipalId,
        projectName:           member.projectId,
      }));

      const bindings = await Promise.all(bindingPromises);

      this.$set(this, 'projectBindings', [...this.projectBindings, ...bindings]);
    },

    managementToNorman(projectId) {
      return (managementBinding) => {
        return this.$store.dispatch(`rancher/create`, {
          type:                  NORMAN.PROJECT_ROLE_TEMPLATE_BINDING,
          roleTemplateId:        managementBinding.roleTemplateName,
          userPrincipalId:       managementBinding.userPrincipalName,
          projectId:             projectId?.replace('/', ':'),
          projectRoleTemplateId: '',
          subjectKind:           'User',
          userId:                '',
          id:                    managementBinding.id?.replace('/', ':')
        });
      };
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
    },

    saveBindings(projectId) {
      const newBindings = this.projectBindings.filter(binding => !binding.id && !this.lastSavedProjectBindings.includes(binding));
      const missingBindings = this.lastSavedProjectBindings.filter(binding => !this.projectBindings.includes(binding));

      const newBindingsSavedPromises = newBindings
        .map(this.managementToNorman((projectId)))
        .map(async binding => (await binding).save());

      const missingBindingsDeletedPromises = missingBindings
        .map(this.managementToNorman(projectId))
        .map(async(bindingPromise) => {
          const binding = await bindingPromise;

          binding.remove({ url: `/v3/projectRoleTemplateBindings/${ binding.id }` });
        });

      return Promise.all([...newBindingsSavedPromises, ...missingBindingsDeletedPromises]);
    },
  }
};
</script>
<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="project"
    :done-route="'c-cluster-product-projectsnamespaces'"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="hasOwnerBinding"
    @error="e=>errors = e"
    @finish="save"
    @cancel="done"
  >
    <NameNsDescription v-model="value" :mode="mode" :namespaced="false" description-key="spec.description" name-key="spec.displayName" />
    <Tabbed :side-tabs="true">
      <Tab name="members" :label="t('project.members.label')" :weight="10">
        <ArrayList
          v-model="projectBindings"
          :show-header="true"
        >
          <template #column-headers>
            <div class="box mb-0">
              <div class="column-headers row">
                <div class="col span-6">
                  <label class="text-label">{{ t('project.members.user') }}</label>
                </div>
                <div class="col span-6">
                  <label class="text-label">{{ t('project.members.role') }}</label>
                </div>
              </div>
            </div>
          </template>
          <template #columns="{row}">
            <div class="columns row">
              <div class="col span-6">
                <Principal :key="row.value.userPrincipalName" :value="row.value.userPrincipalName" />
              </div>
              <div class="col span-6 role">
                {{ row.value.roleDisplay }}
              </div>
            </div>
          </template>
          <template #add>
            <button
              type="button"
              class="btn role-primary mt-10"
              @click="addMember"
            >
              {{ t('generic.add') }}
            </button>
          </template>
          <template #remove-button="{remove, i}">
            <span v-if="isCreate && i === 0" />
            <button v-else type="button" :disabled="isView" class="btn role-link" @click="remove">
              {{ t('generic.remove') }}
            </button>
          </template>
        </ArrayList>
      </Tab>
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
.project {
  ::v-deep {
    .tabs {
      min-width: 250px;
    }

    .role {
      display: flex;
      align-items: center;
      flex-direction: row;
    }
  }
}
</style>

<script>
import { MANAGEMENT, NORMAN, VIRTUAL_TYPES } from '@shell/config/types';
import ResourceTable from '@shell/components/ResourceTable';
import Masthead from '@shell/components/ResourceList/Masthead';
import { AGE, ROLE, STATE, PRINCIPAL } from '@shell/config/table-headers';
import { canViewClusterPermissionsEditor } from '@shell/components/form/Members/ClusterPermissionsEditor.vue';
import Banner from '@components/Banner/Banner.vue';
import Tabbed from '@shell/components/Tabbed/index.vue';
import Tab from '@shell/components/Tabbed/Tab.vue';
import SortableTable from '@shell/components/SortableTable';
import { mapGetters } from 'vuex';
import { canViewProjectMembershipEditor } from '@shell/components/form/Members/ProjectMembershipEditor.vue';
import { allHash } from '@shell/utils/promise';
import { HARVESTER_NAME as HARVESTER } from '@shell/config/features';

/**
 * Explorer members page.
 * Route: /c/local/explorer/members
 */
export default {
  name: 'ExplorerMembers',

  components: {
    Banner,
    Masthead,
    ResourceTable,
    Tabbed,
    Tab,
    SortableTable
  },

  props: {
    // Cluster tole template binding create route - defaults to the explorer route
    createLocationOverride: {
      type:    Object,
      default: () => {
        return {
          name:   'c-cluster-product-resource-create',
          params: { resource: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }
        };
      }
    }
  },

  async fetch() {
    const clusterRoleTemplateBindingSchema = this.$store.getters[
      `rancher/schemaFor`
    ](NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING);

    const projectRoleTemplateBindingSchema = this.$store.getters['rancher/schemaFor'](NORMAN.PROJECT_ROLE_TEMPLATE_BINDING);

    this['normanClusterRTBSchema'] = clusterRoleTemplateBindingSchema;
    this['normanProjectRTBSchema'] = projectRoleTemplateBindingSchema;

    if (clusterRoleTemplateBindingSchema) {
      Promise.all([
        this.$store.dispatch(`rancher/findAll`, { type: NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING }, { root: true }),
        this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING })
      ]).then(([normanBindings]) => {
        this['normanClusterRoleTemplateBindings'] = normanBindings;
        this.loadingClusterBindings = false;
      });
    }

    if (projectRoleTemplateBindingSchema) {
      this.$store.dispatch('rancher/findAll', { type: NORMAN.PROJECT_ROLE_TEMPLATE_BINDING }, { root: true })
        .then((bindings) => {
          this['projectRoleTemplateBindings'] = bindings;
          this.loadingProjectBindings = false;
        });
    }

    this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT })
      .then((projects) => (this['projects'] = projects));

    const hydration = {
      normanPrincipals:  this.$store.dispatch('rancher/findAll', { type: NORMAN.PRINCIPAL }),
      mgmt:              this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.USER }),
      mgmtRoleTemplates: this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.ROLE_TEMPLATE }),
    };

    await allHash(hydration);
  },

  data() {
    return {
      schema: this.$store.getters[`management/schemaFor`](
        MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING
      ),
      headers:        [STATE, PRINCIPAL, ROLE, AGE],
      createLocation: {
        ...this.createLocationOverride,
        params: {
          ...this.createLocationOverride.params,
          cluster: this.$store.getters['currentCluster'].id
        }
      },
      resource:                          MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING,
      normanClusterRTBSchema:            null,
      normanProjectRTBSchema:            null,
      normanClusterRoleTemplateBindings: [],
      projectRoleTemplateBindings:       [],
      projects:                          [],
      VIRTUAL_TYPES,
      projectRoleTemplateColumns:        [
        STATE,
        {
          name:      'member',
          labeKey:   'generic.name',
          value:     'principalId',
          formatter: 'Principal'
        },
        {
          name:     'role',
          labelKey: 'tableHeaders.role',
          value:    'roleTemplate.nameDisplay'
        },
      ],
      loadingProjectBindings: true,
      loadingClusterBindings: true
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    clusterRoleTemplateBindings() {
      return this.normanClusterRoleTemplateBindings.map((b) => b.clusterroletemplatebinding) ;
    },
    filteredClusterRoleTemplateBindings() {
      return this.clusterRoleTemplateBindings.filter(
        (b) => b?.clusterName === this.$store.getters['currentCluster'].id
      );
    },
    filteredProjects() {
      return this.projects.reduce((all, p) => {
        if (p?.spec?.clusterName === this.currentCluster.id) {
          all[p.id] = p;
        }

        return all;
      }, {});
    },
    filteredProjectRoleTemplateBindings() {
      const out = this.projectRoleTemplateBindings.filter((rb) => {
        const projectId = rb.projectId.replace(':', '/');

        return !!this.filteredProjects[projectId];
      });

      return out;
    },
    projectsWithoutRoles() {
      const inUse = this.filteredProjectRoleTemplateBindings.reduce((projects, binding) => {
        const thisProjectId = (binding.projectId || '').replace(':', '/');

        if (!projects.includes(thisProjectId)) {
          projects.push(thisProjectId);
        }

        return projects;
      }, []);

      return Object.keys(this.filteredProjects).reduce((all, projectId) => {
        const project = this.filteredProjects[projectId];

        if ( !inUse.includes(projectId)) {
          all.push(project);
        }

        return all;
      }, []);
    },

    // We're using this because we need to show projects as groups even if the project doesn't have any role bindings
    rowsWithFakeProjects() {
      const fakeRows = this.projectsWithoutRoles.map((project) => {
        return {
          groupByLabel:     `${ ('resourceTable.groupLabel.notInAProject') }-${ project.id }`,
          isFake:           true,
          mainRowKey:       project.id,
          nameDisplay:      project.spec?.displayName, // Enable filtering by the project name
          project,
          availableActions: [],
          projectId:        project.id
        };
      });

      // We need to group each of the TemplateRoleBindings by the user + project
      const userRoles = [...fakeRows, ...this.filteredProjectRoleTemplateBindings].reduce((rows, curr) => {
        const {
          userId, groupPrincipalId, roleTemplate, projectId
        } = curr;

        const userOrGroup = userId || groupPrincipalId;

        if (!userOrGroup) {
          return rows;
        }

        const userOrGroupKey = userOrGroup + projectId;

        if (!rows[userOrGroupKey] ) {
          rows[userOrGroupKey] = curr;
          rows[userOrGroupKey].allRoles = [];
        }

        if (roleTemplate) {
          rows[userOrGroupKey].allRoles.push(curr.roleTemplate);
        }

        return rows;
      }, {});

      return Object.values(userRoles);
    },
    canManageMembers() {
      return canViewClusterPermissionsEditor(this.$store);
    },
    canManageProjectMembers() {
      return canViewProjectMembershipEditor(this.$store);
    },
    isLocal() {
      return this.$store.getters['currentCluster'].isLocal;
    },
    canEditProjectMembers() {
      return this.normanProjectRTBSchema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },
    canEditClusterMembers() {
      return this.normanClusterRTBSchema?.collectionMethods.find((x) => x.toLowerCase() === 'post');
    },
    isHarvester() {
      return this.$store.getters['currentProduct'].inStore === HARVESTER;
    },
  },
  methods: {
    getMgmtProjectId(group) {
      return group.group.key.replace(':', '/');
    },
    getMgmtProject(group) {
      return this.$store.getters['management/byId'](MANAGEMENT.PROJECT, this.getMgmtProjectId(group));
    },
    getProjectLabel(group) {
      return this.getMgmtProject(group)?.spec?.displayName;
    },
    addProjectMember(group) {
      this.$store.dispatch('cluster/promptModal', {
        component:      'AddProjectMemberDialog',
        componentProps: {
          projectId:   group.group.key.replace('/', ':'),
          saveInModal: true
        },
        modalSticky: true
      });
    },

    getProjectRoleBinding(row, role) {
      // Each row is a combination of project, role and user/group
      // So find the specfic roleBindingTemplate corresponding to the specific project, role + user/group
      const userOrGroupKey = row.userId ? 'userId' : 'groupPrincipalId';

      return this.projectRoleTemplateBindings.find((r) => {
        return r.projectId === row.projectId && r.roleTemplateId === role.id && r[userOrGroupKey] === row[userOrGroupKey];
      });
    },

    async removeRole(row, role, event) {
      const resource = this.getProjectRoleBinding(row, role);

      await resource.promptRemove();
    },

    viewRoleInAPI(row, role) {
      const resource = this.getProjectRoleBinding(row, role);

      if (resource?.canViewInApi) {
        resource.viewInApi();
      }
    },
    slotName(project) {
      return `main-row:${ project.id }`;
    },
  }
};
</script>

<template>
  <div class="project-members">
    <Masthead
      :schema="schema"
      :resource="resource"
      :favorite-resource="VIRTUAL_TYPES.CLUSTER_MEMBERS"
      :create-location="createLocation"
      :create-button-label="t('members.createActionLabel')"
      :is-creatable="false"
      :type-display="t('members.clusterAndProject')"
    />
    <Banner
      v-if="isLocal"
      color="error"
      :label="t('members.localClusterWarning')"
    />
    <Tabbed>
      <Tab
        name="cluster-membership"
        :label="t('members.clusterMembership')"
      >
        <div
          v-if="canEditClusterMembers"
          class="row mb-10 cluster-add"
        >
          <router-link
            :to="createLocation"
            class="btn role-primary pull-right"
          >
            {{ t('members.createActionLabel') }}
          </router-link>
        </div>
        <ResourceTable
          :schema="schema"
          :headers="headers"
          :rows="filteredClusterRoleTemplateBindings"
          :groupable="true"
          :show-grouping="true"
          :namespaced="false"
          :loading="$fetchState.pending || !currentCluster || loadingClusterBindings"
          sub-search="subSearch"
          :sub-fields="['nameDisplay']"
        />
      </Tab>
      <Tab
        v-if="canManageProjectMembers && !isHarvester"
        name="project-membership"
        :label="t('members.projectMembership')"
      >
        <SortableTable
          group-by="projectId"
          :loading="$fetchState.pending || !currentCluster || loadingProjectBindings"
          :rows="rowsWithFakeProjects"
          :headers="projectRoleTemplateColumns"
          :table-actions="false"
          :row-actions="false"
        >
          <template #group-by="group">
            <div class="group-bar">
              <div
                v-trim-whitespace
                class="group-tab"
              >
                <div
                  v-clean-html="getProjectLabel(group)"
                  class="project-name"
                />
              </div>
              <div class="right">
                <button
                  v-if="canEditProjectMembers"
                  type="button"
                  class="btn btn-sm role-secondary mr-10 right"
                  :data-testid="`add-project-member-${getProjectLabel(group).replace(' ', '').toLowerCase()}`"
                  @click="addProjectMember(group)"
                >
                  {{ t('members.createActionLabel') }}
                </button>
              </div>
            </div>
          </template>
          <template
            #cell:role="{row}"
          >
            <span
              v-for="(role, j) in row.allRoles"
              :key="j"
              ref="value"
              :data-testid="`role-value-${j}`"
              class="role"
            >
              <span
                class="role-value"
                :class="{'text-link-enabled' : row.canViewInApi}"
                @click="viewRoleInAPI(row, role)"
              >
                {{ role.nameDisplay }}
              </span>
              <i
                class="icon icon-close"
                :data-testid="`role-values-close-${j}`"
                @click="removeRole(row, role, $event)"
              />
            </span>
          </template>
          <template
            v-for="(project, i) in projectsWithoutRoles"
            :key="i"
            v-slot:[slotName(project)]
          >
            <tr
              class="main-row"
            >
              <td
                class="empty text-center"
                colspan="100%"
              >
                {{ t('members.noRolesAssigned') }}
              </td>
            </tr>
          </template>
        </SortableTable>
      </Tab>
    </Tabbed>
  </div>
</template>

<style lang='scss' scoped>

.role {
  align-items: center;
    background-color: rgba(0, 0, 0, 0.05);
    border: 1px solid var(--header-border);
    border-radius: 5px;
    color: var(--tag-text);
    line-height: 20px;
    padding: 2px 5px;
    white-space: nowrap;
    display: inline-flex;
    margin-right: 3px;
}

.role-value {
  &.text-link-enabled {
    cursor: pointer;
    &:hover {
      color: var(--primary);
    }
  }
  + .icon-close {
    margin-left: 3px;
    cursor: pointer;
    &:hover {
      color: var(--primary);
    }
  }
}

.project-members {
  & :deep() .group-bar{
    display: flex;
    justify-content: space-between;
  }
}
.cluster-add {
  justify-content: flex-end;
}
</style>

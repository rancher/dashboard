<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import Tab from '@shell/components/Tabbed/Tab';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import SortableTable from '@shell/components/SortableTable';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { NAME } from '@shell/config/table-headers';

export default {
  emits: ['input'],

  components: {
    Tab,
    ResourceTabs,
    SortableTable,
    Loading
  },
  mixins: [
    CreateEditView
  ],
  async fetch() {
    // Roles bound to one of the user's groups apply to the user too, so those bindings are shown alongside the user's own
    this.groupPrincipals = await this.fetchGroupPrincipals(this.value.id);

    const canSeeGlobalRoles = !!this.$store.getters[`management/canList`](MANAGEMENT.GLOBAL_ROLE);

    if (canSeeGlobalRoles) {
      this.globalBindings = await this.fetchGlobalRoleBindings(this.value.id);
    }

    this.canSeeRoleTemplates = !!this.$store.getters[`management/canList`](MANAGEMENT.ROLE_TEMPLATE);

    if (this.canSeeRoleTemplates) {
      // Upfront fetch, avoid async computes
      await Promise.all([
        await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE }),
        await this.$store.dispatch('management/findAll', { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING }),
        await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING })
      ]);
    }
  },
  data() {
    const role = {
      name:     'role',
      labelKey: 'user.detail.generic.tableHeaders.role',
      value:    'roleTemplate.displayName',
      sort:     'roleTemplate.displayName',
    };
    const since = {
      name:          'since',
      labelKey:      'user.detail.generic.tableHeaders.granted',
      value:         'metadata.creationTimestamp',
      sort:          'metadata.creationTimestamp:desc',
      search:        false,
      formatter:     'LiveDate',
      formatterOpts: { addSuffix: true },
      width:         '20%',
    };
    const grantedViaColumn = {
      name:     'grantedVia',
      labelKey: 'user.detail.generic.tableHeaders.grantedVia',
      value:    (row) => this.grantedVia(row),
      sort:     'groupPrincipalName',
      search:   false,
    };

    return {
      headers: {
        gp: [
          {
            name:      'permission',
            labelKey:  'user.detail.globalPermissions.tableHeaders.permission',
            value:     'hasBound',
            sort:      ['hasBound:desc'],
            formatter: 'Checked',
            width:     75,
            align:     'center'
          },
          NAME,
          {
            ...since,
            value: 'bound',
            sort:  'bound',
          }
        ],
        cr: [
          {
            name:          'cluster',
            labelKey:      'user.detail.clusterRoles.tableHeaders.cluster',
            value:         'clusterDisplayName',
            sort:          'clusterDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'clusterDetailLocation' },
          }, { ...role },
          { ...since }
        ],
        pr: [
          {
            name:          'project',
            labelKey:      'user.detail.projectRoles.tableHeaders.project',
            value:         'projectDisplayName',
            sort:          'projectDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'projectDetailLocation' },
          }, {
            name:          'cluster',
            labelKey:      'user.detail.clusterRoles.tableHeaders.cluster',
            value:         'clusterDisplayName',
            sort:          'clusterDisplayName',
            formatter:     'LinkDetail',
            formatterOpts: { reference: 'clusterDetailLocation' },
          }, { ...role },
          { ...since }
        ]
      },
      grantedViaColumn,
      globalBindings:      null,
      canSeeRoleTemplates: false,
      isAdmin:             false,
      groupPrincipals:     {},
    };
  },
  computed: {
    /**
     * Only show where a role comes from when the user is in a group, otherwise every role is a direct one
     */
    tableHeaders() {
      if (!Object.keys(this.groupPrincipals).length) {
        return this.headers;
      }

      const gp = [...this.headers.gp];

      gp.splice(2, 0, {
        ...this.grantedViaColumn,
        value: (row) => row.grantedVia.join(', '),
        sort:  'grantedVia',
      });

      return {
        gp,
        cr: [...this.headers.cr.slice(0, 2), this.grantedViaColumn, ...this.headers.cr.slice(2)],
        pr: [...this.headers.pr.slice(0, 3), this.grantedViaColumn, ...this.headers.pr.slice(3)],
      };
    },

    clusterBindings() {
      return this.canSeeRoleTemplates ? this.fetchClusterRoles(this.value.id) : null;
    },
    projectBindings() {
      return this.canSeeRoleTemplates ? this.fetchProjectRoles(this.value.id) : null;
    }

  },
  methods: {
    /**
     * The groups the user was in when they last logged in (or their memberships were refreshed), from their UserAttribute
     *
     * @returns map of group principal id to the group's display name. Empty if the user can't see UserAttributes
     */
    async fetchGroupPrincipals(userId) {
      if (!this.$store.getters['management/schemaFor'](MANAGEMENT.USER_ATTRIBUTE)) {
        return {};
      }

      try {
        const userAttribute = await this.$store.dispatch('management/find', { type: MANAGEMENT.USER_ATTRIBUTE, id: userId });
        const groups = Object.values(userAttribute?.GroupPrincipals || {}).flatMap((provider) => provider?.Items || []);

        return groups.reduce((out, group) => {
          const id = group?.metadata?.name;

          if (id) {
            out[id] = group.displayName || group.loginName || id;
          }

          return out;
        }, {});
      } catch (e) {
        // A user that has never logged in has no UserAttribute
        return {};
      }
    },

    isBoundToUser(binding, userId) {
      return binding.userName === userId || !!this.groupPrincipals[binding.groupPrincipalName];
    },

    grantedVia(binding) {
      return binding.groupPrincipalName ? this.groupPrincipals[binding.groupPrincipalName] : this.t('user.detail.generic.direct');
    },

    addGrantedVia(role, via) {
      if (!role.grantedVia.includes(via)) {
        role.grantedVia.push(via);
      }
    },

    async fetchGlobalRoleBindings(userId) {
      try {
        const roles = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE });

        const out = await Promise.all(roles
          .filter((r) => !r.isSpecial)
          .map((r) => this.$store.dispatch(`rancher/clone`, { resource: r }))
        );

        out.forEach((r) => {
          r.hasBound = false;
          r.grantedVia = [];
        });

        const globalRoleBindings = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.GLOBAL_ROLE_BINDING });

        globalRoleBindings
          .filter((binding) => this.isBoundToUser(binding, userId))
          .forEach((binding) => {
            const globalRole = roles.find((r) => r.id === binding.globalRoleName);
            const via = this.grantedVia(binding);

            if (globalRole.id === 'admin') {
              this.isAdmin = true;
            }

            if (globalRole.isSpecial) {
              this.getEnabledRoles(globalRole, out).forEach((r) => {
                r.hasBound = true;
                r.bound = binding?.metadata.creationTimestamp;
                this.addGrantedVia(r, via);
              });
            } else {
              const entry = out.find((o) => o.id === binding.globalRoleName);

              if (entry) {
                entry.hasBound = true;
                entry.bound = binding?.metadata.creationTimestamp;
                this.addGrantedVia(entry, via);
              }
            }
          });

        return out;
      } catch (e) {
        // Swallow the error. It's probably due to the user not having the correct permissions to read global roles
        console.error('Failed to fetch global role bindings: ', e); // eslint-disable-line no-console
      }
    },

    fetchClusterRoles(userId) {
      const templateBindings = this.$store.getters['management/all'](MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING);
      const userTemplateBindings = templateBindings.filter((binding) => this.isBoundToUser(binding, userId));

      // Upfront load clusters
      userTemplateBindings.map((b) => this.$store.dispatch('management/find', { type: MANAGEMENT.CLUSTER, id: b.clusterName }));

      return userTemplateBindings;
    },

    fetchProjectRoles(userId) {
      const templateBindings = this.$store.getters['management/all'](MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING );
      const userTemplateBindings = templateBindings.filter((binding) => this.isBoundToUser(binding, userId));

      // Upfront load projects
      userTemplateBindings.map((b) => this.$store.dispatch('management/find', { type: MANAGEMENT.PROJECT, id: b.projectId }));

      return userTemplateBindings;
    },

    // Global Permissions Helpers (brought over from ember)
    hasPermission(globalRoleRules, permission) {
      return globalRoleRules.find((gRule) => {
        return ((gRule.apiGroups || []).includes('*') || (gRule.apiGroups || []).includes(permission.apiGroup)) &&
        ((gRule.resources || []).includes('*') || (gRule.resources || []).includes(permission.resource)) &&
        ((gRule.verbs || []).includes('*') || (gRule.verbs || []).includes(permission.verb));
      })
      ;
    },
    containsRule(globalRoleRules, rule) {
      const apiGroups = (rule.apiGroups || []);
      const resources = (rule.resources || []);
      const verbs = (rule.verbs || []);
      const permissions = [];

      apiGroups.forEach((apiGroup) => resources.forEach((resource) => verbs.forEach((verb) => permissions.push({
        apiGroup,
        resource,
        verb
      }))));

      return permissions.every((permission) => this.hasPermission(globalRoleRules, permission));
    },
    getEnabledRoles(globalRole, out) {
      const globalRoleRules = globalRole.rules || [];

      return out.filter((r) => {
        // If the global role doesn't contain any rules... don't show the user as having the role (confusing)
        if (!r?.rules?.length) {
          return false;
        }

        return r.rules.every((rule) => this.containsRule(globalRoleRules, rule));
      });
    },

  }

};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <ResourceTabs
      :value="value"
      :mode="mode"
      @update:value="$emit('input', $event)"
    >
      <Tab
        v-if="globalBindings"
        label-key="user.detail.globalPermissions.label"
        name="gp"
        :weight="3"
      >
        <div class="subtext">
          {{ t("user.detail.globalPermissions.description") }}
        </div>
        <div
          v-if="isAdmin"
          class="admin"
        >
          {{ t("user.detail.globalPermissions.adminMessage") }}
        </div>
        <SortableTable
          v-else
          :rows="globalBindings"
          :headers="tableHeaders.gp"
          key-field="id"
          :table-actions="false"
          :row-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="clusterBindings"
        label-key="user.detail.clusterRoles.label"
        name="cr"
        :weight="2"
      >
        <div class="subtext">
          {{ t("user.detail.clusterRoles.description") }}
        </div>
        <SortableTable
          :rows="clusterBindings"
          :headers="tableHeaders.cr"
          key-field="id"
          :table-actions="false"
          :search="false"
        />
      </Tab>
      <Tab
        v-if="projectBindings"
        label-key="user.detail.projectRoles.label"
        name="pr"
        :weight="1"
      >
        <div class="subtext">
          {{ t("user.detail.projectRoles.description") }}
        </div>
        <SortableTable
          :rows="projectBindings"
          :headers="tableHeaders.pr"
          key-field="id"
          :table-actions="false"
          :search="false"
        />
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.subtext {
  margin-bottom: 10px;
  font-style: italic;
}
.admin {
  display: flex;
  justify-content: center;
  margin: 30px 0 10px;
  font-weight: bold;
}
</style>

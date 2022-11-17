<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Card } from '@components/Card';
import { RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { DESCRIPTION } from '@shell/config/labels-annotations';

export default {
  components: {
    Card,
    Checkbox,
    Loading,
    RadioGroup,
    SelectPrincipal
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },

    useTwoColumnsForCustom: {
      type:    Boolean,
      default: false
    }
  },
  async fetch() {
    const [, roleTemplates, projects] = await Promise.all([
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER }),
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE }),
      this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT })
    ]);

    this.roleTemplates = roleTemplates;
    this.projects = projects;
  },
  data() {
    this.setRoleTemplateIds(this.value.permissionGroup);

    return {
      customPermissions: [
        {
          key:   'create-ns',
          label: this.t('projectMembers.projectPermissions.createNs'),
          value: false,
        },
        {
          key:   'configmaps-manage',
          label: this.t('projectMembers.projectPermissions.configmapsManage'),
          value: false,
        },
        {
          key:   'ingress-manage',
          label: this.t('projectMembers.projectPermissions.ingressManage'),
          value: false,
        },
        {
          key:   'projectcatalogs-manage',
          label: this.t('projectMembers.projectPermissions.projectcatalogsManage'),
          value: false,
        },
        {
          key:   'projectroletemplatebindings-manage',
          label: this.t('projectMembers.projectPermissions.projectroletemplatebindingsManage'),
          value: false,
        },
        {
          key:   'secrets-manage',
          label: this.t('projectMembers.projectPermissions.secretsManage'),
          value: false,
        },
        {
          key:   'serviceaccounts-manage',
          label: this.t('projectMembers.projectPermissions.serviceaccountsManage'),
          value: false,
        },
        {
          key:   'services-manage',
          label: this.t('projectMembers.projectPermissions.servicesManage'),
          value: false,
        },
        {
          key:   'persistentvolumeclaims-manage',
          label: this.t('projectMembers.projectPermissions.persistentvolumeclaimsManage'),
          value: false,
        },
        {
          key:   'workloads-manage',
          label: this.t('projectMembers.projectPermissions.workloadsManage'),
          value: false,
        },
        {
          key:   'configmaps-view',
          label: this.t('projectMembers.projectPermissions.configmapsView'),
          value: false,
        },
        {
          key:   'ingress-view',
          label: this.t('projectMembers.projectPermissions.ingressView'),
          value: false,
        },
        {
          key:   'monitoring-ui-view',
          label: this.t('projectMembers.projectPermissions.monitoringUiView'),
          value: false,
        },
        {
          key:   'projectcatalogs-view',
          label: this.t('projectMembers.projectPermissions.projectcatalogsView'),
          value: false,
        },
        {
          key:   'projectroletemplatebindings-view',
          label: this.t('projectMembers.projectPermissions.projectroletemplatebindingsView'),
          value: false,
        },
        {
          key:   'secrets-view',
          label: this.t('projectMembers.projectPermissions.secretsView'),
          value: false,
        },
        {
          key:   'serviceaccounts-view',
          label: this.t('projectMembers.projectPermissions.serviceaccountsView'),
          value: false,
        },
        {
          key:   'services-view',
          label: this.t('projectMembers.projectPermissions.servicesView'),
          value: false,
        },
        {
          key:   'persistentvolumeclaims-view',
          label: this.t('projectMembers.projectPermissions.persistentvolumeclaimsView'),
          value: false,
        },
        {
          key:   'workloads-view',
          label: this.t('projectMembers.projectPermissions.workloadsView'),
          value: false,
        },
      ],
      projects:      [],
      roleTemplates: [],
    };
  },
  computed: {
    customRoles() {
      return this.roleTemplates
        .filter((role) => {
          return !role.builtin && !role.external && !role.hidden && role.context === 'project';
        });
    },

    options() {
      const customRoles = this.customRoles.map(role => ({
        label:       role.nameDisplay,
        description: role.description || role.metadata?.annotations?.[DESCRIPTION] || this.t('projectMembers.projectPermissions.noDescription'),
        value:       role.id
      }));

      return [
        {
          label:       this.t('projectMembers.projectPermissions.owner.label'),
          description: this.t('projectMembers.projectPermissions.owner.description'),
          value:       'owner'
        },
        {
          label:       this.t('projectMembers.projectPermissions.member.label'),
          description: this.t('projectMembers.projectPermissions.member.description'),
          value:       'member'
        },
        {
          label:       this.t('projectMembers.projectPermissions.readOnly.label'),
          description: this.t('projectMembers.projectPermissions.readOnly.description'),
          value:       'read-only'
        },
        ...customRoles,
        {
          label:       this.t('projectMembers.projectPermissions.custom.label'),
          description: this.t('projectMembers.projectPermissions.custom.description'),
          value:       'custom'
        }
      ];
    }
  },
  watch: {
    'value.permissionGroup'(newPermissionGroup) {
      this.setRoleTemplateIds(newPermissionGroup);
    },

    customPermissions: {
      deep: true,
      handler() {
        this.setRoleTemplateIds(this.value.permissionGroup);
      }
    }
  },
  methods: {
    onAdd(principalId) {
      this.$set(this.value, 'principalId', principalId);
    },

    setRoleTemplateIds(permissionGroup) {
      const roleTemplateIds = this.getRoleTemplateIds(permissionGroup);

      this.$set(this.value, 'roleTemplateIds', roleTemplateIds);
    },

    getRoleTemplateIds(permissionGroup) {
      if (permissionGroup === 'owner') {
        return ['project-owner'];
      }

      if (permissionGroup === 'member') {
        return ['project-member'];
      }

      if (permissionGroup === 'read-only') {
        return ['read-only'];
      }

      if (permissionGroup === 'custom') {
        return this.customPermissions
          .filter(permission => permission.value)
          .map(permission => permission.key);
      }

      return [permissionGroup];
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal
          project
          class="mb-20"
          :mode="mode"
          :retain-selection="true"
          @add="onAdd"
        />
      </div>
    </div>
    <Card
      class="m-0"
      :show-highlight-border="false"
      :show-actions="false"
    >
      <template v-slot:title>
        <div class="type-title">
          <h3>{{ t('projectMembers.projectPermissions.label') }}</h3>
          <div class="type-description">
            {{ t('projectMembers.projectPermissions.description') }}
          </div>
        </div>
      </template>
      <template v-slot:body>
        <RadioGroup
          v-model="value.permissionGroup"
          :options="options"
          name="permission-group"
        />
        <div
          v-if="value.permissionGroup === 'custom'"
          class="custom-permissions ml-20 mt-10"
          :class="{'two-column': useTwoColumnsForCustom}"
        >
          <Checkbox
            v-for="permission in customPermissions"
            :key="permission.key"
            v-model="permission.value"
            class="mb-5"
            :label="permission.label"
          />
        </div>
      </template>
    </Card>
  </div>
</template>
<style lang="scss" scoped>
$detailSize: 11px;

::v-deep .type-description {
    font-size: $detailSize;
}

label.radio {
  font-size: 16px;
}

.custom-permissions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  &.two-column {
    grid-template-columns: 1fr 1fr;
  }
}
</style>

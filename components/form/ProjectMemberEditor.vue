<script>
import CreateEditView from '@/mixins/create-edit-view';
import SelectPrincipal from '@/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@/config/types';
import Loading from '@/components/Loading';

export default {
  components: {
    Loading,
    SelectPrincipal
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    }
  },
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });
    this.projects = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.PROJECT });
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
      projects: [],
    };
  },
  computed: {
    projectOptions() {
      return this.projects
        .map(p => ({
          value: p.id.replace('/', ':'),
          label: p.nameDisplay
        }));
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
    onAdd(userId) {
      this.$set(this.value, 'userPrincipalId', userId);
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

      return this.customPermissions
        .filter(permission => permission.value)
        .map(permission => permission.key);
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal class="mb-20" :mode="mode" :retain-selection="true" @add="onAdd" />
      </div>
    </div>
    <div class="row">
      <div class="col span-12">
        <h3 class="mb-0">
          {{ t('projectMembers.projectPermissions.label') }}
        </h3>
        <label class="mt-0 mb-0">{{ t('projectMembers.projectPermissions.description') }}</label>
        <div class="mb-10 mt-20">
          <label class="radio">
            <input v-model="value.permissionGroup" :disabled="isView" type="radio" value="owner" />
            {{ t('projectMembers.projectPermissions.owner.label') }}
            <div class="text-small text-muted">{{ t('projectMembers.projectPermissions.owner.description') }}</div>
          </label>
        </div>
        <div class="mb-10">
          <label class="radio">
            <input v-model="value.permissionGroup" :disabled="isView" type="radio" value="member" />
            {{ t('projectMembers.projectPermissions.member.label') }}
            <div class="text-small text-muted">{{ t('projectMembers.projectPermissions.member.description') }}</div>
          </label>
        </div>
        <div class="mb-10">
          <label class="radio">
            <input v-model="value.permissionGroup" :disabled="isView" type="radio" value="read-only" />
            {{ t('projectMembers.projectPermissions.readOnly.label') }}
            <div class="text-small text-muted">{{ t('projectMembers.projectPermissions.readOnly.description') }}</div>
          </label>
        </div>
        <div>
          <label class="radio">
            <input v-model="value.permissionGroup" :disabled="isView" type="radio" value="custom" />
            {{ t('projectMembers.projectPermissions.custom.label') }}
            <div class="text-small text-muted">{{ t('projectMembers.projectPermissions.custom.description') }}</div>
          </label>
        </div>
        <div v-if="value.permissionGroup === 'custom'" class="custom-permissions mt-10">
          <label v-for="permission in customPermissions" :key="permission.key" class="mb-5">
            <input v-model="permission.value" :disabled="isView" type="checkbox" />
            {{ permission.label }}
          </label>
        </div>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
label.radio {
  font-size: 16px;
}

.custom-permissions {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
}
</style>

<script>
import CreateEditView from '@/mixins/create-edit-view';
import CruResource from '@/components/CruResource';
import SelectPrincipal from '@/components/auth/SelectPrincipal';
import { MANAGEMENT, NORMAN } from '@/config/types';
import RadioGroup from '@/components/form/RadioGroup';
import Card from '@/components/Card';
import Loading from '@/components/Loading';
import Checkbox from '@/components/form/Checkbox';

export default {
  components: {
    Card,
    Checkbox,
    CruResource,
    Loading,
    RadioGroup,
    SelectPrincipal
  },

  mixins: [CreateEditView],
  async fetch() {
    await this.$store.dispatch('management/findAll', { type: MANAGEMENT.USER });
    this.roleTemplates = await this.$store.dispatch('management/findAll', { type: MANAGEMENT.ROLE_TEMPLATE });
  },
  data() {
    return {
      customPermissions: [
        {
          label: this.t('members.clusterPermissions.createProjects'),
          key:   'projects-create',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterBackups'),
          key:   'backups-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterCatalogs'),
          key:   'clustercatalogs-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageClusterMembers'),
          key:   'clusterroletemplatebindings-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageNodes'),
          key:   'nodes-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.manageStorage'),
          key:   'storage-manage',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewAllProjects'),
          key:   'projects-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterCatalogs'),
          key:   'clustercatalogs-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewClusterMembers'),
          key:   'clusterroletemplatebindings-view',
          value: false
        },
        {
          label: this.t('members.clusterPermissions.viewNodes'),
          key:   'nodes-view',
          value: false
        }
      ],
      permissionGroup: 'member',
      custom:          {},
      roleTemplates:     [],
      userPrincipalId: ''
    };
  },
  computed: {
    customRoles() {
      return this.roleTemplates
        .filter((role) => {
          return !role.builtin && !role.external && !role.hidden && role.context === 'cluster';
        });
    },
    doneLocationOverride() {
      return this.value.listLocation;
    },
    roleTemplateIds() {
      if (this.permissionGroup === 'owner') {
        return ['cluster-owner'];
      }

      if (this.permissionGroup === 'member') {
        return ['cluster-member'];
      }

      if (this.permissionGroup === 'custom') {
        return this.customPermissions
          .filter(permission => permission.value)
          .map(permission => permission.key);
      }

      return [this.permissionGroup];
    },
    options() {
      const customRoles = this.customRoles.map(role => ({
        label:       role.nameDisplay,
        description: role.description || this.t('members.clusterPermissions.noDescription'),
        value:       role.id
      }));

      return [
        {
          label:       this.t('members.clusterPermissions.owner.label'),
          description: this.t('members.clusterPermissions.owner.description'),
          value:       'owner'
        },
        {
          label:       this.t('members.clusterPermissions.member.label'),
          description: this.t('members.clusterPermissions.member.description'),
          value:       'member'
        },
        ...customRoles,
        {
          label:       this.t('members.clusterPermissions.custom.label'),
          description: this.t('members.clusterPermissions.custom.description'),
          value:       'custom'
        }
      ];
    }
  },
  methods: {
    onAdd(userId) {
      this.$set(this, 'userPrincipalId', userId);
    },
    async saveOverride() {
      const asyncBindings = this.roleTemplateIds.map(roleTemplateId => this.$store.dispatch(`rancher/create`, {
        type:            NORMAN.CLUSTER_ROLE_TEMPLATE_BINDING,
        clusterId:       this.$store.getters['currentCluster'].id,
        roleTemplateId,
        userPrincipalId: this.userPrincipalId
      }));

      const bindings = await Promise.all(asyncBindings);

      await Promise.all(bindings.map(binding => binding.save()));
      await this.$store.dispatch(`management/findAll`, { type: MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING, opt: { force: true } });

      this.$router.replace(this.value.listLocation);
    }
  }
};

</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    class="cluster-role-template-binding"
    :errors="errors"
    :mode="mode"
    :resource="value"
    :subtypes="[]"
    :can-yaml="false"
    :validation-passed="!!userPrincipalId"
    @error="e=>errors = e"
    @finish="saveOverride"
    @cancel="done"
  >
    <div class="row mt-10">
      <div class="col span-12">
        <SelectPrincipal class="mb-20" :mode="mode" :retain-selection="true" @add="onAdd" />
      </div>
    </div>

    <Card class="m-0" :show-highlight-border="false" :show-actions="false">
      <template v-slot:title>
        <div class="type-title">
          <h3>{{ t('members.clusterPermissions.label') }}</h3>
          <div class="type-description">
            {{ t('members.clusterPermissions.description') }}
          </div>
        </div>
      </template>
      <template v-slot:body>
        <RadioGroup
          v-model="permissionGroup"
          :options="options"
          name="permission-group"
        />
        <div v-if="permissionGroup === 'custom'" class="custom-permissions ml-20 mt-10">
          <Checkbox v-for="permission in customPermissions" :key="permission.key" v-model="permission.value" class="mb-5" :label="permission.label" />
        </div>
      </template>
    </Card>
  </CruResource>
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
}
</style>

<script>
import CreateEditView from '@shell/mixins/create-edit-view';
import SelectPrincipal from '@shell/components/auth/SelectPrincipal';
import { MANAGEMENT } from '@shell/config/types';
import Loading from '@shell/components/Loading';
import { Card } from '@components/Card';
import { RadioButton, RadioGroup } from '@components/Form/Radio';
import { Checkbox } from '@components/Form/Checkbox';
import { RcIconTooltip } from '@components/RcIconTooltip';
import { DESCRIPTION } from '@shell/config/labels-annotations';
import { getRoleLockProps } from '@shell/utils/membership-permissions';
import DOMPurify from 'dompurify';

export default {
  components: {
    Card,
    Checkbox,
    Loading,
    RadioButton,
    RadioGroup,
    RcIconTooltip,
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

    if (this.options.find((opt) => opt.value === this.value.permissionGroup)?.disabled) {
      this.value.permissionGroup = '';
      this.setRoleTemplateIds(this.value.permissionGroup);
    }
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
      const customRoles = this.customRoles.map((role) => ({
        label:       this.purifyOption(role.nameDisplay),
        description: this.purifyOption(role.description || role.metadata?.annotations?.[DESCRIPTION] || this.t('projectMembers.projectPermissions.noDescription')),
        value:       this.purifyOption(role.id),
        ...getRoleLockProps(role, this.roleTemplates, this.t),
      }));

      return [
        {
          label:       this.t('projectMembers.projectPermissions.owner.label'),
          description: this.t('projectMembers.projectPermissions.owner.description'),
          value:       'owner',
          ...getRoleLockProps('project-owner', this.roleTemplates, this.t)
        },
        {
          label:       this.t('projectMembers.projectPermissions.member.label'),
          description: this.t('projectMembers.projectPermissions.member.description'),
          value:       'member',
          ...getRoleLockProps('project-member', this.roleTemplates, this.t)
        },
        {
          label:       this.t('projectMembers.projectPermissions.readOnly.label'),
          description: this.t('projectMembers.projectPermissions.readOnly.description'),
          value:       'read-only',
          ...getRoleLockProps('read-only', this.roleTemplates, this.t)
        },
        ...customRoles,
        {
          label:       this.t('projectMembers.projectPermissions.custom.label'),
          description: this.t('projectMembers.projectPermissions.custom.description'),
          value:       'custom'
        }
      ];
    },
    customPermissionsUpdate() {
      return this.customPermissions.map((item) => Object.assign(item, getRoleLockProps(item.key, this.roleTemplates, this.t)));
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
      this.value['principalId'] = principalId;
    },

    setRoleTemplateIds(permissionGroup) {
      const roleTemplateIds = this.getRoleTemplateIds(permissionGroup);

      this.value['roleTemplateIds'] = roleTemplateIds;
    },

    getRoleTemplateIds(permissionGroup) {
      if (!permissionGroup) {
        return [];
      }

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
          .filter((permission) => permission.value)
          .map((permission) => permission.key);
      }

      return [permissionGroup];
    },
    purifyOption(option) {
      return DOMPurify.sanitize(option, { ALLOWED_TAGS: ['span'] });
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
          data-testid="cluster-member-select"
          project
          required
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
          v-model:value="value.permissionGroup"
          :mode="mode"
          data-testid="permission-options"
          :options="options"
          name="permission-group"
        >
          <template
            v-for="(option, i) in options"
            :key="i"
            #[i]="{ option: normalizedOption, isDisabled }"
          >
            <RadioButton
              v-model:value="value.permissionGroup"
              name="permission-group"
              :mode="mode"
              :radio-option-id="normalizedOption.radioOptionId"
              :val="option.value"
              :label="option.locked ? `${ option.label } (${ option.tooltip })` : option.label"
              :description="option.description"
              :disabled="isDisabled"
              :prevent-focus-on-radio-groups="true"
              :data-testid="`radio-button-${i}`"
            >
              <template #label>
                <span v-clean-html="option.label" />
                <RcIconTooltip
                  v-if="option.locked"
                  class="ml-5"
                  :content="option.tooltip"
                  icon-type="lock"
                  @click.stop.prevent
                  @keydown.enter.stop
                  @keydown.space.stop
                />
              </template>
            </RadioButton>
          </template>
        </RadioGroup>
        <div
          v-if="value.permissionGroup === 'custom'"
          class="custom-permissions ml-20 mt-10"
          :class="{'two-column': useTwoColumnsForCustom}"
        >
          <div
            v-for="(permission, i) in customPermissionsUpdate"
            :key="i"
          >
            <Checkbox
              v-model:value="permission.value"
              :mode="mode"
              :data-testid="`custom-permission-${i}`"
              :disabled="permission.locked"
              class="mb-5"
              :label="permission.label"
            />
            <RcIconTooltip
              v-if="permission.locked"
              :content="permission.tooltip"
              icon-type="lock"
            />
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>
<style lang="scss" scoped>
$detailSize: 11px;

:deep() .type-description {
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

  :deep() .checkbox-label {
    margin-right: 0;
  }
}
</style>

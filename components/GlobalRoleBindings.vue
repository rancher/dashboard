
<script>
import { mapGetters } from 'vuex';
import { RBAC } from '@/config/types';
import Checkbox from '@/components/form/Checkbox';
import { _CREATE, _VIEW } from '@/config/query-params';
import Loading from '@/components/Loading';
import { addObjects, isArray } from '@/utils/array';

/**
 * Display checkboxes for each global role, checked for given user or principal (group). Can save changes.
 */
export default {
  components: {
    Checkbox,
    Loading,
  },
  props:      {
    mode: {
      type:    String,
      default: _VIEW,
    },
    realMode: {
      type:    String,
      default: _VIEW,
    },
    type: {
      type:    String,
      default: 'group',
      validator(val) {
        return val === 'group' || val === 'user';
      }
    },
    groupPrincipalId: {
      type:     String,
      default: ''
    },
    userId: {
      type:     String,
      default: ''
    }
  },
  async fetch() {
    try {
      this.allRoles = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE });

      if (!this.sortedRoles) {
        this.sortedRoles = {
          global:  {},
          builtin: {},
          custom:  {}
        };

        this.allRoles.forEach((role) => {
          const roleType = this.getRoleType(role);

          if (roleType) {
            this.sortedRoles[roleType][role.id] = role;
          }
        });

        if (!this.isCreate) {
          this.globalRoleBindings = await this.$store.dispatch('management/findAll', { type: RBAC.GLOBAL_ROLE_BINDING });
        }

        this.update();
      }
    } catch (e) { }
  },
  data() {
    return {
      globalPermissions: [
        'admin',
        'restricted-admin',
        'user',
        'user-base',
      ],
      globalRoleBindings:    null,
      sortedRoles:           null,
      selectedRoles:         [],
      startingSelectedRoles: [],
      roleChanges:           {}
    };
  },
  computed: {
    ...mapGetters({ t: 'i18n/t' }),

    isCreate() {
      return this.realMode === _CREATE;
    },

    isUser() {
      return this.type === 'user';
    }
  },
  watch:    {
    groupPrincipalId(groupPrincipalId, oldGroupPrincipalId) {
      if (groupPrincipalId === oldGroupPrincipalId) {
        return;
      }
      this.update();
    },
    userId(userId, oldUserId) {
      if (userId === oldUserId) {
        return;
      }
      this.update();
    }
  },
  methods: {
    getRoleType(role) {
      if (this.globalPermissions.find(p => p === role.id)) {
        return 'global';
      } else if (role.builtin) {
        return 'builtin';
      } else {
        return 'custom';
      }
    },
    getUnique(...ids) {
      return `${ this.groupPrincipalId || this.userId }-${ ids.join('-') }`;
    },
    update() {
      this.selectedRoles = [];
      this.startingSelectedRoles = [];
      if (this.isCreate) {
        // Start with the new user default for each role
        Object.entries(this.sortedRoles).forEach(([roleType, types]) => {
          Object.entries(types).forEach(([roleId, mappedRole]) => {
            if (mappedRole.newUserDefault) {
              this.selectedRoles.push(roleId);
            }
          });
        });
      } else {
        // Start with the principal/user's roles
        if (!this.groupPrincipalId && !this.userId) {
          return;
        }

        const boundRoles = this.globalRoleBindings.filter((grb) => {
          return this.groupPrincipalId ? grb.groupPrincipalName === this.groupPrincipalId : grb.userName === this.userId;
        });

        Object.entries(this.sortedRoles).forEach(([roleType, types]) => {
          Object.entries(types).forEach(([roleId, mappedRole]) => {
            const boundRole = boundRoles.find(boundRole => boundRole.globalRoleName === roleId);

            if (!!boundRole) {
              this.selectedRoles.push(roleId);
              this.startingSelectedRoles.push({
                roleId,
                bindingId: boundRole.id
              });
            }
          });
        });
      }

      // Force an update to pump out the initial state
      this.checkboxChanged();
    },
    checkboxChanged() {
      const addRoles = this.selectedRoles
        .filter(selected => !this.startingSelectedRoles.find(startingRole => startingRole.roleId === selected));
      const removeBindings = this.startingSelectedRoles
        .filter(startingRole => !this.selectedRoles.find(selected => selected === startingRole.roleId))
        .map(startingRole => startingRole.bindingId);

      this.roleChanges = {
        initialRoles: this.startingSelectedRoles,
        addRoles,
        removeBindings
      };

      this.$emit('hasChanges', !!this.roleChanges.addRoles.length || !!this.roleChanges.removeBindings.length);
      this.$emit('canLogIn', this.confirmUserCanLogIn());
      this.$emit('changed', this.roleChanges);
    },
    async saveAddedRoles(userId) {
      const requestOptions = {
        type:               RBAC.GLOBAL_ROLE_BINDING,
        metadata:           { generateName: `grb-` },
      };

      if (this.groupPrincipalId) {
        requestOptions.groupPrincipalName = this.groupPrincipalId;
      } else {
        requestOptions.userName = userId || this.userId;
      }
      const newBindings = await Promise.all(this.roleChanges.addRoles.map(role => this.$store.dispatch(`management/create`, {
        ...requestOptions,
        globalRoleName: role,
      })));

      await Promise.all(newBindings.map(newBinding => newBinding.save()));
    },
    async saveRemovedRoles() {
      const existingBindings = await Promise.all(this.roleChanges.removeBindings.map(bindingId => this.$store.dispatch('management/find', {
        type: RBAC.GLOBAL_ROLE_BINDING,
        id:   bindingId
      })));

      await Promise.all(existingBindings.map(existingBinding => existingBinding.remove()));
    },
    /**
     * userId is optional, used when a user has just been created
     */
    async save(userId) {
      // Ensure roles are added before removed (in case by removing one user is unable to add another)
      await this.saveAddedRoles(userId);
      await this.saveRemovedRoles();
    },
    confirmUserCanLogIn() {
      const allRolesRules = [];

      Object.entries(this.sortedRoles).forEach(([roleType, types]) => {
        Object.entries(types).forEach(([roleId, mappedRole]) => {
          if (this.selectedRoles.includes(roleId)) {
            addObjects(allRolesRules, mappedRole.rules || []);
          }
        });
      });

      return allRolesRules.some(rule => this.isRuleValid(rule));
    },
    isRuleValid(rule) {
      // Brought over from Ember

      if (( rule.resources || [] ).some(resourceValidator) && ( rule.apiGroups || [] ).some(apiGroupValidator) && verbsValidator(( rule.verbs || [] ))) {
        return true;
      }

      return false;

      function resourceValidator(resource) {
        const resourcesRequiredForLogin = ['*', 'preferences', 'settings', 'features'];

        // console.log(`resourceValidator status: `, resourcesRequiredForLogin.includes(resource), resource);
        return resourcesRequiredForLogin.includes(resource);
      }

      function apiGroupValidator(apiGroup) {
        const apiGroupsRequiredForLogin = ['*', 'management.cattle.io'];

        // console.log(`apiGroupsRequiredForLogin status: `, apiGroupsRequiredForLogin.includes(apiGroup), apiGroup);
        return apiGroupsRequiredForLogin.includes(apiGroup);
      }

      function verbsValidator(verbs) {
        const restrictedTarget = ['get', 'list', 'watch'];
        const verbsRequiredForLogin = ['*', ...restrictedTarget];

        if (isArray(verbs) && verbs.length > 1) {
          // console.log(`verbsRequiredForLogin status 1: `, restrictedTarget.every(rt => verbs.includes(rt)), verbs);
          return restrictedTarget.every(rt => verbs.includes(rt));
        }

        // console.log(`verbsRequiredForLogin status 2: `, verbsRequiredForLogin.includes(verbs[0]), verbsRequiredForLogin, verbs);
        return verbsRequiredForLogin.includes(verbs[0]);
      }
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />

  <div v-else>
    <form v-if="selectedRoles">
      <div v-for="(sortedRole, roleType) in sortedRoles" :key="getUnique(roleType)" class="role-group mb-10">
        <template v-if="Object.keys(sortedRole).length">
          <h2>{{ t(`rbac.globalRoles.types.${roleType}.label`) }}</h2>
          <div class="type-description mb-10">
            {{ t(`rbac.globalRoles.types.${roleType}.description`, { isUser }) }}
          </div>
          <div class="checkbox-section" :class="'checkbox-section--' + roleType">
            <div v-for="(role, roleId) in sortedRoles[roleType]" :key="getUnique(roleType, roleId)" class="checkbox mb-10 mr-10">
              <Checkbox
                :key="getUnique(roleType, roleId, 'checkbox')"
                v-model="selectedRoles"
                :value-when-true="roleId"
                :label="role.nameDisplay"
                :mode="mode"
                @input="checkboxChanged"
              />
              <div class="description">
                {{ role.description }}
              </div>
            </div>
          </div>
        </template>
      </div>
    </form>
  </div>
</template>

<style lang='scss' scoped>
  $detailSize: 11px;
  .role-group {
    .type-description {
      font-size: $detailSize;
    }
    .checkbox-section {
      display: grid;

      grid-template-columns: repeat(3, 1fr);

      &--global {
        grid-template-columns: 100%;
      }

      .checkbox {
        display: flex;
        flex-direction: column;

        .description {
          font-size: $detailSize;
          margin-left: 20px;
          margin-top: 5px;
        }
      }
    }
  }
</style>

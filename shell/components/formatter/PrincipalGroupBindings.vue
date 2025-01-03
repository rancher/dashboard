<script>
import { NORMAN, MANAGEMENT } from '@shell/config/types';

export default {
  props: {
    value: {
      type:    String,
      default: ''
    },
  },
  computed: {

    boundRoles() {
      // need to use getter to fetch all NORMAN.PRINCIPAL, otherwise `rancher/byId` is not reactive...
      const principals = this.$store.getters['rancher/all'](NORMAN.PRINCIPAL);
      const globalRoleBindings = this.$store.getters['management/all'](MANAGEMENT.GLOBAL_ROLE_BINDING);

      const principal = principals.find((x) => x.id === this.value);

      return globalRoleBindings
        // Bindings for this group
        .filter((globalRoleBinding) => globalRoleBinding.groupPrincipalName === principal?.id)
        // Display name of role associated with binding
        .map((binding) => {
          const role = this.$store.getters['management/byId'](MANAGEMENT.GLOBAL_ROLE, binding.globalRoleName);

          return {
            detailLocation: role.detailLocation,
            label:          role ? role.displayName : role.id, // nameDisplay contains principal name, not required here
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
    }
  }
};
</script>

<template>
  <div class="pgb">
    <template
      v-for="(role, i) in boundRoles"
      :key="role.id"
    >
      <router-link :to="role.detailLocation">
        {{ role.label }}
      </router-link>
      <template v-if="i + 1 < boundRoles.length">
        ,&nbsp;
      </template>
    </template>
  </div>
</template>

<style lang='scss' scoped>
.pgb{
  display: flex;
  flex-wrap: wrap;
}
</style>

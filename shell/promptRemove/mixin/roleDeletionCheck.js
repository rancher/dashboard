import { mapState, mapGetters } from 'vuex';
import { resourceNames } from '@shell/utils/string';
import { MANAGEMENT } from '@shell/config/types';

export default {
  data() {
    return {
      warning:             '',
      info:                '',
      isLoading:           false,
    };
  },

  computed:   {
    ...mapState('action-menu', ['toRemove']),
    ...mapGetters({ t: 'i18n/t' }),

    names() {
      return this.toRemove.map(obj => obj.nameDisplay).slice(0, 5);
    },

    plusMore() {
      const remaining = this.toRemove.length - this.names.length;

      return this.t('promptRemove.andOthers', { count: remaining });
    },
  },
  watch: {
    value: {
      handler(neu) {
        this.handleRoleDeletionCheck(neu, neu[0].type);
      },
      immediate: true
    }
  },
  methods: {
    resourceNames,
    async handleRoleDeletionCheck(rolesToRemove, resourceType) {
      this.warning = '';
      this.isLoading = true;
      let resourceToCheck;
      let propToMatch;
      let numberOfRolesWithBinds = 0;
      let numberUniqueUsersWithBinds = 0;

      this.info = this.t('rbac.globalRoles.waiting', { count: rolesToRemove.length });

      switch (resourceType) {
      case MANAGEMENT.GLOBAL_ROLE:
        resourceToCheck = MANAGEMENT.GLOBAL_ROLE_BINDING;
        propToMatch = 'globalRoleName';
        break;
      default:
        resourceToCheck = MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING;
        propToMatch = 'roleTemplateName';
        break;
      }

      const data = await this.$store.dispatch('management/request', {
        url:           `/v1/${ resourceToCheck }`,
        method:        'get',
      }, { root: true });

      if (data.data && data.data.length) {
        rolesToRemove.forEach((toRemove) => {
          const usedRoles = data.data.filter(item => item[propToMatch] === toRemove.id);

          if (usedRoles.length) {
            const uniqueUsers = [...new Set(usedRoles.map(item => item.userName))];

            if (uniqueUsers.length) {
              numberOfRolesWithBinds++;
              numberUniqueUsersWithBinds += uniqueUsers.length;
            }
          }
        });

        setTimeout(() => {
          this.isLoading = false;
          if (numberOfRolesWithBinds && numberUniqueUsersWithBinds) {
            this.info = '';
            this.warning = this.t('rbac.globalRoles.usersBinded', { count: numberUniqueUsersWithBinds });
          } else {
            this.info = this.t('rbac.globalRoles.noBinding', null, true);
          }
        }, 3000);
      }
    },
  },
};

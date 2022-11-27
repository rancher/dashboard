import { mapState, mapGetters } from 'vuex';
import { resourceNames } from '@shell/utils/string';
import { MANAGEMENT } from '@shell/config/types';
import { SUBTYPE_MAPPING } from '@shell/models/management.cattle.io.roletemplate';
const CLUSTER = SUBTYPE_MAPPING.CLUSTER.key;

export default {
  data() {
    return {
      warning: '',
      info:    '',
    };
  },

  computed: {
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
        this.handleRoleDeletionCheck(neu, neu[0].type, this.$route.hash);
      },
      immediate: true
    }
  },
  methods: {
    resourceNames,
    async handleRoleDeletionCheck(rolesToRemove, resourceType, queryHash) {
      this.warning = '';
      let resourceToCheck;
      let propToMatch;
      let numberOfRolesWithBinds = 0;
      const uniqueUsersWithBinds = new Set();

      this.info = this.t('rbac.globalRoles.waiting', { count: rolesToRemove.length });

      switch (resourceType) {
      case MANAGEMENT.GLOBAL_ROLE:
        resourceToCheck = MANAGEMENT.GLOBAL_ROLE_BINDING;
        propToMatch = 'globalRoleName';
        break;
      default:
        if (queryHash.includes(CLUSTER)) {
          resourceToCheck = MANAGEMENT.CLUSTER_ROLE_TEMPLATE_BINDING;
        } else {
          resourceToCheck = MANAGEMENT.PROJECT_ROLE_TEMPLATE_BINDING;
        }
        propToMatch = 'roleTemplateName';
        break;
      }

      try {
        const request = await this.$store.dispatch('management/request', {
          url:    `/v1/${ resourceToCheck }`,
          method: 'get',
        }, { root: true });

        // We need to fetch the users here in order to get an accurate count when selecting global roles.
        const users = await this.$store.dispatch('management/request', {
          url:    `/v1/${ MANAGEMENT.USER }`,
          method: 'get',
        }, { root: true });

        const userMap = users.data?.reduce((map, user) => {
          if ( user.username ) {
            map[user.id] = user;
          }

          return map;
        }, {});

        if (request.data && request.data.length) {
          rolesToRemove.forEach((toRemove) => {
            const usedRoles = request.data.filter(item => item[propToMatch] === toRemove.id);

            if (usedRoles.length) {
              const uniqueUsers = [...new Set(usedRoles.map(item => item.userName).filter(user => userMap[user]))];

              if (uniqueUsers.length) {
                numberOfRolesWithBinds++;
                uniqueUsers.forEach(user => uniqueUsersWithBinds.add(user));
              }
            }
          });

          if (numberOfRolesWithBinds && uniqueUsersWithBinds.size) {
            this.info = '';
            this.warning = this.t('rbac.globalRoles.usersBound', { count: uniqueUsersWithBinds.size });
          } else {
            this.info = this.t('rbac.globalRoles.notBound', null, true);
          }
        } else {
          this.info = this.t('rbac.globalRoles.notBound', null, true);
        }
      } catch (e) {
        this.info = this.t('rbac.globalRoles.unableToCheck');
      }
    },
  },
};

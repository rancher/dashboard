import { _EDIT } from '@/config/query-params';
export default {
  available() {
    return true;
  },

  nameDisplay() {
    return 'Active Directory';
  },

  test() {
    return (username, password) => {
      return this.doAction('testAndApply', {
        username,
        password,
        enabled:               true,
        activeDirectoryConfig: this
      });
    };
  },

  wizardSteps() {
    return (t) => {
      return [
        {
          name:      'choose',
          label:  t('auth.chooseProvider'),
          ready:     false
        },
        {
          name:      'config',
          label:  t('auth.LDAP.steps.config'),
          ready:     false,
        },
        {
          name:      'schema',
          label:  t('auth.LDAP.steps.schema'),
          ready:     true,
        },
        {
          name:      'test',
          label:  t('auth.LDAP.steps.test'),
          ready:     false
        },
      ];
    };
  }
};

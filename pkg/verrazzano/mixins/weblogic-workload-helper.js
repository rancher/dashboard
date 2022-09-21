// Added by Verrazzano
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  mixins:   [VerrazzanoHelper],
  computed: {
    serverStartPolicyOptions() {
      return [
        { value: 'ADMIN_ONLY', label: this.t('verrazzano.weblogic.types.serverStartPolicy.adminOnly') },
        { value: 'IF_NEEDED', label: this.t('verrazzano.weblogic.types.serverStartPolicy.ifNeeded') },
        { value: 'NEVER', label: this.t('verrazzano.weblogic.types.serverStartPolicy.never') },
      ];
    },
    serverStartStateOptions() {
      return [
        { value: 'RUNNING', label: this.t('verrazzano.weblogic.types.serverStartState.running') },
        { value: 'ADMIN', label: this.t('verrazzano.weblogic.types.serverStartState.admin') },
      ];
    }
  },
};

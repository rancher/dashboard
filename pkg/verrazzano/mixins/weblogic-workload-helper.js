// Added by Verrazzano
import VerrazzanoHelper from '@pkg/mixins/verrazzano-helper';

export default {
  mixins:   [VerrazzanoHelper],
  computed: {
    logHomeLayoutOptions() {
      return [
        { value: 'Flat', label: this.t('verrazzano.weblogic.types.logHomeLayoutOptions.flat') },
        { value: 'ByServers', label: this.t('verrazzano.weblogic.types.logHomeLayoutOptions.byServers') },
      ];
    },
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

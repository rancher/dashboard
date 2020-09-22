import { _VIEW } from '@/config/query-params';
import { set } from '@/utils/object';

export default {
  showMasthead() {
    return (mode) => {
      return mode === _VIEW;
    };
  },

  applyDefaults() {
    return () => {
      if ( !this.charts ) {
        set(this, 'charts', [
          {}
        ]);
      }
    };
  },
};

import { _VIEW } from '@/config/query-params';

export default {
  showMasthead() {
    return (mode) => {
      return mode === _VIEW;
    };
  },

  applyDefaults() {
    return () => {
      if ( !this.charts ) {
        this.charts = [
          {}
        ];
      }
    };
  },
};

import { set } from '@/utils/object';

export default {
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

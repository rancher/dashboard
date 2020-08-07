export default {
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

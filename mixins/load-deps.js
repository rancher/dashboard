export default {
  data() {
    return { loading: true };
  },

  async mounted() {
    const deps = [];

    if ( this.loadDeps ) {
      deps.push(this.loadDeps());
    }

    for ( const child of this.$children ) {
      if ( child.loadDeps) {
        deps.push(child.loadDeps());
      }
    }

    if ( deps.length ) {
      if ( this.$refs.loader ) {
        this.$refs.loader.start();
      }

      if ( deps.length ) {
        try {
          await Promise.all(deps);
        } catch (e) {
          console.log('Load Deps error:', e);
        }
      }

      if ( this.$refs.loader ) {
        this.$refs.loader.finish();
      }
    }

    this.loading = false;
  },
};

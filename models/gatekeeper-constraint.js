export default {
  doneOverride() {
    return () => {
      this.currentRouter().replace({ name: 'c-cluster-gatekeeper-constraints' });
    };
  }
};

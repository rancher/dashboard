export default {
  canUpdate() {
    return this?.metadata?.state?.error;
  },
};

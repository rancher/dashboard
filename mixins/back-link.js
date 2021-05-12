export default {
  data() {
    return { backLink: null };
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.backLink = from;
    });
  }
};

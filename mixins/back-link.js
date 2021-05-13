export default {
  data() {
    return { backLink: null };
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      // Only store back link if we came from a product paeg
      // Otherwise its from a page that did not have nav
      if (Object.keys(from.params).length || from.name === 'home') {
        vm.backLink = from;
      }
    });
  }
};

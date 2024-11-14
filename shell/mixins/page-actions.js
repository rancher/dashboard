const STORE_PAGE_ACTIONS = 'pageActions';

export default {
  created() {
    this.updatePageActions();

    const pageActionHandler = (action) => {
      if (this.handlePageAction) {
        this.handlePageAction(action);
      }
    };

    this.$store.commit('pageActionHandler', pageActionHandler);
  },

  beforeUnmount() {
    if (this.pageActions) {
      this.$store.commit(STORE_PAGE_ACTIONS, []);
    }
    this.$store.commit('clearPageActionHandler');
  },

  methods: {
    updatePageActions() {
      if (this.pageActions) {
        this.$store.commit(STORE_PAGE_ACTIONS, this.pageActions);
      }
    }
  },

  watch: {
    pageActions(a, b) {
      this.updatePageActions();
    }
  }
};

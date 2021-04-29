const PAGE_ACTION = 'page-action';
const STORE_PAGE_ACTIONS = 'pageActions';

export default {
  created() {
    this.updatePageActions();
    this.$nuxt.$on(PAGE_ACTION, (action) => {
      if (this.handlePageAction) {
        this.handlePageAction(action);
      }
    });
  },

  beforeDestroy() {
    if (this.pageActions) {
      this.$store.commit(STORE_PAGE_ACTIONS, []);
    }
    this.$nuxt.$off(PAGE_ACTION);
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

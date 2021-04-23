const PAGE_HEADER_ACTION = 'page-header-action';
const PAGE_ACTIONS = 'pageActions';

export default {
  created() {
    this.updatePageHeaderActions();
    this.$nuxt.$on(PAGE_HEADER_ACTION, (action) => {
      if(this.handlePageHeaderAction) {
        this.handlePageHeaderAction(action)
      }
    });
  },

  beforeDestroy() {
    if (this.pageHeaderActions) {
      this.$store.commit(PAGE_ACTIONS, []);
    }
    this.$nuxt.$off(PAGE_HEADER_ACTION);
  },

  methods: {
    updatePageHeaderActions() {
      if (this.pageHeaderActions) {
        this.$store.commit(PAGE_ACTIONS, this.pageHeaderActions);
      }
    }
  },

  watch: {
    pageHeaderActions(a, b) {
      this.updatePageHeaderActions();
    }
  }
};

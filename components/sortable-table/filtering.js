export default {
  computed: {
    filteredRows() {
      return this.rows.slice();
    }
  },

  data: () => ({ searchQuery: null }),

  methods: {},

  created() {
    this.searchQuery = this.$route.query.q;
  }
};

import { EPINIO_MGMT_STORE, EPINIO_PRODUCT_NAME, EPINIO_TYPES } from '../types';

export default {

  props: {
    // The definition of the tab itself
    tab: {
      type:     Object,
      required: true,
    },

    // Is this tab currently displayed
    active: {
      type:     Boolean,
      required: true,
    },

    // The height of the window
    height: {
      type:     Number,
      required: true,
    },

    // The application to connect to
    application: {
      type:     Object,
      required: true,
    },

    endpoint: {
      type:     String,
      required: true,
    },
  },

  data() {
    return {
      socket:  null,
      isOpen:  false,
      backlog: [],
    };
  },

  computed: {
    instanceChoices() {
      return this.application.instances.map(i => i.id);
    },
  },

  methods: {
    async getRootSocketUrl() {
      const { token } = await this.$store.dispatch(`epinio/request`, { opt: { url: '/api/v1/authtoken' } });

      const isSingleProduct = !!this.$store.getters['isSingleProduct'];
      let api = '';
      let prependPath = '';

      if (isSingleProduct) {
        const cnsi = this.$store.getters[`${ EPINIO_PRODUCT_NAME }/singleProductCNSI`]();

        prependPath = `/pp/v1/direct/ws/${ cnsi?.guid }`;
      } else {
        const currentClusterId = this.$store.getters['clusterId'];
        const currentCluster = this.$store.getters[`${ EPINIO_MGMT_STORE }/byId`](EPINIO_TYPES.INSTANCE, currentClusterId);

        api = currentCluster.api;
      }

      return {
        url: `${ api }${ prependPath }${ this.endpoint }`.replace(/^http/, 'ws'),
        token
      };
    }
  }

};

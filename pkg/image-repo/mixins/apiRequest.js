import { harborAPI } from '../api/image-repo.js';
import { mapGetters } from 'vuex';

export default {
  async fetch() {
    const versionP = this.harborAPIRequest.fetchHarborVersion();

    const harborServerP = this.harborAPIRequest.fetchHarborServerUrl();

    const [harborVersionSetting, harborServerSetting] = await Promise.all([versionP, harborServerP]);

    this.harborServerSetting = harborServerSetting;
    this.harborVersionSetting = harborVersionSetting;
  },
  data() {
    return {
      settings:             null,
      harborServerSetting:  null,
      harborVersionSetting: null,
      errors:               [],
      principals:           [],
    };
  },
  computed: {
    ...mapGetters({ me: 'auth/me' }),

    harborAPIRequest() {
      const harborAPIRequest = harborAPI({ store: this.$store });

      if (this.harborServerSetting?.value) {
        harborAPIRequest.initAPIRequest(this.harborVersionSetting?.value ?? '', this.harborServerSetting.value);
      }

      return harborAPIRequest;
    }
  },
};

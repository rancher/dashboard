<script>
import CreateEditView from '@/mixins/create-edit-view';
import Loading from '@/components/Loading';
import CruResource from '@/components/CruResource';
import { REGISTER, _FLAGGED } from '@/config/query-params';
import { CAPI } from '@/config/types';
import { DEFAULT_WORKSPACE } from '@/models/rancher.cattle.io.cluster';
import Rke2 from './rke2';

export default {
  name: 'CruCluster',

  components: {
    Rke2, Loading, CruResource
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:     String,
      required: true,
    },

    doneRoute: {
      type:    String,
      default: null,
    },
  },

  async fetch() {
    if ( this.subType ) {
      await this.selectType(this.subType, false);
    }

    // @TODO actually pick based on provider type...
    this.providerCluster = await this.$store.dispatch(`management/create`, {
      type:     CAPI.RANCHER_CLUSTER,
      spec:     {},
      metadata: { namespace: DEFAULT_WORKSPACE }
    });
  },

  data() {
    const subType = this.$route.query['type'] || null;
    const isRegister = this.$route.query[REGISTER] === _FLAGGED;

    console.log('data, subType', subType);

    return {
      subType,
      isRegister,
      providerCluster: null,
    };
  },

  computed: {
    subTypes() {
      const out = [];

      // @TODO come from somewhere dynamic...
      const createTypes = ['amazonec2', 'amazoneks', 'digitalocean', 'custom'];
      const registerTypes = ['amazoneks', 'googlegke', 'azureaks'];

      const types = this.isRegister ? registerTypes : createTypes;

      types.forEach((type) => {
        const label = this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type);

        const subtype = {
          id:          type,
          bannerAbbrv: type,
          label,
        };

        out.push(subtype);
      });

      return out;
    },
  },

  methods: {
    selectType(type, fetch = true) {
      this.subType = type;
      this.$emit('set-subtype', this.$store.getters['i18n/withFallback'](`cluster.provider."${ type }"`, null, type));

      if ( fetch ) {
        this.$fetch();
      }
    },
  },
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <CruResource
    v-else
    :mode="mode"
    :validation-passed="true"
    :selected-subtype="subType"
    :resource="value"
    :errors="errors"
    :done-route="doneRoute"
    :subtypes="subTypes"
    @finish="save"
    @select-type="selectType"
    @error="e=>errors = e"
  >
    <!-- @TODO load appropriate component for provider -->
    <Rke2
      v-if="subType"
      v-model="providerCluster"
      :mode="mode"
      :provider="subType"
    />

    <template v-if="subType" #form-footer>
      <div><!-- Hide the outer footer --></div>
    </template>
  </CruResource>
</template>
